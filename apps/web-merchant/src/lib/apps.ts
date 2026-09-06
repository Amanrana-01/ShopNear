/**
 * Where the sibling ShopNear clients live. See the matching file in
 * web-customer — the three apps are separate bundles, so crossing between them
 * is a real navigation, and the URL differs between dev (separate ports) and
 * the combined production build (paths under one origin).
 */
const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '')

export const CUSTOMER_URL = stripTrailingSlash(import.meta.env.VITE_CUSTOMER_URL ?? 'http://localhost:5173')

export const CUSTOMER_LOGIN_URL = `${CUSTOMER_URL}/login`
