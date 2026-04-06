import { UserRole } from '@prisma/client'

export interface Session {
  userId: string
  officeId: string
  role: UserRole
  name: string
  email: string
  linkedOwnerId: string | null
  linkedProviderId: string | null
}

export type AuthResult = 
  | { type: 'success'; session: Session }
  | { type: 'mfa_verify'; userId: string; role: UserRole }
  | { type: 'mfa_setup'; userId: string; role: UserRole }
  | { type: 'error'; message: string }
