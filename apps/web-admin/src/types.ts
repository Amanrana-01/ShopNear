/**
 * Local types mirroring the API's Prisma enums / shapes. Deliberately not
 * imported from `packages/shared` or `apps/api` — this workspace keeps its
 * own types per the coordination note (another agent owns both of those).
 * Values below are taken from `apps/api/prisma/schema.prisma`, read-only.
 */

export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'ADMIN'

export type ShopType =
  | 'KIRANA' | 'GENERAL' | 'STATIONERY' | 'HARDWARE' | 'CHEMIST'
  | 'BAKERY' | 'DAIRY' | 'FARSAN' | 'VEGETABLE'

export type ShopStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED'

export type Availability = 'IN_STOCK' | 'OUT_OF_STOCK' | 'USUALLY_AVAILABLE' | 'UNKNOWN'
export type AvailabilitySource = 'MERCHANT_MANUAL' | 'RESERVATION_CONFIRMED' | 'RESERVATION_REJECTED' | 'SEED' | 'AUTO_DECAY'

export type OrderType = 'RESERVE_AND_COLLECT' | 'DELIVERY'
export type OrderStatus =
  | 'PLACED' | 'CONFIRMED' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY'
  | 'COMPLETED' | 'CANCELLED_BY_CUSTOMER' | 'REJECTED_BY_SHOP' | 'EXPIRED'
export type PaymentMode = 'CASH_ON_PICKUP' | 'CASH_ON_DELIVERY' | 'MOCK_ONLINE'
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED'
export type FulfilmentStatus = 'PENDING' | 'AVAILABLE' | 'UNAVAILABLE' | 'SUBSTITUTED'

export type DisputeReason = 'ITEM_NOT_AVAILABLE_ON_ARRIVAL' | 'PRICE_MISMATCH' | 'QUALITY_ISSUE' | 'SHOP_CLOSED' | 'OTHER'
export type DisputeStatus = 'OPEN' | 'RESOLVED' | 'REJECTED'

export type BadgeTone = 'green' | 'green-amber' | 'amber' | 'red' | 'grey'
export interface Badge {
  label: 'In stock' | 'Likely available' | 'Usually available' | 'Out of stock' | 'Ask the shop'
  tone: BadgeTone
  detail?: string
}

export interface AuthUser {
  id: string
  name: string
  phone: string
  email: string | null
  role: UserRole
  defaultAddressId: string | null
  preferredLanguage: string
  createdAt: string
}

export interface OrderRow {
  id: string
  orderNumber: string
  customerId: string
  shopId: string
  type: OrderType
  status: OrderStatus
  subtotal: number
  deliveryFee: number
  total: number
  paymentMode: PaymentMode
  paymentStatus: PaymentStatus
  deliveryAddressId: string | null
  customerNote: string | null
  merchantNote: string | null
  rejectionReason: string | null
  pickupCode: string
  expiresAt: string | null
  createdAt: string
  confirmedAt: string | null
  readyAt: string | null
  outForDeliveryAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  rejectedAt: string | null
  expiredAt: string | null
}

export interface Dispute {
  id: string
  orderId: string
  raisedByUserId: string
  reason: DisputeReason
  description: string
  status: DisputeStatus
  adminNote: string | null
  createdAt: string
  resolvedAt: string | null
  order: OrderRow
}

export interface ShopRow {
  id: string
  ownerId: string
  name: string
  nameGu: string
  type: ShopType
  description: string | null
  phone: string
  address: string
  lat: number
  lng: number
  status: ShopStatus
  openingHours: unknown
  acceptsDelivery: boolean
  deliveryRadiusMeters: number
  minOrderValue: number
  deliveryFee: number
  avgRating: number
  ratingCount: number
  bannerImageUrl: string | null
  licenceNumber: string | null
  licenceDocUrl: string | null
  createdAt: string
  isOpenNow?: boolean
}

export interface SearchResultRow {
  shopId: string
  shopName: string
  distanceMeters: number
  isOpenNow: boolean
  product: {
    id: string
    name: string
    nameGu: string
    imageUrl: string | null
    unitType: string
    defaultUnitLabel: string
  }
  price: number
  badge: Badge
  score: number
}

export interface RankingWeights {
  availabilityConfidence: number
  proximity: number
  shopRating: number
  isOpenNow: number
}

export interface DecayThresholds {
  inStockFreshHours: number
  inStockStaleHours: number
  outOfStockTrustHours: number
}
