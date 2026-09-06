import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import { Sheet } from './ui/Sheet'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { IconAlert } from './ui/Icon'

/**
 * Real camera barcode scanning via @zxing/browser (spec §9), reading a
 * printed barcode against the seeded `Product.barcode` field. Falls back to
 * a manual text-entry field whenever no camera is present/permitted — this
 * is a real device capability check, not a simulated toggle.
 */
export function BarcodeScannerSheet({
  open, onClose, onDetected,
}: { open: boolean; onClose: () => void; onDetected: (code: string) => void }) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [noCamera, setNoCamera] = useState(false)
  const [manualCode, setManualCode] = useState('')

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setNoCamera(false)

    async function start() {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        if (cancelled) return
        if (devices.length === 0) {
          setNoCamera(true)
          return
        }
        const reader = new BrowserMultiFormatReader()
        const deviceId = devices[devices.length - 1].deviceId // usually the back camera on mobile
        const controls = await reader.decodeFromVideoDevice(deviceId, videoRef.current!, (result) => {
          if (result) {
            onDetected(result.getText())
            controls.stop()
          }
        })
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
      } catch {
        if (!cancelled) setNoCamera(true)
      }
    }
    start()

    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [open, onDetected])

  function submitManual(e: React.FormEvent) {
    e.preventDefault()
    if (manualCode.trim()) {
      onDetected(manualCode.trim())
      setManualCode('')
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('inventoryPage.scannerTitle')}>
      {!noCamera && (
        <>
          <p className="mb-2 text-sm text-ink/60">{t('inventoryPage.scannerHint')}</p>
          <div className="overflow-hidden rounded-2xl bg-black">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
          </div>
        </>
      )}
      {noCamera && (
        <div className="mb-3 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
          <IconAlert size={18} className="mt-0.5 shrink-0" />
          {t('inventoryPage.scannerNoCamera')}
        </div>
      )}
      <form onSubmit={submitManual} className="mt-4 flex flex-col gap-2">
        <label className="text-sm font-semibold text-ink/70">{t('inventoryPage.manualBarcodeLabel')}</label>
        <div className="flex gap-2">
          <Input
            inputMode="numeric"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="e.g. 8900000100004"
          />
          <Button type="submit">{t('inventoryPage.manualBarcodeSubmit')}</Button>
        </div>
      </form>
    </Sheet>
  )
}
