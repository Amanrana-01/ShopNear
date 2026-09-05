/**
 * The ShopNear customer-app API contract.
 *
 * This file is the single source of truth for every request/response shape
 * the customer web app exchanges with the backend. It is written against
 * `apps/api/prisma/schema.prisma` (read-only reference, not modified here)
 * so that the real API can implement `ShopNearApi` (see
 * apps/web-customer/src/api/client.ts) with zero shape changes.
 *
 * Design notes:
 * - We NEVER expose a stock quantity. `availability` + `availabilityUpdatedAt`
 *   is the only signal, and the UI turns that pair into a confidence badge
 *   (see apps/web-customer/src/components/AvailabilityBadge.tsx).
 * - Money is in rupees (number, may carry paise as a decimal).
 * - Distances are always metres (number).
 * - Timestamps are ISO-8601 strings (so they survive JSON over the wire);
 *   convert to Date at the edge of the UI layer.
 */
import { z } from 'zod'
import {
  SHOP_TYPES,
  AVAILABILITY_STATES,
  ORDER_STATUSES,
  USER_ROLES,
} from '../enums'

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const ShopTypeSchema = z.enum(SHOP_TYPES)
export const AvailabilitySchema = z.enum(AVAILABILITY_STATES)
export const OrderStatusSchema = z.enum(ORDER_STATUSES)
export const UserRoleSchema = z.enum(USER_ROLES)

export const AvailabilitySourceSchema = z.enum([
  'MERCHANT_MANUAL', 'RESERVATION_CONFIRMED', 'RESERVATION_REJECTED', 'SEED', 'AUTO_DECAY',
])
export type AvailabilitySource = z.infer<typeof AvailabilitySourceSchema>

export const UnitTypeSchema = z.enum(['PIECE', 'WEIGHT', 'VOLUME', 'PACK'])
export type UnitType = z.infer<typeof UnitTypeSchema>

export const OrderTypeSchema = z.enum(['RESERVE_AND_COLLECT', 'DELIVERY'])
export type OrderTypeValue = z.infer<typeof OrderTypeSchema>

export const PaymentModeSchema = z.enum(['CASH_ON_PICKUP', 'CASH_ON_DELIVERY', 'MOCK_ONLINE'])
export type PaymentMode = z.infer<typeof PaymentModeSchema>

export const PaymentStatusSchema = z.enum(['PENDING', 'PAID', 'FAILED'])
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>

export const DisputeReasonSchema = z.enum([
  'ITEM_NOT_AVAILABLE_ON_ARRIVAL', 'PRICE_MISMATCH', 'QUALITY_ISSUE', 'SHOP_CLOSED', 'OTHER',
])
export type DisputeReason = z.infer<typeof DisputeReasonSchema>

export const DisputeStatusSchema = z.enum(['OPEN', 'RESOLVED', 'REJECTED'])
export type DisputeStatus = z.infer<typeof DisputeStatusSchema>

export const GeoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})
export type GeoPoint = z.infer<typeof GeoPointSchema>

export const RadiusMetersSchema = z.union([
  z.literal(250), z.literal(500), z.literal(1000), z.literal(3000),
])
export type RadiusMeters = z.infer<typeof RadiusMetersSchema>

// ---------------------------------------------------------------------------
// Location gate
// ---------------------------------------------------------------------------

export const LocationPresetSchema = z.object({
  id: z.string(),
  label: z.string(),
  sublabel: z.string(),
  lat: z.number(),
  lng: z.number(),
})
export type LocationPreset = z.infer<typeof LocationPresetSchema>

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  nameGu: z.string(),
  slug: z.string(),
  iconName: z.string(),
  parentId: z.string().nullable(),
})
export type Category = z.infer<typeof CategorySchema>

// ---------------------------------------------------------------------------
// Opening hours
// ---------------------------------------------------------------------------

export const DayHoursSchema = z.object({ open: z.string(), close: z.string() }).nullable()
export const OpeningHoursSchema = z.object({
  mon: DayHoursSchema, tue: DayHoursSchema, wed: DayHoursSchema, thu: DayHoursSchema,
  fri: DayHoursSchema, sat: DayHoursSchema, sun: DayHoursSchema,
  isTemporarilyClosed: z.boolean(),
})
export type OpeningHours = z.infer<typeof OpeningHoursSchema>

// ---------------------------------------------------------------------------
// Shops
// ---------------------------------------------------------------------------

export const ShopSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  nameGu: z.string(),
  type: ShopTypeSchema,
  distanceMeters: z.number(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  avgRating: z.number(),
  ratingCount: z.number(),
  isOpenNow: z.boolean(),
  acceptsDelivery: z.boolean(),
  deliveryFee: z.number(),
  minOrderValue: z.number(),
  bannerImageUrl: z.string().nullable(),
})
export type ShopSummary = z.infer<typeof ShopSummarySchema>

