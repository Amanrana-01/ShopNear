import type { LocationPreset } from '@shopnear/shared'
import { ANCHOR, offsetPoint } from './helpers'

const office = offsetPoint(ANCHOR.lat, ANCHOR.lng, 2000, 250)
const hostel = offsetPoint(ANCHOR.lat, ANCHOR.lng, 900, 15)

export const LOCATION_PRESETS: LocationPreset[] = [
  {
    id: 'home', label: 'Home', sublabel: '80 m from Shreeji Kirana, Navrangpura',
    lat: ANCHOR.lat, lng: ANCHOR.lng,
  },
  {
    id: 'office', label: 'Office', sublabel: '2 km away, Ashram Road',
    lat: office.lat, lng: office.lng,
  },
  {
    id: 'hostel', label: 'Hostel', sublabel: '900 m away, Gujarat College Road',
    lat: hostel.lat, lng: hostel.lng,
  },
]
