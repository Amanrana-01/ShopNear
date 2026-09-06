/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to 'true' to force the client-side mock (offline demo fallback).
   * Defaults to false — the real API is the default data source. */
  readonly VITE_USE_MOCK?: string
  /** Base URL of the real API. Defaults to http://localhost:4000. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
