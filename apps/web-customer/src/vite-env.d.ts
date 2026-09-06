/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to 'true' to force the client-side mock (offline demo fallback).
   * Defaults to false — the real API is the default data source. */
  readonly VITE_USE_MOCK?: string
  /** Base URL of the real API. Defaults to http://localhost:4000. */
  readonly VITE_API_URL?: string
  /** Where the merchant console is served from. Dev default: the :5174 dev
   * server. The combined build injects the '/merchant' path instead. */
  readonly VITE_MERCHANT_URL?: string
  /** Where the admin console is served from. Dev default: :5175. */
  readonly VITE_ADMIN_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
