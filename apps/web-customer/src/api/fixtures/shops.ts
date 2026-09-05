import type { ShopSummary, ShopDetail, OpeningHours } from '@shopnear/shared'
import { ANCHOR, offsetPoint, slugToId, seededRandomFor, pick } from './helpers'

/** Transcribed from apps/api/prisma/seed/data/shops.ts (read-only reference)
 * — same 14 shops, names, types, and distance/bearing from the Navrangpura
 * anchor (23.0365, 72.5611), so "80 m away" in the demo matches the seed. */
interface ShopSeed {
  name: string; nameGu: string; type: ShopSummary['type']; distanceMetres: number
  bearing: number; status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'; acceptsDelivery: boolean
  address: string; description: string
}

const SHOP_SEED: ShopSeed[] = [
  { name: 'Shreeji Kirana', nameGu: 'શ્રીજી કિરાણા', type: 'KIRANA', distanceMetres: 80, bearing: 35, status: 'ACTIVE', acceptsDelivery: true, address: 'Shop 4, Vijay Cross Road, Navrangpura', description: 'Family-run kirana stocking daily essentials since 1998.' },
  { name: 'Patel General Store', nameGu: 'પટેલ જનરલ સ્ટોર', type: 'GENERAL', distanceMetres: 340, bearing: 120, status: 'ACTIVE', acceptsDelivery: true, address: 'Near Navrangpura Post Office', description: 'General store with household and personal-care range.' },
  { name: 'Navrangpura Kirana Stores', nameGu: 'નવરંગપુરા કિરાણા સ્ટોર્સ', type: 'KIRANA', distanceMetres: 120, bearing: 200, status: 'ACTIVE', acceptsDelivery: true, address: 'Opp. Municipal Garden, Navrangpura', description: 'Long-standing neighbourhood kirana with a loyal customer base.' },
  { name: 'Vijay Kirana', nameGu: 'વિજય કિરાણા', type: 'KIRANA', distanceMetres: 140, bearing: 300, status: 'ACTIVE', acceptsDelivery: false, address: 'C-12, Sardar Patel Society, Navrangpura', description: 'Compact kirana specialising in dry-fruits and spices.' },
  { name: 'Ambica Kirana', nameGu: 'અંબિકા કિરાણા', type: 'KIRANA', distanceMetres: 500, bearing: 45, status: 'ACTIVE', acceptsDelivery: true, address: 'Ambica Chowk, Navrangpura', description: 'Everyday grocery and staples at neighbourhood prices.' },
  { name: 'Shree Ganesh General Store', nameGu: 'શ્રી ગણેશ જનરલ સ્ટોર', type: 'GENERAL', distanceMetres: 650, bearing: 270, status: 'PENDING', acceptsDelivery: false, address: 'Ganesh Nagar Road, Navrangpura', description: 'Newly registered general store awaiting approval.' },
  { name: 'Navkar Stationery', nameGu: 'નવકાર સ્ટેશનરી', type: 'STATIONERY', distanceMetres: 800, bearing: 10, status: 'ACTIVE', acceptsDelivery: true, address: 'Opp. Gujarat College, Navrangpura', description: 'Stationery, school supplies, and printed forms.' },
  { name: 'Ahmedabad Hardware Mart', nameGu: 'અમદાવાદ હાર્ડવેર માર્ટ', type: 'HARDWARE', distanceMetres: 950, bearing: 160, status: 'ACTIVE', acceptsDelivery: false, address: 'Hardware Lane, Navrangpura', description: 'Tools, fittings, and everyday hardware supplies.' },
  { name: 'Shivam Medical & Chemist', nameGu: 'શિવમ મેડિકલ એન્ડ કેમિસ્ટ', type: 'CHEMIST', distanceMetres: 1100, bearing: 90, status: 'ACTIVE', acceptsDelivery: true, address: 'Near C.U. Shah Hospital, Navrangpura', description: 'Neighbourhood chemist with a 24x7 emergency counter.' },
  { name: 'Anand Bakery', nameGu: 'આનંદ બેકરી', type: 'BAKERY', distanceMetres: 1300, bearing: 220, status: 'ACTIVE', acceptsDelivery: true, address: 'Anand Bakery Lane, Navrangpura', description: 'Fresh bread, cakes, and bakery snacks daily.' },
  { name: 'Amul Dairy Parlour', nameGu: 'અમૂલ ડેરી પાર્લર', type: 'DAIRY', distanceMetres: 1500, bearing: 310, status: 'ACTIVE', acceptsDelivery: true, address: 'Amul Parlour, Navrangpura Char Rasta', description: 'Milk, curd, and dairy products delivered fresh each morning.' },
  { name: 'Gujarat Farsan Mart', nameGu: 'ગુજરાત ફરસાણ માર્ટ', type: 'FARSAN', distanceMetres: 1800, bearing: 60, status: 'SUSPENDED', acceptsDelivery: false, address: 'Farsan Bazaar, Navrangpura', description: 'Suspended pending a licence renewal review.' },
  { name: 'Fresh Veggie Corner', nameGu: 'ફ્રેશ વેજી કોર્નર', type: 'VEGETABLE', distanceMetres: 2100, bearing: 140, status: 'PENDING', acceptsDelivery: false, address: 'Veggie Market, off Ashram Road', description: 'New vegetable stall awaiting admin approval.' },
  { name: 'Krishna Kirana Stores', nameGu: 'કૃષ્ણ કિરાણા સ્ટોર્સ', type: 'KIRANA', distanceMetres: 2400, bearing: 200, status: 'ACTIVE', acceptsDelivery: true, address: 'Krishna Society, off Ashram Road', description: 'Second-generation kirana serving the wider Navrangpura area.' },
]

