import { ANCHOR, offsetPoint } from './helpers'

/**
 * The places a demo customer can actually stand.
 *
 * Every location the app can produce resolves to one of these three: the
 * three demo presets are these points verbatim, and a real device position is
 * snapped to the nearest of them (see `lib/demoLocation.ts`) because the
 * fixture neighbourhood only exists here.
 *
 * `shops.ts` places a cluster around each one, which is what makes the
 * radius picker's tightest rungs return results from *whichever* of the three
 * the customer picked, not just from Home.
 */
export interface DemoOrigin {
  id: 'home' | 'office' | 'hostel'
  label: string
  sublabel: string
  lat: number
  lng: number
  /** Street written onto the addresses of shops generated around this origin. */
  street: string
  /** The 14 hand-written seed shops all sit around `home`, so it already has a
   * dense cluster; the satellites need one generated for them. */
  isPrimary: boolean
}

const office = offsetPoint(ANCHOR.lat, ANCHOR.lng, 2000, 250)
const hostel = offsetPoint(ANCHOR.lat, ANCHOR.lng, 900, 15)

export const DEMO_ORIGINS: DemoOrigin[] = [
  {
    id: 'home', label: 'Home', sublabel: '80 m from Shreeji Kirana, Navrangpura',
    lat: ANCHOR.lat, lng: ANCHOR.lng, street: 'Navrangpura', isPrimary: true,
  },
  {
    id: 'office', label: 'Office', sublabel: '2 km away, Ashram Road',
    lat: office.lat, lng: office.lng, street: 'Ashram Road', isPrimary: false,
  },
  {
    id: 'hostel', label: 'Hostel', sublabel: '900 m away, Gujarat College Road',
    lat: hostel.lat, lng: hostel.lng, street: 'Gujarat College Road', isPrimary: false,
  },
]

export const PRIMARY_ORIGIN = DEMO_ORIGINS[0]
