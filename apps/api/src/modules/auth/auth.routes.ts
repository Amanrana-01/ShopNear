import { Router } from 'express'
import { asyncHandler } from '../../http/asyncHandler'
import { validate, type ValidatedRequest } from '../../http/validate'
import { requireAuth, requireRole, type AuthenticatedRequest } from '../../http/authMiddleware'
import {
  otpRequestSchema,
  otpVerifySchema,
  customerProfileSchema,
  merchantLoginSchema,
  adminLoginSchema,
  refreshSchema,
  type OtpRequestInput,
  type OtpVerifyInput,
  type CustomerProfileInput,
  type MerchantLoginInput,
  type AdminLoginInput,
  type RefreshInput,
} from './auth.schemas'
import {
  requestOtp,
  verifyOtp,
  completeCustomerProfile,
  merchantLogin,
  adminLogin,
  refreshTokens,
  getMe,
} from './auth.service'

export const authRouter = Router()

authRouter.post(
  '/otp/request',
  validate({ body: otpRequestSchema }),
  asyncHandler(async (req, res) => {
    const { phone } = (req as ValidatedRequest<OtpRequestInput>).validated.body
    const result = await requestOtp(phone)
    res.json(result)
  }),
)

authRouter.post(
  '/otp/verify',
  validate({ body: otpVerifySchema }),
  asyncHandler(async (req, res) => {
    const { phone, otp } = (req as ValidatedRequest<OtpVerifyInput>).validated.body
    const { user, tokens, isNewUser } = await verifyOtp(phone, otp)
    res.json({ user, isNewUser, ...tokens })
  }),
)

authRouter.post(
  '/customer/profile',
  requireAuth,
  requireRole('CUSTOMER'),
  validate({ body: customerProfileSchema }),
  asyncHandler(async (req, res) => {
    const { sub: userId } = (req as AuthenticatedRequest).auth
    const { name, address } = (req as ValidatedRequest<CustomerProfileInput>).validated.body
    const result = await completeCustomerProfile(userId, { name, address })
    res.json(result)
  }),
)

authRouter.post(
  '/merchant/login',
  validate({ body: merchantLoginSchema }),
  asyncHandler(async (req, res) => {
    const { phone, password } = (req as ValidatedRequest<MerchantLoginInput>).validated.body
    const { user, tokens } = await merchantLogin(phone, password)
    res.json({ user, ...tokens })
  }),
)

authRouter.post(
  '/admin/login',
  validate({ body: adminLoginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = (req as ValidatedRequest<AdminLoginInput>).validated.body
    const { user, tokens } = await adminLogin(email, password)
    res.json({ user, ...tokens })
  }),
)

authRouter.post(
  '/refresh',
  validate({ body: refreshSchema }),
  asyncHandler(async (req, res) => {
    const { refreshToken } = (req as ValidatedRequest<RefreshInput>).validated.body
    const tokens = await refreshTokens(refreshToken)
    res.json(tokens)
  }),
)

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { sub: userId, role } = (req as AuthenticatedRequest).auth
    const me = await getMe(userId, role)
    res.json(me)
  }),
)