const OPENING_HOURS: OpeningHours = {
  mon: { open: '09:00', close: '21:00' }, tue: { open: '09:00', close: '21:00' },
  wed: { open: '09:00', close: '21:00' }, thu: { open: '09:00', close: '21:00' },
  fri: { open: '09:00', close: '21:00' }, sat: { open: '09:00', close: '21:00' },
  sun: { open: '10:00', close: '14:00' }, isTemporarilyClosed: false,
}
const CHEMIST_HOURS: OpeningHours = { ...OPENING_HOURS, sun: { open: '00:00', close: '23:59' } }

export function isOpenNow(hours: OpeningHours, at: Date = new Date()): boolean {
  if (hours.isTemporarilyClosed) return false
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
  const today = hours[days[at.getDay()]]
  if (!today) return false
  const mins = at.getHours() * 60 + at.getMinutes()
  const [oh, om] = today.open.split(':').map(Number)
  const [ch, cm] = today.close.split(':').map(Number)
  const open = oh * 60 + om
  const close = ch * 60 + cm
  return mins >= open && mins <= close
}

/** Only ACTIVE shops are visible to customers — PENDING/SUSPENDED shops
 * exist in the seed for the merchant/admin apps, not this one. */
export const SHOPS_INTERNAL = SHOP_SEED
  .filter((s) => s.status === 'ACTIVE')
  .map((s) => {
    const id = slugToId('shop', s.name)
    const at = offsetPoint(ANCHOR.lat, ANCHOR.lng, s.distanceMetres, s.bearing)
    const rng = seededRandomFor(id)
    const hours = s.type === 'CHEMIST' ? CHEMIST_HOURS : OPENING_HOURS
    const summary: ShopSummary = {
      id, name: s.name, nameGu: s.nameGu, type: s.type,
      distanceMeters: s.distanceMetres, address: s.address, lat: at.lat, lng: at.lng,
      avgRating: Number((3.6 + rng() * 1.3).toFixed(1)),
      ratingCount: 8 + Math.floor(rng() * 240),
      isOpenNow: isOpenNow(hours),
      acceptsDelivery: s.acceptsDelivery,
      deliveryFee: s.acceptsDelivery ? pick(rng, [10, 15, 20]) : 0,
      minOrderValue: s.acceptsDelivery ? pick(rng, [99, 149, 199]) : 0,
      bannerImageUrl: null,
    }
    const detail: ShopDetail = {
      ...summary,
      description: s.description,
      phone: '9000000010',
      openingHours: hours,
      // filled in by inventory.ts after generation
      inventorySummary: { totalItems: 0, byAvailability: {} },
    }
    return { summary, detail }
  })

export const SHOPS: ShopSummary[] = SHOPS_INTERNAL.map((s) => s.summary)
export const SHOP_DETAILS = new Map(SHOPS_INTERNAL.map((s) => [s.summary.id, s.detail]))
