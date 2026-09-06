import type { LocationPreset } from '@shopnear/shared'
import { DEMO_ORIGINS } from './origins'

/** The presets are the demo origins — the three points the shop fixture is
 * built around. Kept as one list so a preset can never drift away from the
 * cluster generated for it. */
export const LOCATION_PRESETS: LocationPreset[] = DEMO_ORIGINS.map((o) => ({
  id: o.id, label: o.label, sublabel: o.sublabel, lat: o.lat, lng: o.lng,
}))