export const ShopDetailSchema = ShopSummarySchema.extend({
  description: z.string().nullable(),
  phone: z.string(),
  openingHours: OpeningHoursSchema,
  inventoryCount: z.number(),
})
export type ShopDetail = z.infer<typeof ShopDetailSchema>

// ---------------------------------------------------------------------------
// Products & inventory (the availability signal lives on the offer, not the
// product — a product is the catalogue idea, an "offer" is what one shop
// says about it right now).
// ---------------------------------------------------------------------------

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameGu: z.string(),
  brand: z.string().nullable(),
  categoryId: z.string(),
  categorySlug: z.string(),
  unitType: UnitTypeSchema,
  defaultUnitLabel: z.string(),
  mrp: z.number().nullable(),
  imageUrl: z.string().nullable(),
  isLooseGood: z.boolean(),
})
export type Product = z.infer<typeof ProductSchema>

/** What one shop currently says about one product. Never a quantity. */
export const OfferSchema = z.object({
  shopId: z.string(),
  price: z.number(),
  availability: AvailabilitySchema,
  availabilityUpdatedAt: z.string(),
  availabilitySource: AvailabilitySourceSchema,
})
export type Offer = z.infer<typeof OfferSchema>

/** An offer joined with the shop that made it — used wherever we render a
 * shop row under a product (search results, product detail). */
export const ShopOfferSchema = OfferSchema.extend({
  shop: ShopSummarySchema,
})
export type ShopOffer = z.infer<typeof ShopOfferSchema>

/** A product joined with one shop's inventory row — used for shop-page
 * browsing, where the product is nested under a known shop. */
export const InventoryEntrySchema = z.object({
  product: ProductSchema,
  offer: OfferSchema,
})
export type InventoryEntry = z.infer<typeof InventoryEntrySchema>

/** Search results are grouped by product so the same item can be compared
 * across every shop that carries it near the customer — the signature view. */
export const ProductSearchGroupSchema = z.object({
  product: ProductSchema,
  offers: z.array(ShopOfferSchema),
})
export type ProductSearchGroup = z.infer<typeof ProductSearchGroupSchema>

export const SearchSortSchema = z.enum(['relevance', 'distance', 'price_low', 'price_high'])
export type SearchSort = z.infer<typeof SearchSortSchema>

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export const GetShopsNearbyRequestSchema = z.object({
  location: GeoPointSchema,
  radiusMeters: RadiusMetersSchema,
  type: ShopTypeSchema.optional(),
  query: z.string().optional(),
})
export type GetShopsNearbyRequest = z.infer<typeof GetShopsNearbyRequestSchema>

export const SearchProductsRequestSchema = z.object({
  location: GeoPointSchema,
  radiusMeters: RadiusMetersSchema,
  /** Free-text query. Either this or `categorySlug` should be set — a
   * category chip search with no typed text browses that category instead
   * of matching keywords. */
  query: z.string().optional(),
  categorySlug: z.string().optional(),
  sort: SearchSortSchema.default('relevance'),
})
export type SearchProductsRequest = z.infer<typeof SearchProductsRequestSchema>

export const GetProductDetailRequestSchema = z.object({
  productId: z.string(),
  location: GeoPointSchema,
  radiusMeters: RadiusMetersSchema,
})
export type GetProductDetailRequest = z.infer<typeof GetProductDetailRequestSchema>

export const GetShopInventoryRequestSchema = z.object({
  shopId: z.string(),
  categorySlug: z.string().optional(),
  query: z.string().optional(),
})
export type GetShopInventoryRequest = z.infer<typeof GetShopInventoryRequestSchema>

// ---- Multi-item search: the headline differentiator -----------------------

export const MultiItemSearchRequestSchema = z.object({
  location: GeoPointSchema,
  radiusMeters: RadiusMetersSchema,
  /** Free-text terms, comma or newline separated by the caller before this
   * point — the API receives an already-split list. */
  items: z.array(z.string().min(1)).min(1).max(30),
})
export type MultiItemSearchRequest = z.infer<typeof MultiItemSearchRequestSchema>

/** What one requested line resolved to, independent of any shop. */
export const MatchedItemSchema = z.object({
  queryText: z.string(),
  matchedProduct: ProductSchema.nullable(),
})
export type MatchedItem = z.infer<typeof MatchedItemSchema>

/** How one shop covers the requested list. */
export const ShopCoverageSchema = z.object({
  shop: ShopSummarySchema,
  itemsCovered: z.array(z.object({ queryText: z.string(), offer: OfferSchema, product: ProductSchema })),
  itemsMissing: z.array(z.string()),
  coveredCount: z.number(),
  totalCount: z.number(),
  coveragePercent: z.number(),
  estimatedTotal: z.number(),
})
export type ShopCoverage = z.infer<typeof ShopCoverageSchema>

