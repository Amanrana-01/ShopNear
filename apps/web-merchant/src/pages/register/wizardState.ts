import type { ShopType, OpeningHours, AppLanguage } from '@/api/types'
import { NEIGHBOURHOOD_ANCHOR } from '@/lib/constants'
import { loadJSON, saveJSON, removeKey } from '@/lib/storage'

export interface WizardDraft {
  step: number
  owner: { name: string; phone: string; password: string; preferredLanguage: AppLanguage }
  shop: { name: string; nameGu: string; type: ShopType; description: string; phone: string }
  location: { address: string; landmark: string; pincode: string; lat: number; lng: number }
  openingHours: OpeningHours
  fulfilment: { acceptsDelivery: boolean; deliveryRadiusMeters: number; minOrderValue: number; deliveryFee: number }
  verification: { licenceNumber: string; photoUrl: string | null }
  starterItems: Record<string, number> // productId -> price, only checked items present
}

export const WIZARD_DRAFT_KEY = 'registrationDraft.v1'

export const DEFAULT_DRAFT: WizardDraft = {
  step: 1,
  owner: { name: '', phone: '', password: '', preferredLanguage: 'en' },
  shop: { name: '', nameGu: '', type: 'KIRANA', description: '', phone: '' },
  location: { address: '', landmark: '', pincode: '', lat: NEIGHBOURHOOD_ANCHOR.lat, lng: NEIGHBOURHOOD_ANCHOR.lng },
  openingHours: {
    mon: { open: '09:00', close: '21:00' }, tue: { open: '09:00', close: '21:00' }, wed: { open: '09:00', close: '21:00' },
    thu: { open: '09:00', close: '21:00' }, fri: { open: '09:00', close: '21:00' }, sat: { open: '09:00', close: '21:00' },
    sun: { open: '09:00', close: '21:00' }, isTemporarilyClosed: false,
  },
  fulfilment: { acceptsDelivery: false, deliveryRadiusMeters: 500, minOrderValue: 0, deliveryFee: 0 },
  verification: { licenceNumber: '', photoUrl: null },
  starterItems: {},
}

export function loadWizardDraft(): WizardDraft {
  return loadJSON(WIZARD_DRAFT_KEY, DEFAULT_DRAFT)
}

export function saveWizardDraft(draft: WizardDraft): void {
  saveJSON(WIZARD_DRAFT_KEY, draft)
}

export function clearWizardDraft(): void {
  removeKey(WIZARD_DRAFT_KEY)
}

export const TOTAL_STEPS = 7
export const STEP_NAMES = ['owner', 'shop', 'location', 'timings', 'fulfilment', 'verification', 'inventory'] as const
