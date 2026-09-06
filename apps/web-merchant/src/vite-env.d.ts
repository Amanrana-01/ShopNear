/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API. Defaults to http://localhost:4000. */
  readonly VITE_API_URL?: string
  /** Where the customer storefront is served from. Dev default: the :5173 dev
   * server. The combined build injects '/' instead. */
  readonly VITE_CUSTOMER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
