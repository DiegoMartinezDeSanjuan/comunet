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

// ─── Resend adapter ──────────────────────────────────────

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

// ─── Mock adapter (dev / no key) ─────────────────────────

async function sendViaMock(payload: EmailPayload): Promise<EmailResult> {
  const id = `mock-${Date.now()}`
  console.log('📧 [MOCK EMAIL]', {
    from: payload.from ?? DEFAULT_FROM,
    to: payload.to,
    subject: payload.subject,
    preview: payload.text ?? payload.html.substring(0, 200),
    id,
  })
  return { success: true, id }
}

// ─── Public API ───────────────────────────────────────────

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(payload)
  }
  return sendViaMock(payload)
}

// ─── Pre-built templates ──────────────────────────────────

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
    subject: `Nuevo recibo emitido – ${opts.communityName}`,
    text: `Hola ${opts.ownerName}, se ha emitido el recibo ${opts.reference} por importe de ${opts.amount.toFixed(2)} €. Fecha límite: ${opts.dueDate.toLocaleDateString('es-ES')}.`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#1e293b">Nuevo recibo emitido</h2>
        <p>Hola <strong>${opts.ownerName}</strong>,</p>
        <p>Se ha emitido un nuevo recibo para la comunidad <strong>${opts.communityName}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;background:#f8fafc;font-weight:600">Referencia</td><td style="padding:8px">${opts.reference}</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;font-weight:600">Importe</td><td style="padding:8px">${opts.amount.toFixed(2)} €</td></tr>
          <tr><td style="padding:8px;background:#f8fafc;font-weight:600">Fecha límite</td><td style="padding:8px">${opts.dueDate.toLocaleDateString('es-ES')}</td></tr>
        </table>
        <p style="color:#64748b;font-size:12px">Este es un mensaje automático de COMUNET. No responda a este email.</p>
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
    subject: `Incidencia asignada – ${opts.incidentTitle}`,
    text: `Hola ${opts.ownerName}, la incidencia "${opts.incidentTitle}" ha sido asignada al proveedor ${opts.providerName}.`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#1e293b">Incidencia asignada</h2>
        <p>Hola <strong>${opts.ownerName}</strong>,</p>
        <p>La incidencia <strong>"${opts.incidentTitle}"</strong> ha sido asignada al proveedor <strong>${opts.providerName}</strong>.</p>
        <p>Recibirás una notificación cuando haya novedades.</p>
        <p style="color:#64748b;font-size:12px">Este es un mensaje automático de COMUNET. No responda a este email.</p>
      </div>
    `,
  })
}
