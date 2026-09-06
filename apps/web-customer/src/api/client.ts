/**
 * The typed surface the whole customer app talks to. `mockClient.ts` is the
 * only implementation today; swapping in the real backend later means
 * writing one more file (`realClient.ts`) that implements this interface and
 * flipping the switch in `index.ts` — nothing else in the app changes.
 */
import type {
  LocationPreset, Category, ShopSummary, ShopDetail, Product, InventoryEntry, GeoPoint,
  GetShopsNearbyRequest, SearchProductsRequest, ProductSearchGroup,
  GetProductDetailRequest, ShopOffer, GetShopInventoryRequest,
  MultiItemSearchRequest, MultiItemSearchResponse, CreateOrderRequest, Order, Paged,
  SubmitReviewRequest, RaiseDisputeRequest, Dispute, RequestOtpRequest,
  VerifyOtpRequest, VerifyOtpResponse, AuthUser, CompleteProfileRequest, CompleteProfileResponse,
} from '@shopnear/shared'

export interface ProductDetailResponse {
  product: Product
  offers: ShopOffer[]
}

export interface ShopNearApi {
  // Location
  getLocationPresets(): Promise<LocationPreset[]>

  // Catalogue browsing
  getCategories(): Promise<Category[]>
  /** Paged: a dense neighbourhood puts 126 shops inside the default radius,
   * which is not one screen. Filtering, sorting and slicing all happen behind
   * this call — the screen asks for a page number and nothing else. */
  getShopsNearby(req: GetShopsNearbyRequest): Promise<Paged<ShopSummary>>
  /** `location` is only used to compute `distanceMeters` client-side — the
   * real `GET /api/shops/:id` has no location anchor of its own. */
  getShop(shopId: string, location: GeoPoint): Promise<ShopDetail>
  /** Paged for the same reason: a kirana's catalogue runs to 300 lines. */
  getShopInventory(req: GetShopInventoryRequest): Promise<Paged<InventoryEntry>>

  // Search
  searchProducts(req: SearchProductsRequest): Promise<ProductSearchGroup[]>
  getProductDetail(req: GetProductDetailRequest): Promise<ProductDetailResponse>
  multiItemSearch(req: MultiItemSearchRequest): Promise<MultiItemSearchResponse>

  // Orders
  createOrder(req: CreateOrderRequest): Promise<Order>
  getOrder(orderId: string): Promise<Order>
  listOrders(): Promise<Order[]>
  cancelOrder(orderId: string): Promise<Order>

  // Reviews & disputes
  submitReview(req: SubmitReviewRequest): Promise<void>
  raiseDispute(req: RaiseDisputeRequest): Promise<Dispute>

  // Auth
  requestOtp(req: RequestOtpRequest): Promise<{ sent: boolean }>
  verifyOtp(req: VerifyOtpRequest): Promise<VerifyOtpResponse>
  /** First-time-customer profile completion (name + first address). Only
   * meaningful when `verifyOtp` resolved with `isNewUser: true`. */
  completeProfile(req: CompleteProfileRequest): Promise<CompleteProfileResponse>
  getCurrentUser(): Promise<AuthUser | null>
  logout(): Promise<void>
}
