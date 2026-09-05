/**
 * The typed surface the whole customer app talks to. `mockClient.ts` is the
 * only implementation today; swapping in the real backend later means
 * writing one more file (`realClient.ts`) that implements this interface and
 * flipping the switch in `index.ts` — nothing else in the app changes.
 */
import type {
  LocationPreset, Category, ShopSummary, ShopDetail, Product, InventoryEntry,
  GetShopsNearbyRequest, SearchProductsRequest, ProductSearchGroup,
  GetProductDetailRequest, ShopOffer, GetShopInventoryRequest,
  MultiItemSearchRequest, MultiItemSearchResponse, CreateOrderRequest, Order,
  SubmitReviewRequest, RaiseDisputeRequest, Dispute, RequestOtpRequest,
  VerifyOtpRequest, Session, AuthUser,
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
  getShopsNearby(req: GetShopsNearbyRequest): Promise<ShopSummary[]>
  getShop(shopId: string): Promise<ShopDetail>
  getShopInventory(req: GetShopInventoryRequest): Promise<InventoryEntry[]>

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
  requestOtp(req: RequestOtpRequest): Promise<{ devOtp: string }>
  verifyOtp(req: VerifyOtpRequest): Promise<Session>
  getCurrentUser(): Promise<AuthUser | null>
  logout(): Promise<void>
}
