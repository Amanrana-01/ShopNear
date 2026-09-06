import { z } from 'zod'

/**
 * Zod contracts for the auth endpoints.
 *
 * Deviation from the phase-2 plan: the plan puts these in
 * `packages/shared/src/schemas/auth.ts` so clients can import the same
 * types. Another agent is actively building `packages/shared/src/api/` and
 * `apps/web-customer/` in this same working tree right now, so — to avoid
 * colliding with in-flight work — these schemas live under
 * `apps/api/src/modules/auth/` instead. They should be reconciled with the
 * web client's contract afterwards.
 */

export const phoneSchema = z
  .string()
  .regex(/^\d{10}$/, 'Phone must be exactly 10 digits.')

export const otpRequestSchema = z.object({
  phone: phoneSchema,
  // OTP login only ever applies to customers today; MERCHANT is accepted
  // so the same request shape can drive the password-reset fallback later
  // (spec §5) without a breaking change.
  role: z.enum(['CUSTOMER', 'MERCHANT']),
})
export type OtpRequestInput = z.infer<typeof otpRequestSchema>

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  otp: z.string().min(1),
})
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>

export const addressInputSchema = z.object({
  label: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(1).default('Ahmedabad'),
  pincode: z.string().min(1),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
})

export const customerProfileSchema = z.object({
  name: z.string().min(1),
  address: addressInputSchema,
})
export type CustomerProfileInput = z.infer<typeof customerProfileSchema>

export const merchantLoginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1),
})
export type MerchantLoginInput = z.infer<typeof merchantLoginSchema>

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
export type AdminLoginInput = z.infer<typeof adminLoginSchema>

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})
export type RefreshInput = z.infer<typeof refreshSchema>
