import { describe, it, expect } from 'vitest'
import type { OrderStatus, OrderType } from '@prisma/client'
import { assertTransition, LEGAL_TRANSITIONS } from './stateMachine'

const COLLECT: OrderType = 'RESERVE_AND_COLLECT'
const DELIVERY: OrderType = 'DELIVERY'

describe('order state machine — LEGAL_TRANSITIONS shape', () => {
  it('matches spec §6 exactly', () => {
    expect(LEGAL_TRANSITIONS.PLACED.sort()).toEqual(
      ['CONFIRMED', 'REJECTED_BY_SHOP', 'CANCELLED_BY_CUSTOMER', 'EXPIRED'].sort(),
    )
    expect(LEGAL_TRANSITIONS.CONFIRMED.sort()).toEqual(
      ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'CANCELLED_BY_CUSTOMER'].sort(),
    )
    expect(LEGAL_TRANSITIONS.READY_FOR_PICKUP).toEqual(['COMPLETED'])
    expect(LEGAL_TRANSITIONS.OUT_FOR_DELIVERY).toEqual(['COMPLETED'])
    for (const terminal of ['COMPLETED', 'REJECTED_BY_SHOP', 'CANCELLED_BY_CUSTOMER', 'EXPIRED'] as OrderStatus[]) {
      expect(LEGAL_TRANSITIONS[terminal]).toEqual([])
    }
  })
})

describe('order state machine — every legal transition passes', () => {
  const cases: Array<[OrderStatus, OrderStatus, OrderType]> = [
    ['PLACED', 'CONFIRMED', COLLECT],
    ['PLACED', 'CONFIRMED', DELIVERY],
    ['PLACED', 'REJECTED_BY_SHOP', COLLECT],
    ['PLACED', 'CANCELLED_BY_CUSTOMER', COLLECT],
    ['PLACED', 'EXPIRED', COLLECT],
    ['CONFIRMED', 'READY_FOR_PICKUP', COLLECT],
    ['CONFIRMED', 'OUT_FOR_DELIVERY', DELIVERY],
    ['CONFIRMED', 'CANCELLED_BY_CUSTOMER', COLLECT],
    ['CONFIRMED', 'CANCELLED_BY_CUSTOMER', DELIVERY],
    ['READY_FOR_PICKUP', 'COMPLETED', COLLECT],
    ['OUT_FOR_DELIVERY', 'COMPLETED', DELIVERY],
  ]

  for (const [from, to, type] of cases) {
    it(`${from} -> ${to} (${type}) is legal`, () => {
      expect(() => assertTransition(from, to, type)).not.toThrow()
    })
  }
})

describe('order state machine — illegal transitions throw', () => {
  const cases: Array<[OrderStatus, OrderStatus, OrderType, string]> = [
    ['PLACED', 'COMPLETED', COLLECT, 'cannot skip straight to COMPLETED'],
    ['PLACED', 'OUT_FOR_DELIVERY', DELIVERY, 'cannot skip CONFIRMED'],
    ['PLACED', 'READY_FOR_PICKUP', COLLECT, 'cannot skip CONFIRMED'],
    ['COMPLETED', 'CONFIRMED', COLLECT, 'COMPLETED is terminal'],
    ['COMPLETED', 'COMPLETED', COLLECT, 'COMPLETED cannot repeat'],
    ['EXPIRED', 'CONFIRMED', COLLECT, 'EXPIRED is terminal'],
    ['REJECTED_BY_SHOP', 'CONFIRMED', COLLECT, 'REJECTED_BY_SHOP is terminal'],
    ['CANCELLED_BY_CUSTOMER', 'CONFIRMED', COLLECT, 'CANCELLED_BY_CUSTOMER is terminal'],
    ['CONFIRMED', 'EXPIRED', COLLECT, 'EXPIRED only fires from PLACED'],
    ['CONFIRMED', 'PLACED', COLLECT, 'no going backwards'],
    ['READY_FOR_PICKUP', 'CONFIRMED', COLLECT, 'no going backwards'],
    ['OUT_FOR_DELIVERY', 'READY_FOR_PICKUP', DELIVERY, 'no lateral move between fulfilment tracks'],
    // The non-obvious, spec-mandated per-type restriction: OUT_FOR_DELIVERY
    // is invalid for a RESERVE_AND_COLLECT order even though CONFIRMED ->
    // OUT_FOR_DELIVERY is shape-legal in the table.
    ['CONFIRMED', 'OUT_FOR_DELIVERY', COLLECT, 'OUT_FOR_DELIVERY invalid for a pickup order'],
    // Symmetric restriction: a DELIVERY order can never reach READY_FOR_PICKUP.
    ['CONFIRMED', 'READY_FOR_PICKUP', DELIVERY, 'READY_FOR_PICKUP invalid for a delivery order'],
  ]

  for (const [from, to, type, why] of cases) {
    it(`${from} -> ${to} (${type}) throws — ${why}`, () => {
      expect(() => assertTransition(from, to, type)).toThrow()
    })
  }
})
