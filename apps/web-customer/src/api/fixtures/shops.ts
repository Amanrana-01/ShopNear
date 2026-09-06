import type { ShopSummary, ShopDetail, OpeningHours, ShopType } from '@shopnear/shared'
import { ANCHOR, offsetPoint, haversineMetres, slugToId, seededRandomFor, pick } from './helpers'
import type { DemoOrigin } from './origins'
import { DEMO_ORIGINS, PRIMARY_ORIGIN } from './origins'

/** Transcribed from apps/api/prisma/seed/data/shops.ts (read-only reference)
 * — same 14 shops, names, types, and distance/bearing from the Navrangpura
 * anchor (23.0365, 72.5611), so "80 m away" in the demo matches the seed. */
interface ShopSeed {
  name: string; nameGu: string; type: ShopType; distanceMetres: number
  bearing: number; status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'; acceptsDelivery: boolean
  address: string; description: string
  /** Which demo origin `distanceMetres`/`bearing` are measured from. The 14
   * transcribed seed shops are all around Home, so it defaults there. */
  originId?: DemoOrigin['id']
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

// ---------------------------------------------------------------------------
// Demo-density generator — NOT from the API seed.
//
// The 14 shops above are a thin slice of one street, which meant a filter
// like "Bakery" or "Chemist" returned a single card. This block generates the
// rest of the neighbourhood: 33 shops of every type, placed so that no rung of
// the radius picker is ever empty for any type — from any of the three demo
// origins, not just from Home. See `origins.ts`.
//
// Everything here derives from a PRNG seeded on the shop type, so the same
// 297 shops — same names, same coordinates, same ratings — come back on every
// reload. Nothing in this file calls Math.random().
// ---------------------------------------------------------------------------

/**
 * Shops of each type per distance band.
 *
 * Cumulative per type: 4 within 250 m, 10 within 500 m, 14 within 1 km (the
 * app's default radius), 19 within 3 km, 23 within 10 km, 25 within 25 km —
 * so "at least ten of any type in range" holds from 500 m upward.
 *
 * It deliberately does NOT hold at 250 m. Ten shops of each of the nine types
 * inside a 250 m circle is ninety shopfronts on one street corner, which no
 * amount of demo density makes true; four per type is what that radius
 * honestly contains. A radius picker whose every rung returns the same list
 * is not a filter.
 */
interface DistanceBand {
  /** Lower edge of the band for *counting* what is already there. The first
   * band starts at 0 so the seed's 80 m kirana is counted, not orphaned into
   * a 26th shop of its type. */
  min: number
  max: number
  count: number
  /** Closest a *generated* shop may be placed. Only differs from `min` for
   * the innermost band, where 0 m would put a shop inside the customer. */
  placeFrom?: number
}

const DISTANCE_BANDS: DistanceBand[] = [
  { min: 0, max: 250, count: 4, placeFrom: 90 },
  { min: 250, max: 500, count: 6 },
  { min: 500, max: 1000, count: 4 },
  { min: 1000, max: 3000, count: 5 },
  { min: 3000, max: 10000, count: 4 },
  { min: 10000, max: 25000, count: 2 },
]

/**
 * Shops of each type placed around each *satellite* origin (Office, Hostel).
 *
 * The bands above are measured from Home, so browsing from Home fills every
 * rung of the radius picker. Office and Hostel sit 2 km and 900 m away, where
 * that cluster's inner rungs are empty - standing at the Office and asking for
 * "chemists within 250 m" returned nothing, which is the bug the radius picker
 * was reported for. Each satellite therefore gets its own inner neighbourhood.
 * Nothing is generated beyond 1 km: from either satellite, the 3 km rung and
 * up already reach the Home cluster.
 */
const SATELLITE_BANDS: DistanceBand[] = [
  { min: 0, max: 250, count: 2, placeFrom: 90 },
  { min: 250, max: 500, count: 1 },
  { min: 500, max: 1000, count: 1 },
]

const SATELLITE_ORIGINS = DEMO_ORIGINS.filter((o) => !o.isPrimary)

const PER_TYPE_AROUND_HOME = DISTANCE_BANDS.reduce((n, b) => n + b.count, 0) // 25
const PER_TYPE_PER_SATELLITE = SATELLITE_BANDS.reduce((n, b) => n + b.count, 0) // 4

/** 33: twenty-five around Home, four around each of the two satellites. */
export const SHOPS_PER_TYPE =
  PER_TYPE_AROUND_HOME + PER_TYPE_PER_SATELLITE * SATELLITE_ORIGINS.length

/** Family and deity names that front half the shop boards in Ahmedabad.
 * Paired with a type-appropriate suffix below to make a name that reads like
 * a real board over a real door rather than "Shop 47". */
const NAME_PREFIXES: { en: string; gu: string }[] = [
  { en: 'Shreeji', gu: 'શ્રીજી' }, { en: 'Jay Ambe', gu: 'જય અંબે' },
  { en: 'Umiya', gu: 'ઉમિયા' }, { en: 'Radhe', gu: 'રાધે' },
  { en: 'Sardar', gu: 'સરદાર' }, { en: 'Balaji', gu: 'બાલાજી' },
  { en: 'Mahavir', gu: 'મહાવીર' }, { en: 'Swaminarayan', gu: 'સ્વામિનારાયણ' },
  { en: 'Ashirwad', gu: 'આશીર્વાદ' }, { en: 'Shiv Shakti', gu: 'શિવ શક્તિ' },
  { en: 'Sagar', gu: 'સાગર' }, { en: 'Prabhat', gu: 'પ્રભાત' },
  { en: 'Riddhi Siddhi', gu: 'ઋદ્ધિ સિદ્ધિ' }, { en: 'Sneh', gu: 'સ્નેહ' },
  { en: 'Gokul', gu: 'ગોકુલ' }, { en: 'Vrundavan', gu: 'વૃંદાવન' },
  { en: 'Navkar', gu: 'નવકાર' }, { en: 'Arihant', gu: 'અરિહંત' },
  { en: 'Parshwanath', gu: 'પાર્શ્વનાથ' }, { en: 'Shreenath', gu: 'શ્રીનાથ' },
  { en: 'Bhagwati', gu: 'ભગવતી' }, { en: 'Jalaram', gu: 'જલારામ' },
  { en: 'Kailash', gu: 'કૈલાશ' }, { en: 'Gopi', gu: 'ગોપી' },
  { en: 'Anand', gu: 'આનંદ' }, { en: 'Satyam', gu: 'સત્યમ' },
  { en: 'Trupti', gu: 'તૃપ્તિ' }, { en: 'Rajhans', gu: 'રાજહંસ' },
  { en: 'Chamunda', gu: 'ચામુંડા' }, { en: 'Khodiyar', gu: 'ખોડિયાર' },
  { en: 'Mangalam', gu: 'મંગલમ' }, { en: 'Nilkanth', gu: 'નીલકંઠ' },
  { en: 'Vatsalya', gu: 'વાત્સલ્ય' }, { en: 'Payal', gu: 'પાયલ' },
  { en: 'Vishwas', gu: 'વિશ્વાસ' },
]

const NAME_SUFFIXES: Record<ShopType, { en: string; gu: string }[]> = {
  KIRANA: [
    { en: 'Kirana', gu: 'કિરાણા' }, { en: 'Kirana Store', gu: 'કિરાણા સ્ટોર' },
    { en: 'Kirana Stores', gu: 'કિરાણા સ્ટોર્સ' }, { en: 'Kirana Mart', gu: 'કિરાણા માર્ટ' },
    { en: 'Kirana Bhandar', gu: 'કિરાણા ભંડાર' }, { en: 'Provision Store', gu: 'પ્રોવિઝન સ્ટોર' },
  ],
  GENERAL: [
    { en: 'General Store', gu: 'જનરલ સ્ટોર' }, { en: 'General Stores', gu: 'જનરલ સ્ટોર્સ' },
    { en: 'Stores', gu: 'સ્ટોર્સ' }, { en: 'Super Store', gu: 'સુપર સ્ટોર' },
    { en: 'Provision Mart', gu: 'પ્રોવિઝન માર્ટ' }, { en: 'Departmental Store', gu: 'ડિપાર્ટમેન્ટલ સ્ટોર' },
  ],
  STATIONERY: [
    { en: 'Stationery', gu: 'સ્ટેશનરી' }, { en: 'Stationery Mart', gu: 'સ્ટેશનરી માર્ટ' },
    { en: 'Book Depot', gu: 'બુક ડેપો' }, { en: 'Book & Stationery', gu: 'બુક એન્ડ સ્ટેશનરી' },
    { en: 'Stationery Hub', gu: 'સ્ટેશનરી હબ' }, { en: 'Xerox & Stationery', gu: 'ઝેરોક્સ એન્ડ સ્ટેશનરી' },
  ],
  HARDWARE: [
    { en: 'Hardware', gu: 'હાર્ડવેર' }, { en: 'Hardware Stores', gu: 'હાર્ડવેર સ્ટોર્સ' },
    { en: 'Hardware Mart', gu: 'હાર્ડવેર માર્ટ' }, { en: 'Tools & Hardware', gu: 'ટૂલ્સ એન્ડ હાર્ડવેર' },
    { en: 'Paint & Hardware', gu: 'પેઈન્ટ એન્ડ હાર્ડવેર' }, { en: 'Electricals & Hardware', gu: 'ઈલેક્ટ્રિકલ્સ એન્ડ હાર્ડવેર' },
  ],
  CHEMIST: [
    { en: 'Medical Store', gu: 'મેડિકલ સ્ટોર' }, { en: 'Pharmacy', gu: 'ફાર્મસી' },
    { en: 'Chemist', gu: 'કેમિસ્ટ' }, { en: 'Medical & General', gu: 'મેડિકલ એન્ડ જનરલ' },
    { en: 'Medicos', gu: 'મેડિકોઝ' }, { en: 'Drug House', gu: 'ડ્રગ હાઉસ' },
  ],
  BAKERY: [
    { en: 'Bakery', gu: 'બેકરી' }, { en: 'Bakers', gu: 'બેકર્સ' },
    { en: 'Cake Shop', gu: 'કેક શોપ' }, { en: 'Bun & Bread Co', gu: 'બન એન્ડ બ્રેડ' },
    { en: 'Bakery & Confectionery', gu: 'બેકરી એન્ડ કન્ફેક્શનરી' }, { en: 'Home Bakery', gu: 'હોમ બેકરી' },
  ],
  DAIRY: [
    { en: 'Dairy', gu: 'ડેરી' }, { en: 'Dairy Farm', gu: 'ડેરી ફાર્મ' },
    { en: 'Milk Parlour', gu: 'મિલ્ક પાર્લર' }, { en: 'Dairy Point', gu: 'ડેરી પોઈન્ટ' },
    { en: 'Milk Centre', gu: 'મિલ્ક સેન્ટર' }, { en: 'Dairy & Milk', gu: 'ડેરી એન્ડ મિલ્ક' },
  ],
  FARSAN: [
    { en: 'Farsan', gu: 'ફરસાણ' }, { en: 'Farsan Mart', gu: 'ફરસાણ માર્ટ' },
    { en: 'Farsan House', gu: 'ફરસાણ હાઉસ' }, { en: 'Farsan & Sweets', gu: 'ફરસાણ એન્ડ સ્વીટ્સ' },
    { en: 'Sweets & Farsan', gu: 'સ્વીટ્સ એન્ડ ફરસાણ' }, { en: 'Farsan Corner', gu: 'ફરસાણ કોર્નર' },
  ],
  VEGETABLE: [
    { en: 'Vegetables', gu: 'વેજિટેબલ્સ' }, { en: 'Fruit & Veg', gu: 'ફ્રુટ એન્ડ વેજ' },
    { en: 'Sabji Bazaar', gu: 'શાકભાજી બજાર' }, { en: 'Veg Point', gu: 'વેજ પોઈન્ટ' },
    { en: 'Fresh Vegetables', gu: 'ફ્રેશ વેજિટેબલ્સ' }, { en: 'Sabji Mandi', gu: 'શાકમંડી' },
  ],
}

const TYPE_COPY: Record<ShopType, { street: string; descriptions: string[] }> = {
  KIRANA: { street: 'Navrangpura', descriptions: [
    'Neighbourhood kirana stocking daily staples, pulses, and spices.',
    'Family-run kirana that has weighed out loose grain on the same counter for two generations.',
    'Compact kirana with a deep masala shelf and delivery down the lane.',
  ] },
  GENERAL: { street: 'Navrangpura', descriptions: [
    'General store carrying household, cleaning, and personal-care lines.',
    'Everything-under-one-roof store, from detergent to school socks.',
    'Well-stocked provision store with a steady line at the billing counter.',
  ] },
  STATIONERY: { street: 'Gujarat College Road', descriptions: [
    'School and office stationery, notebooks, and printing.',
    'Exam-season stationery shop with project supplies and same-day xerox.',
    'Book depot carrying textbooks, notebooks, and art materials.',
  ] },
  HARDWARE: { street: 'Hardware Lane, Navrangpura', descriptions: [
    'Tools, electricals, paints, and everyday fittings.',
    'Hardware counter that will match a washer from a jar without blinking.',
    'Paint mixing, plumbing fittings, and hand tools under one shutter.',
  ] },
  CHEMIST: { street: 'Navrangpura', descriptions: [
    'Pharmacy counter with OTC medicines, first aid, and baby care.',
    'Chemist with a night window and a fridge for cold-chain stock.',
    'Medical store stocking OTC lines, baby care, and daily supplements.',
  ] },
  BAKERY: { street: 'Navrangpura', descriptions: [
    'Bread, buns, cakes, and rusks baked through the morning.',
    'Bakery whose first tray of bread is out before the milk arrives.',
    'Cakes to order, plus a daily counter of khari, toast, and buns.',
  ] },
  DAIRY: { street: 'Navrangpura Char Rasta', descriptions: [
    'Milk, curd, paneer, and ghee restocked twice a day.',
    'Dairy parlour taking the morning delivery at half past five.',
    'Milk centre with fresh paneer, shrikhand, and buttermilk.',
  ] },
  FARSAN: { street: 'Farsan Bazaar, Navrangpura', descriptions: [
    'Fresh farsan, khaman, and mithai made on the premises.',
    'Farsan counter frying fafda and jalebi through Sunday morning.',
    'Khaman, dhokla, and gathiya, sold warm by weight.',
  ] },
  VEGETABLE: { street: 'Sabji Bazaar, Navrangpura', descriptions: [
    'Loose vegetables and fruit brought in from the mandi each morning.',
    'Vegetable stall restocked daily from the Jamalpur mandi.',
    'Fruit and vegetables sold loose, weighed on a hanging scale.',
  ] },
}

const SHOP_TYPE_LIST = Object.keys(NAME_SUFFIXES) as ShopType[]

/** Distance of the nth shop inside a band — evenly spaced across the band and
 * nudged by the PRNG, so a type's shops fan out through the band instead of
 * piling up on its edge. */
function distanceInBand(band: DistanceBand, i: number, rng: () => number): number {
  const floor = band.placeFrom ?? band.min
  const step = (band.max - floor) / (band.count + 1)
  const centre = floor + step * (i + 1)
  const jitter = (rng() - 0.5) * step * 0.7
  return Math.round(Math.min(band.max - 5, Math.max(floor + 5, centre + jitter)))
}

function generateShopsFor(type: ShopType, existing: ShopSeed[]): ShopSeed[] {
  const rng = seededRandomFor(`shops:${type}`)
  const suffixes = NAME_SUFFIXES[type]
  const copy = TYPE_COPY[type]
  const taken = new Set(existing.map((s) => s.name))
  const out: ShopSeed[] = []

  // Bearings are dealt from one evenly-spaced ring per type, rotated per type,
  // so a type's shops surround the origin instead of clustering on one side -
  // which is what stops "nearest first" always naming the same street.
  const ringOffset = SHOP_TYPE_LIST.indexOf(type) * (360 / SHOP_TYPE_LIST.length / 2)
  let placed = 0

  /** A board this type has not used yet. Deterministic linear probe rather
   * than a re-roll on collision, so the loop is bounded and the output stays
   * stable across reloads. */
  function mintName(i: number) {
    let prefix = NAME_PREFIXES[Math.floor(rng() * NAME_PREFIXES.length)]
    let suffix = suffixes[Math.floor(rng() * suffixes.length)]
    let probe = 0
    while (taken.has(`${prefix.en} ${suffix.en}`) && probe < NAME_PREFIXES.length * suffixes.length) {
      probe++
      prefix = NAME_PREFIXES[(probe * 7 + i) % NAME_PREFIXES.length]
      suffix = suffixes[(probe + i) % suffixes.length]
    }
    taken.add(`${prefix.en} ${suffix.en}`)
    return { prefix, suffix }
  }

  function placeBands(origin: DemoOrigin, bands: DistanceBand[]) {
    for (const band of bands) {
      // Shops of this type that the API seed already placed in this band count
      // towards the band's target, so every type totals exactly
      // PER_TYPE_AROUND_HOME around Home. Only Home has transcribed shops.
      const alreadyHere = origin.isPrimary
        ? existing.filter((s) => s.distanceMetres > band.min && s.distanceMetres <= band.max).length
        : 0
      const needed = Math.max(0, band.count - alreadyHere)

      for (let i = 0; i < needed; i++) {
        const { prefix, suffix } = mintName(i)
        out.push({
          name: `${prefix.en} ${suffix.en}`,
          nameGu: `${prefix.gu} ${suffix.gu}`,
          type,
          originId: origin.id,
          distanceMetres: distanceInBand(band, i, rng),
          bearing: (ringOffset + (placed * 360) / SHOPS_PER_TYPE + rng() * 8) % 360,
          status: 'ACTIVE',
          // Roughly seven in ten shops deliver; the rest are collect-only, which
          // is what makes the delivery badge worth reading at all.
          acceptsDelivery: rng() < 0.7,
          // Around Home the street is the one that trade actually occupies;
          // a satellite's shops carry that neighbourhood's road instead.
          address: `${3 + Math.floor(rng() * 180)}, ${origin.isPrimary ? copy.street : origin.street}`,
          description: copy.descriptions[Math.floor(rng() * copy.descriptions.length)],
        })
        placed++
      }
    }
  }

  for (const origin of DEMO_ORIGINS) {
    placeBands(origin, origin.isPrimary ? DISTANCE_BANDS : SATELLITE_BANDS)
  }
  return out
}

const GENERATED_SHOP_SEED: ShopSeed[] = SHOP_TYPE_LIST.flatMap((type) =>
  generateShopsFor(type, SHOP_SEED.filter((s) => s.type === type && s.status === 'ACTIVE')),
)

const ORIGIN_BY_ID = new Map(DEMO_ORIGINS.map((o) => [o.id, o]))

const ALL_SHOP_SEED: ShopSeed[] = [...SHOP_SEED, ...GENERATED_SHOP_SEED]

const OPENING_HOURS: OpeningHours = {
  mon: { open: '09:00', close: '21:00' }, tue: { open: '09:00', close: '21:00' },
  wed: { open: '09:00', close: '21:00' }, thu: { open: '09:00', close: '21:00' },
  fri: { open: '09:00', close: '21:00' }, sat: { open: '09:00', close: '21:00' },
  sun: { open: '10:00', close: '14:00' }, isTemporarilyClosed: false,
}
const CHEMIST_HOURS: OpeningHours = { ...OPENING_HOURS, sun: { open: '00:00', close: '23:59' } }
/** Bakeries, dairies, and vegetable stalls open before dawn and shut early —
 * the difference is what makes "Open now" a meaningful filter rather than a
 * badge that reads the same on every card. */
const EARLY_HOURS: OpeningHours = {
  mon: { open: '06:00', close: '20:00' }, tue: { open: '06:00', close: '20:00' },
  wed: { open: '06:00', close: '20:00' }, thu: { open: '06:00', close: '20:00' },
  fri: { open: '06:00', close: '20:00' }, sat: { open: '06:00', close: '20:00' },
  sun: { open: '06:00', close: '13:00' }, isTemporarilyClosed: false,
}

function hoursFor(type: ShopType): OpeningHours {
  if (type === 'CHEMIST') return CHEMIST_HOURS
  if (type === 'DAIRY' || type === 'BAKERY' || type === 'VEGETABLE') return EARLY_HOURS
  return OPENING_HOURS
}

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

/** Share of shops shuttered for the day regardless of the clock — a licence
 * renewal, a family function, stock-taking. Without it "Closed" only ever
 * appears outside business hours, so the closed-shop state goes untested
 * through the whole working day. */
const TEMPORARILY_CLOSED_RATE = 0.15

/** Only ACTIVE shops are visible to customers — PENDING/SUSPENDED shops
 * exist in the seed for the merchant/admin apps, not this one. */
export const SHOPS_INTERNAL = ALL_SHOP_SEED
  .filter((s) => s.status === 'ACTIVE')
  .map((s) => {
    const id = slugToId('shop', s.name)
    const origin = ORIGIN_BY_ID.get(s.originId ?? PRIMARY_ORIGIN.id) ?? PRIMARY_ORIGIN
    const at = offsetPoint(origin.lat, origin.lng, s.distanceMetres, s.bearing)
    const rng = seededRandomFor(id)
    const hours: OpeningHours = {
      ...hoursFor(s.type),
      isTemporarilyClosed: rng() < TEMPORARILY_CLOSED_RATE,
    }
    const summary: ShopSummary = {
      id, name: s.name, nameGu: s.nameGu, type: s.type,
      // Measured from the anchor for every shop, satellites included - the
      // live value is recomputed against the customer on every request.
      distanceMeters: Math.round(haversineMetres(ANCHOR.lat, ANCHOR.lng, at.lat, at.lng)),
      address: s.address, lat: at.lat, lng: at.lng,
      // 3.4–4.9. Nothing sits below 3.4: a shop that bad closes, and a scale
      // whose bottom half is never used reads as decoration.
      avgRating: Number((3.4 + rng() * 1.5).toFixed(1)),
      // 20–2000 — a new stall and an institution should not wear the same
      // number of reviews.
      ratingCount: 20 + Math.floor(rng() * 1981),
      isOpenNow: isOpenNow(hours),
      acceptsDelivery: s.acceptsDelivery,
      deliveryFee: s.acceptsDelivery ? pick(rng, [10, 15, 20, 25]) : 0,
      minOrderValue: s.acceptsDelivery ? pick(rng, [99, 149, 199, 249]) : 0,
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
