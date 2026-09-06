import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { OpeningHours, WeekdayKey } from '@/api/types'
import { WEEKDAY_KEYS } from '@/api/types'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'

function allDays(open: string, close: string): OpeningHours {
  const day = { open, close }
  return { mon: day, tue: day, wed: day, thu: day, fri: day, sat: day, sun: day, isTemporarilyClosed: false }
}
function sixDays(open: string, close: string): OpeningHours {
  return { mon: { open, close }, tue: { open, close }, wed: { open, close }, thu: { open, close }, fri: { open, close }, sat: { open, close }, sun: null, isTemporarilyClosed: false }
}

const PRESETS = [
  { key: 'presetStandard', build: () => allDays('09:00', '21:00') },
  { key: 'presetShort', build: () => sixDays('10:00', '20:00') },
  { key: 'presetLong', build: () => allDays('08:00', '23:00') },
] as const

function isEqual(a: OpeningHours, b: OpeningHours): boolean {
  return WEEKDAY_KEYS.every((d) => JSON.stringify(a[d] ?? null) === JSON.stringify(b[d] ?? null))
}

/** Presets ("9 AM – 9 PM, open all days") to avoid 14 dropdowns (spec R9),
 * with a per-day editor available for shops that genuinely need one. */
export function HoursEditor({ value, onChange }: { value: OpeningHours; onChange: (v: OpeningHours) => void }) {
  const { t } = useTranslation()
  const matchingPreset = PRESETS.find((p) => isEqual(p.build(), value))
  const [customOpen, setCustomOpen] = useState(!matchingPreset)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {PRESETS.map((preset) => {
          const active = !customOpen && matchingPreset?.key === preset.key
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => { onChange(preset.build()); setCustomOpen(false) }}
              className={cn(
                'min-h-[52px] rounded-2xl border-2 px-4 py-3 text-left text-sm font-semibold transition-colors',
                active ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-brand-100 bg-white text-ink/80',
              )}
            >
              {t(`register.timings.${preset.key}`)}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setCustomOpen(true)}
          className={cn(
            'min-h-[52px] rounded-2xl border-2 px-4 py-3 text-left text-sm font-semibold transition-colors',
            customOpen ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-brand-100 bg-white text-ink/80',
          )}
        >
          {t('register.timings.presetCustom')}
        </button>
      </div>

      {customOpen && (
        <Card className="flex flex-col gap-2 p-3">
          {WEEKDAY_KEYS.map((day: WeekdayKey) => {
            const hours = value[day]
            return (
              <div key={day} className="flex items-center gap-2 border-b border-brand-50 py-2 last:border-0">
                <span className="w-16 shrink-0 text-sm font-semibold text-ink/70">{t(`register.timings.daysShort.${day}`)}</span>
                <label className="flex items-center gap-1.5 text-xs text-ink/50">
                  <input
                    type="checkbox"
                    checked={!hours}
                    onChange={(e) => onChange({ ...value, [day]: e.target.checked ? null : { open: '09:00', close: '21:00' } })}
                  />
                  {t('register.timings.closedToggle')}
                </label>
                {hours && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => onChange({ ...value, [day]: { ...hours, open: e.target.value } })}
                      className="rounded-lg border border-brand-100 px-2 py-1 text-xs"
                    />
                    <span className="text-ink/30">–</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => onChange({ ...value, [day]: { ...hours, close: e.target.value } })}
                      className="rounded-lg border border-brand-100 px-2 py-1 text-xs"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </Card>
      )}

      <label className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
        <input
          type="checkbox"
          checked={value.isTemporarilyClosed}
          onChange={(e) => onChange({ ...value, isTemporarilyClosed: e.target.checked })}
        />
        {t('register.timings.temporarilyClosed')}
      </label>
    </div>
  )
}
