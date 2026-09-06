import type { UserRole } from '@shopnear/shared'

/**
 * What we sign into (and read back out of) a JWT. Kept minimal — just
 * enough to authenticate and role-check a request without a DB round trip.
 * Ownership checks (`requireShopOwnership`) still hit the DB, deliberately:
 * they are a separate concern from "who is this token for" (spec §5).
 */
export interface TokenPayload {
  sub: string
  role: UserRole
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}
