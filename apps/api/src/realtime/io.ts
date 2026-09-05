import type { Server as HttpServer } from 'node:http'
import { Server as SocketIOServer, type Socket } from 'socket.io'
import { prisma } from '../db'
import { verifyAccessToken } from '../modules/auth/auth.service'
import type { TokenPayload } from '../modules/auth/auth.types'

/**
 * Socket.IO realtime (spec §12/§9): what makes the merchant's incoming-order
 * screen light up, and the customer's tracking screen update, without a
 * refresh — the exact moment the definition of done calls out.
 *
 * A single module-level `io` instance, set once by `initRealtime` at process
 * startup (see `server.ts`). It stays `undefined` for the whole Vitest run —
 * nothing in `createApp()` calls `initRealtime` — so every emit helper below
 * is a safe no-op in tests rather than something that needs mocking out.
 */
let io: SocketIOServer | undefined

interface AuthedSocket extends Socket {
  data: { auth: TokenPayload }
}

/**
 * JWT-authenticated handshake: the client connects with
 * `{ auth: { token } }`, verified the same way as any REST request's bearer
 * token. Merchants ask to join `shop:<id>` — granted only if they actually
 * own that shop (spec: ownership is always checked, never assumed from
 * role). Customers ask to join `order:<id>` — granted only if the order is
 * theirs.
 */
export function initRealtime(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, { cors: { origin: '*' } })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined
    if (!token) return next(new Error('Authentication required.'))
    try {
      ;(socket as AuthedSocket).data.auth = verifyAccessToken(token)
      next()
    } catch {
      next(new Error('Invalid or expired access token.'))
    }
  })

  io.on('connection', (socket) => {
    const auth = (socket as AuthedSocket).data.auth

    socket.on('join:shop', async (shopId: string) => {
      if (auth.role !== 'MERCHANT') return
      const shop = await prisma.shop.findUnique({ where: { id: shopId } })
      if (shop && shop.ownerId === auth.sub) socket.join(`shop:${shopId}`)
    })

    socket.on('join:order', async (orderId: string) => {
      if (auth.role !== 'CUSTOMER') return
      const order = await prisma.order.findUnique({ where: { id: orderId } })
      if (order && order.customerId === auth.sub) socket.join(`order:${orderId}`)
    })
  })

  return io
}

/** New reservation placed — tells the shop's room to light up (spec §9/§12). */
export function emitOrderNew(shopId: string, order: unknown): void {
  io?.to(`shop:${shopId}`).emit('order:new', order)
}

/** Any status change — tells the customer's tracking screen to update live. */
export function emitOrderUpdated(orderId: string, order: unknown): void {
  io?.to(`order:${orderId}`).emit('order:updated', order)
}

/** Exposed for tests/diagnostics only — production code should use the emit helpers above. */
export function getIo(): SocketIOServer | undefined {
  return io
}
