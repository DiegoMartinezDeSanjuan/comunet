/**
 * Tests for the computed receipt status utility.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { getEffectiveReceiptStatus } from '@/lib/receipt-status'

describe('getEffectiveReceiptStatus', () => {
  beforeEach(() => {
    // Fix "today" as 2026-06-15
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns OVERDUE for ISSUED receipts past due date', () => {
    expect(getEffectiveReceiptStatus('ISSUED', '2026-06-10')).toBe('OVERDUE')
  })

  it('keeps ISSUED for receipts not yet due', () => {
    expect(getEffectiveReceiptStatus('ISSUED', '2026-06-20')).toBe('ISSUED')
  })

  it('keeps ISSUED for receipts due today (not yet overdue)', () => {
    expect(getEffectiveReceiptStatus('ISSUED', '2026-06-15')).toBe('ISSUED')
  })

  it('preserves PAID regardless of due date', () => {
    expect(getEffectiveReceiptStatus('PAID', '2026-01-01')).toBe('PAID')
  })

  it('preserves CANCELLED regardless of due date', () => {
    expect(getEffectiveReceiptStatus('CANCELLED', '2020-01-01')).toBe('CANCELLED')
  })

  it('preserves PARTIALLY_PAID regardless of due date', () => {
    expect(getEffectiveReceiptStatus('PARTIALLY_PAID', '2025-01-01')).toBe('PARTIALLY_PAID')
  })

  it('preserves DRAFT regardless of due date', () => {
    expect(getEffectiveReceiptStatus('DRAFT', '2020-01-01')).toBe('DRAFT')
  })

  it('handles null due date — keeps ISSUED', () => {
    expect(getEffectiveReceiptStatus('ISSUED', null)).toBe('ISSUED')
  })

  it('handles Date objects as dueDate', () => {
    expect(getEffectiveReceiptStatus('ISSUED', new Date('2026-06-01'))).toBe('OVERDUE')
    expect(getEffectiveReceiptStatus('ISSUED', new Date('2026-07-01'))).toBe('ISSUED')
  })
})
