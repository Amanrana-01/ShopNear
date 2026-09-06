/**
 * Local, hand-written mirror of the API's Prisma-derived response shapes.
 * Deliberately NOT imported from `@shopnear/shared` or `apps/api` — the
 * coordination note for this phase asks that types stay local to
 * `apps/web-merchant/src` so another agent can reconcile shared contracts
 * later without this app's build breaking mid-flight. Verified against real
 * responses from the live API on :4000 (see phase-2 task reports + ad hoc
 * curl checks during this build).
 */

export const SHOP_TYPES = [
  'KIRANA', 'GENERAL', 'STATIONERY', 'HARDWARE', 'CHEMIST',
  'BAKERY', 'DAIRY', 'FARSAN', 'VEGETABLE',
] as const
export type ShopType = (typeof SHOP_TYPES)[number]

export const AVAILABILITY_STATES = ['IN_STOCK', 'OUT_OF_STOCK', 'USUALLY_AVAILABLE', 'UNKNOWN'] as const
export type Availability = (typeof AVAILABILITY_STATES)[number]

export const ORDER_STATUSES = [
  'PLACED', 'CONFIRMED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY',
  'COMPLETED', 'CANCELLED_BY_CUSTOMER', 'REJECTED_BY_SHOP', 'EXPIRED',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export type AppLanguage = 'en' | 'hi' | 'gu'
export type ShopStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED'
export type UnitType = 'PIECE' | 'WEIGHT' | 'VOLUME' | 'PACK'
export type OrderType = 'RESERVE_AND_COLLECT' | 'DELIVERY'
export type FulfilmentStatus = 'PENDING' | 'AVAILABLE' | 'UNAVAILABLE' | 'SUBSTITUTED'
export type PaymentMode = 'CASH_ON_PICKUP' | 'CASH_ON_DELIVERY' | 'MOCK_ONLINE'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED'

export interface DayHours {
  open: string
  close: string
}
export interface OpeningHours {
  mon?: DayHours | null
  tue?: DayHours | null
  wed?: DayHours | null
  thu?: DayHours | null
  fri?: DayHours | null
  sat?: DayHours | null
  sun?: DayHours | null
  isTemporarilyClosed: boolean
}

export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number]

export interface MerchantUser {
  id: string
  name: string
  phone: string
  email: string | null
  role: 'MERCHANT'
  defaultAddressId: string | null
  preferredLanguage: AppLanguage
  createdAt: string
  shops: Shop[]
}

export interface Shop {
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
  openingHours: OpeningHours
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

export interface Product {
  id: string
  name: string
  nameGu: string
  brand: string | null
  categoryId: string
  unitType: UnitType
  defaultUnitLabel: string
  mrp: number | null
  barcode: string | null
  imageUrl: string | null
  searchKeywords: string[]
  isLooseGood: boolean
}

export interface ShopInventoryItem {
  id: string
  shopId: string
  productId: string
  price: number
  availability: Availability
  availabilityUpdatedAt: string
  availabilitySource: string
  confirmCount: number
  rejectCount: number
  notes: string | null
  isActive: boolean
  product: Product
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  productNameSnapshot: string
  unitLabelSnapshot: string
  quantity: number
  unitPrice: number
  lineTotal: number
  fulfilmentStatus: FulfilmentStatus
  substituteProductId: string | null
}

export interface Order {
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
  items: OrderItem[]
}

export interface StarterCatalogueItem {
  productId: string
  name: string
  nameGu: string
  unitType: UnitType
  defaultUnitLabel: string
  imageUrl: string | null
  suggestedPrice: number
}
