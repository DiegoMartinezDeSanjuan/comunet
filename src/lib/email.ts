/**
 * Email service for COMUNET.
 *
 * - Production: uses Resend when RESEND_API_KEY is set.
 * - Development / no key: logs to console (mock mode).
 *
 * Usage:
 *   import { sendEmail } from '@/lib/email'
 *   await sendEmail({ to: 'owner@example.com', subject: 'Recibo', html: '<p>...</p>' })
 */

import 'server-only'

export interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  /** Plain-text fallback (optional but recommended) */
  text?: string
  /** Override sender. Defaults to RESEND_FROM env var or noreply@comunet.app */
  from?: string
}

export interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

const DEFAULT_FROM =
  process.env.RESEND_FROM ?? 'COMUNET <noreply@comunet.app>'

// â”€â”€â”€ Resend adapter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function sendViaResend(payload: EmailPayload): Promise<EmailResult> {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data, error } = await resend.emails.send({
    from: payload.from ?? DEFAULT_FROM,
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })

  if (error) {
    console.error('[email] Resend error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, id: data?.id }
}

// â”€â”€â”€ Mock adapter (dev / no key) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function sendViaMock(payload: EmailPayload): Promise<EmailResult> {
  const id = `mock-${Date.now()}`
  console.log('ðŸ“§ [MOCK EMAIL]', {
    from: payload.from ?? DEFAULT_FROM,
    to: payload.to,
    subject: payload.subject,
    preview: payload.text ?? payload.html.substring(0, 200),
    id,
  })
  return { success: true, id }
}

// â”€â”€â”€ Public API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(payload)
  }
  return sendViaMock(payload)
}

// â”€â”€â”€ Pre-built templates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Notify an owner that a new receipt has been issued */
export async function sendReceiptIssuedEmail(opts: {
  to: string
  ownerName: string
  communityName: string
  reference: string
  amount: number
  dueDate: Date
}) {
  return sendEmail({
    to: opts.to,
    subject: `Nuevo recibo emitido â€“ ${opts.communityName}`,
    text: `Hola ${opts.ownerName}, se ha emitido el recibo ${opts.reference} por importe de ${opts.amount.toFixed(2)} â‚¬. Fecha lÃ­mite: ${opts.dueDate.toLocaleDateString('es-ES')}.`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#1e293b">Nuevo recibo emitido</h2>
        <p>Hola <strong>${opts.ownerName}</strong>,</p>
        <p>Se ha emitido un nuevo recibo para la comunidad <strong>${opts.communityName}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;background:#f8fafc;font-weight:600">Referencia</td><td style="padding:8px">${opts.reference}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;font-weight:600">Importe</td><td style="padding:8px">${opts.amount.toFixed(2)} â‚¬</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;font-weight:600">Fecha lÃ­mite</td><td style="padding:8px">${opts.dueDate.toLocaleDateString('es-ES')}</td></tr>
        </table>
        <p style="color:#64748b;font-size:12px">Este es un mensaje automÃ¡tico de COMUNET. No responda a este email.</p>
      </div>
    `,
  })
}

/** Notify a user their incident has been assigned to a provider */
export async function sendIncidentAssignedEmail(opts: {
  to: string
  ownerName: string
  incidentTitle: string
  providerName: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `Incidencia asignada â€“ ${opts.incidentTitle}`,
    text: `Hola ${opts.ownerName}, la incidencia "${opts.incidentTitle}" ha sido asignada al proveedor ${opts.providerName}.`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#1e293b">Incidencia asignada</h2>
        <p>Hola <strong>${opts.ownerName}</strong>,</p>
        <p>La incidencia <strong>"${opts.incidentTitle}"</strong> ha sido asignada al proveedor <strong>${opts.providerName}</strong>.</p>
        <p>RecibirÃ¡s una notificaciÃ³n cuando haya novedades.</p>
        <p style="color:#64748b;font-size:12px">Este es un mensaje automÃ¡tico de COMUNET. No responda a este email.</p>
      </div>
    `,
  })
}

/** Notify a user with a password reset link */
export async function sendPasswordResetEmail(opts: {
  to: string
  userName: string
  resetToken: string
  appUrl: string
}) {
  const resetUrl = `${opts.appUrl}/reset-password?token=${opts.resetToken}`

  return sendEmail({
    to: opts.to,
    subject: `Recuperación de contraseña – COMUNET`,
    text: `Hola ${opts.userName}, has solicitado restablecer tu contraseña. Ingresa a este enlace para crear una nueva: ${resetUrl}. Si no realizaste esta solicitud, puedes ignorar este correo.`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#1e293b">Recuperación de contraseña</h2>
        <p>Hola <strong>${opts.userName}</strong>,</p>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en COMUNET.</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}" style="background-color:#0f172a;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block">
            Restablecer Contraseña
          </a>
        </p>
        <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
        <p style="word-break:break-all;color:#0284c7">${resetUrl}</p>
        <p style="margin-top:32px;color:#64748b;font-size:14px">Si no has solicitado este cambio, puedes ignorar este correo de forma segura. Tu contraseña seguirá siendo la misma.</p>
        <p style="color:#64748b;font-size:12px;margin-top:16px;border-top:1px solid #e2e8f0;padding-top:16px">Este es un mensaje automático de COMUNET. No responda a este email.</p>
      </div>
    `,
  })
}

/** Notify a user that their password was recently changed */
export async function sendPasswordChangedEmail(opts: {
  to: string
  userName: string
}) {
  return sendEmail({
    to: opts.to,
    subject: `Aviso de seguridad: Cambio de contraseña – COMUNET`,
    text: `Hola ${opts.userName}, te informamos que la contraseña de tu cuenta en COMUNET ha sido modificada. Si no has sido tú, por favor contacta con soporte inmediatamente.`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#1e293b">Cambio de contraseña completado</h2>
        <p>Hola <strong>${opts.userName}</strong>,</p>
        <p>Preparamos este aviso de seguridad para confirmarte que la contraseña de tu cuenta en COMUNET ha sido modificada correctamente hace unos instantes.</p>
        <p style="margin-top:32px;color:#ef4444;font-size:14px;background-color:#fee2e2;padding:12px;border-radius:6px"><strong>¿No has sido tú?</strong> Si no has realizado este cambio, es posible que tu cuenta esté comprometida. Responde a este correo o contacta con el administrador inmediatamente.</p>
        <p style="color:#64748b;font-size:12px;margin-top:16px;border-top:1px solid #e2e8f0;padding-top:16px">Este es un mensaje automático de COMUNET. No responda a este email.</p>
      </div>
    `,
  })
}
