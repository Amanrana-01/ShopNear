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
 * (Realtime-specific tests spin up their own `initRealtime` over a real HTTP
 * server — see `realtime.test.ts`.)
 *
 * Event contract (documented in full in the phase report for the web
 * clients):
 *  - Handshake: client connects with `{ auth: { token: <access token> } }`.
 *  - Rooms: `shop:<shopId>` (merchants), `order:<orderId>` (customers).
 *  - Server -> client events: `order:new` (to the shop's room, on
 *    reservation), `order:updated` (to the order's room, on every status
 *    change). Payload is the full order object (with `items`), the same
 *    shape the REST endpoints return under their `order` key.
 */
let io: SocketIOServer | undefined

interface AuthedSocket extends Socket {
  data: { auth: TokenPayload }
}

/**
 * JWT-authenticated handshake: the client connects with
 * `{ auth: { token } }`, verified the same way as any REST request's bearer
 * token. Ownership is always checked, never assumed from role alone (spec:
 * ownership and role are separate concerns).
 *
 * A merchant is auto-joined to `shop:<id>` for *every* shop they own the
 * moment they connect — a merchant who owns two shops (spec: never assume
 * one shop per merchant) must not have to know to join each room itself, or
 * the realtime alert silently never fires for the shop the web client forgot
 * to join. The explicit `join:shop` / `join:order` events below still exist
 * for a client that wants to (re)join a specific room on demand — e.g. a
 * customer joining the order they just placed, or a merchant re-joining
 * after being granted a new shop mid-session.
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

    if (auth.role === 'MERCHANT') {
      // Fire-and-forget: join every shop this merchant owns. Errors here
      // must never crash the connection — worst case the client falls back
      // to the explicit `join:shop` event.
      prisma.shop
        .findMany({ where: { ownerId: auth.sub }, select: { id: true } })
        .then((shops) => {
          for (const shop of shops) socket.join(`shop:${shop.id}`)
        })
        .catch((err) => console.error('realtime: failed to auto-join merchant shop rooms', err))
    }

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

/** Test-only teardown: closes the current instance and clears the module-level reference. */
export async function closeRealtime(): Promise<void> {
  if (!io) return
  await new Promise<void>((resolve) => io!.close(() => resolve()))
  io = undefined
}
