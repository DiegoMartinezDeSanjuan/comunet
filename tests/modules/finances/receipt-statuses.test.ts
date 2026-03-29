import { describe, expect, it } from 'vitest'

import { debtStatusEnum, receiptStatusEnum } from '@/modules/finances/schema'

describe('finance slice 2.2 - receipt status normalization', () => {
    it('accepts only the agreed receipt statuses', () => {
        expect(receiptStatusEnum.safeParse('DRAFT').success).toBe(true)
        expect(receiptStatusEnum.safeParse('ISSUED').success).toBe(true)
        expect(receiptStatusEnum.safeParse('PARTIALLY_PAID').success).toBe(true)
        expect(receiptStatusEnum.safeParse('PAID').success).toBe(true)
        expect(receiptStatusEnum.safeParse('OVERDUE').success).toBe(true)
        expect(receiptStatusEnum.safeParse('RETURNED').success).toBe(true)
        expect(receiptStatusEnum.safeParse('CANCELLED').success).toBe(true)
    })

    it('rejects PENDING as a receipt status', () => {
        expect(receiptStatusEnum.safeParse('PENDING').success).toBe(false)
    })

    it('keeps PENDING only for debt status, where it is still valid', () => {
        expect(debtStatusEnum.safeParse('PENDING').success).toBe(true)
    })
})
