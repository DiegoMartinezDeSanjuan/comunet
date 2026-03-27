'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import type { UpdateDocumentInput } from '@/modules/documents/schema'
import { archiveDocument, updateDocument, uploadDocument } from './services'

async function getOfficeAndUser(permission: string) {
  const session = await requireAuth()
  if (!requirePermission(session, permission)) {
    throw new Error('FORBIDDEN')
  }
  return { officeId: session.officeId, userId: session.userId }
}

export async function uploadDocumentAction(formData: FormData) {
  const { officeId, userId } = await getOfficeAndUser('documents.manage')
  const file = formData.get('file')

  if (!(file instanceof File)) {
    throw new Error('Debes adjuntar un archivo.')
  }

  const document = await uploadDocument(
    officeId,
    userId,
    {
      communityId: String(formData.get('communityId') ?? ''),
      title: String(formData.get('title') ?? ''),
      category: String(formData.get('category') ?? '') || null,
      visibility: String(formData.get('visibility') ?? 'INTERNAL') as 'INTERNAL' | 'OWNERS' | 'PUBLIC',
    },
    file,
  )

  revalidatePath('/documents')
  revalidatePath(`/documents/${document.id}`)
  revalidatePath('/portal/documents')
  revalidatePath(`/communities/${document.communityId}`)
  return document
}

export async function updateDocumentAction(documentId: string, input: UpdateDocumentInput) {
  const { officeId, userId } = await getOfficeAndUser('documents.manage')
  const document = await updateDocument(officeId, userId, documentId, input)
  revalidatePath('/documents')
  revalidatePath(`/documents/${document.id}`)
  revalidatePath('/portal/documents')
  return document
}

export async function archiveDocumentAction(documentId: string) {
  const { officeId, userId } = await getOfficeAndUser('documents.manage')
  const document = await archiveDocument(officeId, userId, documentId)
  revalidatePath('/documents')
  revalidatePath(`/documents/${document.id}`)
  revalidatePath('/portal/documents')
  return document
}
