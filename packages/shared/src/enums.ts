/**
 * Single source of truth for enum values shared by the API, all three web
 * clients, and the Prisma schema. Prisma enums are declared separately in
 * schema.prisma; these arrays must be kept in step with them, and the
 * schema tests in Task 3-5 assert that they match.
 */
export const SHOP_TYPES = [
  'KIRANA', 'GENERAL', 'STATIONERY', 'HARDWARE', 'CHEMIST',
  'BAKERY', 'DAIRY', 'FARSAN', 'VEGETABLE',
] as const
export type ShopType = (typeof SHOP_TYPES)[number]

export const AVAILABILITY_STATES = [
  'IN_STOCK', 'OUT_OF_STOCK', 'USUALLY_AVAILABLE', 'UNKNOWN',
] as const
export type Availability = (typeof AVAILABILITY_STATES)[number]

export const ORDER_STATUSES = [
  'PLACED', 'CONFIRMED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY',
  'COMPLETED', 'CANCELLED_BY_CUSTOMER', 'REJECTED_BY_SHOP', 'EXPIRED',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const USER_ROLES = ['CUSTOMER', 'MERCHANT', 'ADMIN'] as const
export type UserRole = (typeof USER_ROLES)[number]
