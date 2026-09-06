import { describe, it, expect } from 'vitest'
import { SHOP_TYPES, AVAILABILITY_STATES, ORDER_STATUSES, USER_ROLES } from './enums'

describe('shared enums', () => {
  it('lists all nine shop types from the spec', () => {
    expect(SHOP_TYPES).toEqual([
      'KIRANA', 'GENERAL', 'STATIONERY', 'HARDWARE', 'CHEMIST',
      'BAKERY', 'DAIRY', 'FARSAN', 'VEGETABLE',
    ])
  })

  it('lists the four availability states', () => {
    expect(AVAILABILITY_STATES).toEqual([
      'IN_STOCK', 'OUT_OF_STOCK', 'USUALLY_AVAILABLE', 'UNKNOWN',
    ])
  })

  it('includes every order status in the state machine', () => {
    expect(ORDER_STATUSES).toContain('PLACED')
    expect(ORDER_STATUSES).toContain('CONFIRMED')
    expect(ORDER_STATUSES).toContain('READY_FOR_PICKUP')
    expect(ORDER_STATUSES).toContain('OUT_FOR_DELIVERY')
    expect(ORDER_STATUSES).toContain('COMPLETED')
    expect(ORDER_STATUSES).toContain('CANCELLED_BY_CUSTOMER')
    expect(ORDER_STATUSES).toContain('REJECTED_BY_SHOP')
    expect(ORDER_STATUSES).toContain('EXPIRED')
  })

  it('has exactly three roles', () => {
    expect(USER_ROLES).toEqual(['CUSTOMER', 'MERCHANT', 'ADMIN'])
  })
})
