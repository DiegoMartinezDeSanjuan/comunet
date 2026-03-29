import 'server-only'

import path from 'path'
import { prisma } from '@/lib/db'
import { storage } from '@/lib/storage'
import { logAudit } from '@/modules/audit/server/services'
import {
  uploadDocumentMetadataSchema,
  updateDocumentSchema,
  type UpdateDocumentInput,
  type UploadDocumentMetadataInput,
} from '@/modules/documents/schema'

const MAX_DOCUMENT_SIZE_BYTES = 8 * 1024 * 1024

function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'documento'
}

async function requireCommunityInOffice(officeId: string, communityId: string) {
  const community = await prisma.community.findFirst({
    where: {
      id: communityId,
      officeId,
      archivedAt: null,
    },
    select: {
      id: true,
      name: true,
      officeId: true,
    },
  })

  if (!community) {
    throw new Error('La comunidad no existe o no pertenece al despacho.')
  }

  return community
}

async function requireDocumentInOffice(officeId: string, documentId: string) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      community: {
        officeId,
        archivedAt: null,
      },
    },
    include: {
      community: {
        select: {
          id: true,
          name: true,
          officeId: true,
        },
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  })

  if (!document) {
    throw new Error('El documento no existe o no pertenece al despacho.')
  }

  return document
}

function validateFile(file: File) {
  if (!file.name) {
    throw new Error('Debes seleccionar un archivo válido.')
  }

  if (file.size <= 0) {
    throw new Error('El archivo está vacío.')
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error('El archivo supera el tamaño máximo permitido de 8 MB.')
  }
}

export async function uploadDocument(
  officeId: string,
  userId: string,
  rawMetadata: UploadDocumentMetadataInput,
  file: File,
) {
  const metadata = uploadDocumentMetadataSchema.parse(rawMetadata)
  validateFile(file)

  const community = await requireCommunityInOffice(officeId, metadata.communityId)
  const originalName = sanitizeFilename(file.name)
  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `${community.id}-${Date.now()}-${originalName}`
  const storagePath = await storage.save(filename, buffer, file.type || undefined)

  const document = await prisma.document.create({
    data: {
      communityId: community.id,
      category: metadata.category ?? null,
      title: metadata.title,
      storagePath,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      visibility: metadata.visibility,
      uploadedByUserId: userId,
    },
    include: {
      community: {
        select: {
          id: true,
          name: true,
        },
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  })

  logAudit({
    officeId,
    userId,
    entityType: 'DOCUMENT',
    entityId: document.id,
    action: 'CREATE',
    meta: {
      title: document.title,
      communityId: document.communityId,
      visibility: document.visibility,
      storagePath: document.storagePath,
      size: document.size,
    },
  })

  return document
}

export async function updateDocument(
  officeId: string,
  userId: string,
  documentId: string,
  rawInput: UpdateDocumentInput,
) {
  const input = updateDocumentSchema.parse(rawInput)
  const document = await requireDocumentInOffice(officeId, documentId)

  if (document.archivedAt) {
    throw new Error('El documento está archivado y no admite cambios.')
  }

  const updated = await prisma.document.update({
    where: { id: document.id },
    data: {
      title: input.title ?? undefined,
      category: input.category === undefined ? undefined : input.category,
      visibility: input.visibility ?? undefined,
    },
    include: {
      community: {
        select: {
          id: true,
          name: true,
        },
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  })

  logAudit({
    officeId,
    userId,
    entityType: 'DOCUMENT',
    entityId: updated.id,
    action: 'UPDATE',
    meta: {
      title: updated.title,
      visibility: updated.visibility,
      category: updated.category,
    },
  })

  return updated
}

export async function archiveDocument(officeId: string, userId: string, documentId: string) {
  const document = await requireDocumentInOffice(officeId, documentId)

  if (document.archivedAt) {
    return document
  }

  const archived = await prisma.document.update({
    where: { id: document.id },
    data: {
      archivedAt: new Date(),
    },
    include: {
      community: {
        select: {
          id: true,
          name: true,
        },
      },
      uploadedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  })

  logAudit({
    officeId,
    userId,
    entityType: 'DOCUMENT',
    entityId: archived.id,
    action: 'ARCHIVE',
    meta: {
      title: archived.title,
      storagePath: archived.storagePath,
    },
  })

  return archived
}

/**
 * Get a streaming download payload. The file is NOT loaded into memory.
 * For local storage: returns a ReadableStream backed by fs.createReadStream.
 * For S3: returns a ReadableStream from the SDK GetObjectCommand.
 */
export async function getDocumentDownloadStream(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      community: {
        select: {
          id: true,
          officeId: true,
        },
      },
    },
  })

  if (!document || document.archivedAt) {
    throw new Error('DOCUMENT_NOT_FOUND')
  }

  const stream = await storage.getDownloadStream(document.storagePath)
  const extension = path.extname(document.storagePath)
  const baseTitle = sanitizeFilename(document.title)
  const downloadName = extension ? `${baseTitle}${extension}` : baseTitle

  return {
    document,
    stream,
    downloadName,
    size: document.size,
  }
}

/**
 * Try to get a presigned URL for direct download (S3 only).
 * Returns null if storage adapter doesn't support presigned URLs (local).
 * The caller should fall back to streaming through the app server.
 */
export async function getDocumentPresignedUrl(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      community: {
        select: {
          id: true,
          officeId: true,
        },
      },
    },
  })

  if (!document || document.archivedAt) {
    throw new Error('DOCUMENT_NOT_FOUND')
  }

  const extension = path.extname(document.storagePath)
  const baseTitle = sanitizeFilename(document.title)
  const downloadName = extension ? `${baseTitle}${extension}` : baseTitle

  const url = await storage.getSignedDownloadUrl(
    document.storagePath,
    300,
    downloadName,
    document.mimeType || undefined
  )
  return url
}

/**
 * Legacy buffer-based download for backward compatibility.
 * Use getDocumentDownloadStream() for new code.
 * @deprecated Use getDocumentDownloadStream() instead.
 */
export async function getDocumentDownloadPayload(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      community: {
        select: {
          id: true,
          officeId: true,
        },
      },
    },
  })

  if (!document || document.archivedAt) {
    throw new Error('DOCUMENT_NOT_FOUND')
  }

  const buffer = await storage.read(document.storagePath)
  const extension = path.extname(document.storagePath)
  const baseTitle = sanitizeFilename(document.title)
  const downloadName = extension ? `${baseTitle}${extension}` : baseTitle

  return {
    document,
    buffer,
    downloadName,
  }
}
