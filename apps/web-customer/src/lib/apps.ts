/**
 * Where the sibling ShopNear clients live.
 *
 * The three apps are separate bundles, so moving between them is a real
 * navigation (`<a href>`), not a router link. In development each runs on its
 * own port; in the combined production build they are mounted as paths under
 * one origin (see `scripts/build-all.mjs`), and the build injects these vars.
 * Keep both shapes working — the defaults below are the dev ports.
 */
const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '')

export const MERCHANT_URL = stripTrailingSlash(import.meta.env.VITE_MERCHANT_URL ?? 'http://localhost:5174')
export const ADMIN_URL = stripTrailingSlash(import.meta.env.VITE_ADMIN_URL ?? 'http://localhost:5175')

export const MERCHANT_LOGIN_URL = `${MERCHANT_URL}/login`
export const MERCHANT_REGISTER_URL = `${MERCHANT_URL}/register`
