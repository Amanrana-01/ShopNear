import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import request from 'supertest'
import argon2 from 'argon2'
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client'
import { createApp } from '../app'
import { prisma } from '../db'
import * as clock from '../clock/clock'
import { initRealtime, closeRealtime } from './io'

/**
 * Proves the realtime contract actually delivers, not just that it's wired:
 * a merchant socket connects and is auto-joined to its shop room; a
 * customer places a reservation over plain REST; the merchant socket
 * receives `order:new` with no refresh involved. Then a customer socket
 * explicitly joins `order:<id>`, the merchant confirms over REST, and the
 * customer socket receives `order:updated`.
 *
 * Needs a real listening HTTP server (socket.io-client speaks real
 * HTTP/WebSocket, unlike supertest's in-memory app calls), so this suite
 * spins one up on an ephemeral port purely to host the Socket.IO engine.
 * REST calls still go through supertest against the same Express app —
 * `emitOrderNew`/`emitOrderUpdated` reach the socket layer via the
 * module-level `io` singleton regardless of which HTTP entry point issued
 * the request.
 */

const app = createApp()
let httpServer: http.Server
let baseUrl: string

const OWNER_PHONE = '9166665001'
const CUSTOMER_PHONE = '9166665011'

let shopId: string
let productId: string
let ownerToken: string
let customerToken: string

const OPEN_ALL_DAY = {
  mon: { open: '00:00', close: '23:59' }, tue: { open: '00:00', close: '23:59' },
  wed: { open: '00:00', close: '23:59' }, thu: { open: '00:00', close: '23:59' },
  fri: { open: '00:00', close: '23:59' }, sat: { open: '00:00', close: '23:59' },
  sun: { open: '00:00', close: '23:59' }, isTemporarilyClosed: false,
}

function connectClient(token: string): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(baseUrl, { auth: { token }, transports: ['websocket'], forceNew: true })
    socket.once('connect', () => resolve(socket))
    socket.once('connect_error', (err) => reject(err))
  })
}

