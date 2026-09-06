import { Router } from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { asyncHandler } from '../../http/asyncHandler'
import { validate, type ValidatedRequest } from '../../http/validate'
import { badRequest } from '../../http/errors'
import {
  merchantRegistrationSchema,
  starterCatalogueQuerySchema,
  type MerchantRegistrationInput,
  type StarterCatalogueQueryInput,
} from './registration.schemas'
import { registerMerchant, getStarterCatalogue } from './registration.service'

export const merchantsRouter = Router()

// apps/api/src/modules/merchants -> apps/api/uploads. Resolved from this
// file's own location (not process.cwd()) so it lands in the same place
// whether the process starts from the workspace root (vitest) or from
// apps/api (npm run dev), and works under ESM where __dirname isn't defined.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads')
fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

/**
 * Mock document upload (spec R11): shop photo + mock GST/Udyam/licence file.
 * Stored locally, format validation only — no verification is performed.
 * The UI shows a "Demo — not verified" notice; see future-scope.md.
 */
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ''
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(badRequest('Unsupported file type. Only JPEG, PNG, WEBP, and PDF are accepted.'))
      return
    }
    cb(null, true)
  },
})

merchantsRouter.post(
  '/register',
  validate({ body: merchantRegistrationSchema }),
  asyncHandler(async (req, res) => {
    const body = (req as ValidatedRequest<MerchantRegistrationInput>).validated.body
    const result = await registerMerchant(body)
    res.status(201).json(result)
  }),
)

merchantsRouter.get(
  '/starter-catalogue',
  validate({ query: starterCatalogueQuerySchema }),
  asyncHandler(async (req, res) => {
    const { shopType } = (req as ValidatedRequest<unknown, StarterCatalogueQueryInput>).validated.query
    const items = await getStarterCatalogue(shopType)
    res.json({ items })
  }),
)

merchantsRouter.post(
  '/uploads',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const file = (req as unknown as { file?: Express.Multer.File }).file
    if (!file) throw badRequest('No file uploaded, or the file type is unsupported.')
    res.status(201).json({ url: `/uploads/${file.filename}` })
  }),
)
