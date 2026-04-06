import { z } from 'zod'

/**
 * Reusable password schema based on OWASP/NIST guidelines.
 * Focuses on minimum length without imposing arbitrary complexity rules that reduce entropy.
 */
export const passwordSchema = z.string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña no puede exceder los 128 caracteres')