function waitForEvent<T = unknown>(socket: ClientSocket, event: string, timeoutMs = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for "${event}"`)), timeoutMs)
    socket.once(event, (payload: T) => {
      clearTimeout(timer)
      resolve(payload)
    })
  })
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function cleanup() {
  const owner = await prisma.user.findUnique({ where: { phone_role: { phone: OWNER_PHONE, role: 'MERCHANT' } } })
  if (owner) {
    const shops = await prisma.shop.findMany({ where: { ownerId: owner.id }, select: { id: true } })
    const shopIds = shops.map((s) => s.id)
    if (shopIds.length > 0) {
      const orders = await prisma.order.findMany({ where: { shopId: { in: shopIds } }, select: { id: true } })
      const orderIds = orders.map((o) => o.id)
      if (orderIds.length > 0) {
        await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
        await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
      }
      await prisma.shopInventory.deleteMany({ where: { shopId: { in: shopIds } } })
      await prisma.shop.deleteMany({ where: { id: { in: shopIds } } })
    }
    await prisma.user.delete({ where: { id: owner.id } })
  }
  await prisma.user.deleteMany({ where: { phone: CUSTOMER_PHONE, role: 'CUSTOMER' } })
  await prisma.product.deleteMany({ where: { name: 'Fixture Realtime Product' } })
  await prisma.category.deleteMany({ where: { slug: { startsWith: 'realtime-fixture-cat' } } })
}

describe('realtime (Socket.IO)', () => {
  beforeAll(async () => {
    await cleanup()
    await clock.reset()

    httpServer = http.createServer(app)
    initRealtime(httpServer)
    await new Promise<void>((resolve) => httpServer.listen(0, resolve))
    const port = (httpServer.address() as AddressInfo).port
    baseUrl = `http://localhost:${port}`

    const category = await prisma.category.create({
      data: { name: 'Realtime Fixture Cat', nameGu: 'Realtime Fixture Cat', slug: `realtime-fixture-cat-${Date.now()}`, iconName: 'box' },
    })
    const product = await prisma.product.create({
      data: { name: 'Fixture Realtime Product', nameGu: 'Fixture Realtime Product', categoryId: category.id, unitType: 'PACK', defaultUnitLabel: '1 unit', searchKeywords: ['fixture'] },
    })
    productId = product.id

    const owner = await prisma.user.create({
      data: { name: 'Realtime Fixture Owner', phone: OWNER_PHONE, role: 'MERCHANT', passwordHash: await argon2.hash('owner-pass') },
    })
    const shop = await prisma.shop.create({
      data: {
        ownerId: owner.id, name: 'Realtime Fixture Shop', nameGu: 'Realtime Fixture Shop', type: 'KIRANA',
        phone: '9166669994', address: 'Realtime Fixture Address', lat: 23.037, lng: 72.5615,
        status: 'ACTIVE', openingHours: OPEN_ALL_DAY,
      },
    })
    shopId = shop.id
    await prisma.shopInventory.create({ data: { shopId, productId, price: 40, availability: 'UNKNOWN' } })

    const loginOwner = await request(app).post('/api/auth/merchant/login').send({ phone: OWNER_PHONE, password: 'owner-pass' })
    ownerToken = loginOwner.body.accessToken
    const custVerify = await request(app).post('/api/auth/otp/verify').send({ phone: CUSTOMER_PHONE, otp: '123456' })
    customerToken = custVerify.body.accessToken
  })

  afterAll(async () => {
    await closeRealtime()
    await new Promise<void>((resolve) => httpServer.close(() => resolve()))
    await cleanup()
    await clock.reset()
    await prisma.$disconnect()
  })

  it(
    'delivers order:new to the shop room the instant a reservation is placed',
    async () => {
      const merchantSocket = await connectClient(ownerToken)
      // Auto-join (shop:<id>) happens asynchronously right after connect —
      // give it a beat to land before the order is created.
      await sleep(400)

      const orderNewPromise = waitForEvent<{ id: string; shopId: string; status: string }>(merchantSocket, 'order:new')

      const created = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ shopId, type: 'RESERVE_AND_COLLECT', items: [{ productId, quantity: 1 }], paymentMode: 'CASH_ON_PICKUP' })
      expect(created.status).toBe(201)

      const received = await orderNewPromise
      expect(received.id).toBe(created.body.order.id)
      expect(received.shopId).toBe(shopId)
      expect(received.status).toBe('PLACED')

      merchantSocket.disconnect()
    },
    15000,
  )

  it(
    'delivers order:updated to the customer\'s order room on every status change',
    async () => {
      const created = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ shopId, type: 'RESERVE_AND_COLLECT', items: [{ productId, quantity: 1 }], paymentMode: 'CASH_ON_PICKUP' })
      const orderId = created.body.order.id
      const itemId = created.body.order.items[0].id

      const customerSocket = await connectClient(customerToken)
      customerSocket.emit('join:order', orderId)
      await sleep(300)

      const orderUpdatedPromise = waitForEvent<{ id: string; status: string }>(customerSocket, 'order:updated')

      const confirmRes = await request(app)
        .post(`/api/orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ items: [{ orderItemId: itemId, fulfilmentStatus: 'AVAILABLE' }] })
      expect(confirmRes.status).toBe(200)

      const received = await orderUpdatedPromise
      expect(received.id).toBe(orderId)
      expect(received.status).toBe('READY_FOR_PICKUP')

      customerSocket.disconnect()
    },
    15000,
  )

  it('rejects a handshake with no token', async () => {
    await expect(
      new Promise((resolve, reject) => {
        const socket = ioClient(baseUrl, { auth: {}, transports: ['websocket'], forceNew: true })
        socket.once('connect', () => resolve(undefined))
        socket.once('connect_error', (err) => reject(err))
      }),
    ).rejects.toBeTruthy()
  })
})
