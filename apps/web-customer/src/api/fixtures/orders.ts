import type { Order } from '@shopnear/shared'
import { SHOPS } from './shops'
import { PRODUCTS } from './products'
import { nextId } from './helpers'

function findShop(name: string) {
  const s = SHOPS.find((sh) => sh.name === name) ?? SHOPS[0]
  return s
}
function findProduct(name: string) {
  return PRODUCTS.find((p) => p.name === name) ?? PRODUCTS[0]
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString()
}

/** A handful of past orders so Order History has real-looking content on
 * first load, spanning every terminal + a couple of live states. */
export function seedOrders(): Order[] {
  const shreeji = findShop('Shreeji Kirana')
  const patel = findShop('Patel General Store')
  const navkar = findShop('Navkar Stationery')

  const atta = findProduct('Aashirvaad Superior MP Atta 5 kg')
  const butter = findProduct('Amul Butter 500 g')
  const maggi = findProduct('Maggi 2-Minute Noodles 70 g')
  const soap = findProduct('Nirma Bath Soap 100 g')
  const notebook = findProduct('Classmate Notebook 172 pg Single Line')
  const pen = findProduct('Reynolds Jetter Ball Pen')

  const completed: Order = {
    id: nextId('order'), orderNumber: 'SN-2371', status: 'COMPLETED', type: 'RESERVE_AND_COLLECT',
    shop: shreeji,
    items: [
      { id: nextId('item'), productId: atta.id, productNameSnapshot: atta.name, unitLabelSnapshot: atta.defaultUnitLabel, imageUrl: atta.imageUrl, quantity: 1, unitPrice: 279, lineTotal: 279, fulfilmentStatus: 'AVAILABLE' },
      { id: nextId('item'), productId: butter.id, productNameSnapshot: butter.name, unitLabelSnapshot: butter.defaultUnitLabel, imageUrl: butter.imageUrl, quantity: 2, unitPrice: 280, lineTotal: 560, fulfilmentStatus: 'AVAILABLE' },
    ],
    subtotal: 839, deliveryFee: 0, total: 839,
    paymentMode: 'CASH_ON_PICKUP', paymentStatus: 'PAID',
    deliveryAddress: null, customerNote: null, rejectionReason: null,
    pickupCode: '4821', expiresAt: null,
    createdAt: hoursAgo(96), confirmedAt: hoursAgo(95.8), readyAt: hoursAgo(95.5),
    outForDeliveryAt: null, completedAt: hoursAgo(95), cancelledAt: null, rejectedAt: null, expiredAt: null,
    review: { rating: 5, comment: 'Quick confirmation and the atta was exactly as listed. Will order again!' },
  }

  const cancelled: Order = {
    id: nextId('order'), orderNumber: 'SN-2354', status: 'CANCELLED_BY_CUSTOMER', type: 'RESERVE_AND_COLLECT',
    shop: patel,
    items: [
      { id: nextId('item'), productId: soap.id, productNameSnapshot: soap.name, unitLabelSnapshot: soap.defaultUnitLabel, imageUrl: soap.imageUrl, quantity: 3, unitPrice: 22, lineTotal: 66, fulfilmentStatus: 'PENDING' },
    ],
    subtotal: 66, deliveryFee: 0, total: 66,
    paymentMode: 'CASH_ON_PICKUP', paymentStatus: 'PENDING',
    deliveryAddress: null, customerNote: 'Changed my mind, found it closer.', rejectionReason: null,
    pickupCode: '7710', expiresAt: null,
    createdAt: hoursAgo(200), confirmedAt: null, readyAt: null, outForDeliveryAt: null,
    completedAt: null, cancelledAt: hoursAgo(199.5), rejectedAt: null, expiredAt: null, review: null,
  }

  const rejected: Order = {
    id: nextId('order'), orderNumber: 'SN-2340', status: 'REJECTED_BY_SHOP', type: 'RESERVE_AND_COLLECT',
    shop: navkar,
    items: [
      { id: nextId('item'), productId: notebook.id, productNameSnapshot: notebook.name, unitLabelSnapshot: notebook.defaultUnitLabel, imageUrl: notebook.imageUrl, quantity: 5, unitPrice: 45, lineTotal: 225, fulfilmentStatus: 'UNAVAILABLE' },
    ],
    subtotal: 225, deliveryFee: 0, total: 225,
    paymentMode: 'CASH_ON_PICKUP', paymentStatus: 'PENDING',
    deliveryAddress: null, customerNote: null, rejectionReason: 'Out of stock — new batch arrives Monday.',
    pickupCode: '3392', expiresAt: null,
    createdAt: hoursAgo(340), confirmedAt: null, readyAt: null, outForDeliveryAt: null,
    completedAt: null, cancelledAt: null, rejectedAt: hoursAgo(339), expiredAt: null, review: null,
  }

  const readyForPickup: Order = {
    id: nextId('order'), orderNumber: 'SN-2409', status: 'READY_FOR_PICKUP', type: 'RESERVE_AND_COLLECT',
    shop: shreeji,
    items: [
      { id: nextId('item'), productId: maggi.id, productNameSnapshot: maggi.name, unitLabelSnapshot: maggi.defaultUnitLabel, imageUrl: maggi.imageUrl, quantity: 4, unitPrice: 14, lineTotal: 56, fulfilmentStatus: 'AVAILABLE' },
      { id: nextId('item'), productId: pen.id, productNameSnapshot: pen.name, unitLabelSnapshot: pen.defaultUnitLabel, imageUrl: pen.imageUrl, quantity: 2, unitPrice: 10, lineTotal: 20, fulfilmentStatus: 'AVAILABLE' },
    ],
    subtotal: 76, deliveryFee: 0, total: 76,
    paymentMode: 'CASH_ON_PICKUP', paymentStatus: 'PENDING',
    deliveryAddress: null, customerNote: null, rejectionReason: null,
    pickupCode: '5567', expiresAt: hoursAgo(-1.2),
    createdAt: hoursAgo(0.6), confirmedAt: hoursAgo(0.5), readyAt: hoursAgo(0.1),
    outForDeliveryAt: null, completedAt: null, cancelledAt: null, rejectedAt: null, expiredAt: null, review: null,
  }

  return [readyForPickup, completed, cancelled, rejected]
}