/** Fallback when no single shop covers everything: the best two-shop split. */
export const TwoShopSplitSchema = z.object({
  primary: ShopCoverageSchema,
  secondary: ShopCoverageSchema,
  combinedCoveredCount: z.number(),
  stillMissing: z.array(z.string()),
})
export type TwoShopSplit = z.infer<typeof TwoShopSplitSchema>

export const MultiItemSearchResponseSchema = z.object({
  matches: z.array(MatchedItemSchema),
  bestSingleShop: ShopCoverageSchema.nullable(),
  otherShops: z.array(ShopCoverageSchema),
  twoShopSplit: TwoShopSplitSchema.nullable(),
})
export type MultiItemSearchResponse = z.infer<typeof MultiItemSearchResponseSchema>

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

export const AddressSchema = z.object({
  id: z.string(),
  label: z.string(),
  line1: z.string(),
  line2: z.string().nullable(),
  landmark: z.string().nullable(),
  city: z.string(),
  pincode: z.string(),
  lat: z.number(),
  lng: z.number(),
})
export type Address = z.infer<typeof AddressSchema>

// ---------------------------------------------------------------------------
// Cart (client-side only — there is no server Cart model; checkout creates
// an Order directly) but the line-item shape is shared with order contracts.
// ---------------------------------------------------------------------------

export const CartLineSchema = z.object({
  productId: z.string(),
  shopId: z.string(),
  quantity: z.number().positive(),
})
export type CartLine = z.infer<typeof CartLineSchema>

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const CreateOrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
})
export type CreateOrderItem = z.infer<typeof CreateOrderItemSchema>

export const CreateOrderRequestSchema = z.object({
  shopId: z.string(),
  type: OrderTypeSchema,
  items: z.array(CreateOrderItemSchema).min(1),
  paymentMode: PaymentModeSchema,
  deliveryAddressId: z.string().optional(),
  customerNote: z.string().optional(),
  /** Demo-only: lets the mock payment screen force a simulated outcome. */
  simulatePaymentOutcome: z.enum(['success', 'failure']).optional(),
})
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>

export const FulfilmentStatusSchema = z.enum(['PENDING', 'AVAILABLE', 'UNAVAILABLE', 'SUBSTITUTED'])
export type FulfilmentStatus = z.infer<typeof FulfilmentStatusSchema>

export const OrderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productNameSnapshot: z.string(),
  unitLabelSnapshot: z.string(),
  imageUrl: z.string().nullable(),
  quantity: z.number(),
  unitPrice: z.number(),
  lineTotal: z.number(),
  fulfilmentStatus: FulfilmentStatusSchema,
})
export type OrderItem = z.infer<typeof OrderItemSchema>

export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: OrderStatusSchema,
  type: OrderTypeSchema,
  shop: ShopSummarySchema,
  items: z.array(OrderItemSchema),
  subtotal: z.number(),
  deliveryFee: z.number(),
  total: z.number(),
  paymentMode: PaymentModeSchema,
  paymentStatus: PaymentStatusSchema,
  deliveryAddress: AddressSchema.nullable(),
  customerNote: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  pickupCode: z.string(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
  confirmedAt: z.string().nullable(),
  readyAt: z.string().nullable(),
  outForDeliveryAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  rejectedAt: z.string().nullable(),
  expiredAt: z.string().nullable(),
  review: z.object({ rating: z.number(), comment: z.string().nullable() }).nullable(),
})
export type Order = z.infer<typeof OrderSchema>

export const SubmitReviewRequestSchema = z.object({
  orderId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
})
export type SubmitReviewRequest = z.infer<typeof SubmitReviewRequestSchema>

export const RaiseDisputeRequestSchema = z.object({
  orderId: z.string(),
  reason: DisputeReasonSchema,
  description: z.string().min(5).max(1000),
})
export type RaiseDisputeRequest = z.infer<typeof RaiseDisputeRequestSchema>

export const DisputeSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  reason: DisputeReasonSchema,
  description: z.string(),
  status: DisputeStatusSchema,
  adminNote: z.string().nullable(),
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
})
export type Dispute = z.infer<typeof DisputeSchema>

// ---------------------------------------------------------------------------
// Auth (phone + OTP; demo OTP is always 123456, see mockClient)
// ---------------------------------------------------------------------------

export const RequestOtpRequestSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
})
export type RequestOtpRequest = z.infer<typeof RequestOtpRequestSchema>

export const VerifyOtpRequestSchema = z.object({
  phone: z.string(),
  otp: z.string().length(6),
})
export type VerifyOtpRequest = z.infer<typeof VerifyOtpRequestSchema>

export const AuthUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  role: UserRoleSchema,
})
export type AuthUser = z.infer<typeof AuthUserSchema>

export const SessionSchema = z.object({
  token: z.string(),
  user: AuthUserSchema,
})
export type Session = z.infer<typeof SessionSchema>
