import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import type { User } from '@prisma/client'
import { prisma } from '../../db'
import { badRequest, unauthorized } from '../../http/errors'
import { ACCESS_TOKEN_TTL, DEMO_OTP, REFRESH_TOKEN_TTL_DAYS } from '../../config/constants'
import type { TokenPair, TokenPayload } from './auth.types'
import type { CustomerProfileInput } from './auth.schemas'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set (see .env.example).')
}

/** Never send `passwordHash` back to a client. */
export function toPublicUser(user: User) {
  const { passwordHash: _passwordHash, ...publicUser } = user
  return publicUser
}

export function signTokens(user: Pick<User, 'id' | 'role'>): TokenPair {
  const payload: TokenPayload = { sub: user.id, role: user.role }
  const accessToken = jwt.sign(payload, ACCESS_SECRET as string, { expiresIn: ACCESS_TOKEN_TTL })
  const refreshToken = jwt.sign(payload, REFRESH_SECRET as string, {
    expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
  })
  return { accessToken, refreshToken }
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET as string) as TokenPayload
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET as string) as TokenPayload
}

/**
 * OTP is always `123456` for the demo (spec §5) — never randomly
 * generated, never persisted anywhere. We only ever print it to the server
 * console, which is exactly what a shopkeeper reading over a presenter's
 * shoulder would need to believe this is "real" OTP UX without requiring an
 * SMS gateway.
 */
export async function requestOtp(phone: string): Promise<{ sent: true }> {
  console.log(`OTP for ${phone}: ${DEMO_OTP}`)
  return { sent: true }
}

/**
 * Customer-only. Merchants and admin never authenticate by OTP (spec §5) —
 * they have a `passwordHash`; customers never do. Looks up by
 * `(phone, CUSTOMER)`, never phone alone, per the same spec section: one
 * phone may separately hold a CUSTOMER row and a MERCHANT row.
 */
export async function verifyOtp(
  phone: string,
  otp: string,
): Promise<{ user: ReturnType<typeof toPublicUser>; tokens: TokenPair; isNewUser: boolean }> {
  if (otp !== DEMO_OTP) {
    throw unauthorized('Incorrect OTP.')
  }

  const existing = await prisma.user.findUnique({
    where: { phone_role: { phone, role: 'CUSTOMER' } },
  })

  const user =
    existing ??
    (await prisma.user.create({
      data: {
        // Placeholder until POST /api/auth/customer/profile fills in the
        // real name on first-time setup (spec §5).
        name: phone,
        phone,
        role: 'CUSTOMER',
      },
    }))

  const tokens = signTokens(user)
  return { user: toPublicUser(user), tokens, isNewUser: !existing }
}

export async function completeCustomerProfile(userId: string, input: CustomerProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'CUSTOMER') {
    throw badRequest('Only a customer account can complete this profile step.')
  }

  const address = await prisma.address.create({
    data: { userId, ...input.address },
  })

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { name: input.name, defaultAddressId: address.id },
  })

  return { user: toPublicUser(updated), address }
}

/** Merchants log in by (phone, password), never OTP (spec §5). */
export async function merchantLogin(phone: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { phone_role: { phone, role: 'MERCHANT' } },
  })
  // Same generic message whether the phone doesn't exist or the password is
  // wrong — don't leak which one failed.
  if (!user || !user.passwordHash || !(await argon2.verify(user.passwordHash, password))) {
    throw unauthorized('Incorrect phone or password.')
  }

  const tokens = signTokens(user)
  return { user: toPublicUser(user), tokens }
}

/** Admin logs in by email, at a route not linked from either public app (spec §5). */
export async function adminLogin(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.role !== 'ADMIN' || !user.passwordHash || !(await argon2.verify(user.passwordHash, password))) {
    throw unauthorized('Incorrect email or password.')
  }

  const tokens = signTokens(user)
  return { user: toPublicUser(user), tokens }
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  let payload: TokenPayload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    throw unauthorized('Invalid or expired refresh token.')
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  if (!user) {
    throw unauthorized('Invalid or expired refresh token.')
  }

  // Rotation: every refresh mints a brand-new pair rather than re-signing
  // the same refresh token, so a leaked refresh token has a short useful
  // life once the legitimate client refreshes again.
  return signTokens(user)
}

export async function getMe(userId: string, role: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw unauthorized('User no longer exists.')
  }

  if (role === 'MERCHANT') {
    // Two merchants in the seed own two shops each — never assume one shop
    // per merchant (spec: never `findFirst({ where: { ownerId } })`).
    const shops = await prisma.shop.findMany({ where: { ownerId: userId } })
    return { ...toPublicUser(user), shops }
  }

  return toPublicUser(user)
}
