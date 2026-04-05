import 'server-only'

import { requireAuth } from '@/lib/auth'
import { requirePermission } from '@/lib/permissions'
import {
  findDocumentByIdForOffice,
  listDocumentCategoriesByOffice,
  listDocumentCommunitiesByOffice,
  listDocumentsPageByOffice,
  type DocumentListFilters,
  type PaginationInput,
} from './repository'

async function requireDocumentsReadAccess() {
  const session = await requireAuth()
  if (!requirePermission(session, 'documents.read')) {
    throw new Error('FORBIDDEN')
  }
  return session
}

export async function listDocumentsQuery(
  filters: DocumentListFilters = {},
  pagination: PaginationInput = {},
) {
  const session = await requireDocumentsReadAccess()
  const result = await listDocumentsPageByOffice(session.officeId, filters, pagination)
  return { ...result, session }
}

export async function getDocumentDetailQuery(documentId: string) {
  const session = await requireDocumentsReadAccess()
  const document = await findDocumentByIdForOffice(documentId, session.officeId)
  return { document, session }
}

export async function listDocumentCommunitiesQuery() {
  const session = await requireDocumentsReadAccess()
  return listDocumentCommunitiesByOffice(session.officeId)
}

export async function listDocumentCategoriesQuery() {
  const session = await requireDocumentsReadAccess()
  return listDocumentCategoriesByOffice(session.officeId)
}
