import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/api'
import { useAuth } from '@/state/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { IconPhone, IconX, IconChevronLeft } from '@/components/ui/Icon'

export default function Login() {
  const navigate = useNavigate()
  const toast = useToast()
  const { refresh } = useAuth()
  /** Demo-mode OTP. Never a secret — it is printed to the server console too. */
  const DEMO_OTP = '123456'

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [devBannerDismissed, setDevBannerDismissed] = useState(false)
  const [devOtp, setDevOtp] = useState<string | null>(null)

  const requestOtp = useMutation({
    mutationFn: () => api.requestOtp({ phone }),
    // The real API never returns the OTP over the wire — it only logs it to the
    // server console. In demo mode it is always the same fixed code, so the dev
    // banner shows that constant rather than anything the response carried.
    onSuccess: () => { setDevOtp(DEMO_OTP); setStep('otp') },
    onError: () => toast.show('Enter a valid 10-digit mobile number', 'error'),
  })

  const verifyOtp = useMutation({
    mutationFn: () => api.verifyOtp({ phone, otp }),
    onSuccess: async () => {
      await refresh()
      toast.show('Logged in', 'success')
      navigate('/account', { replace: true })
    },
    onError: (e: unknown) => toast.show(e instanceof Error ? e.message : 'Invalid OTP', 'error'),
  })

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-gradient-to-b from-brand-50 via-white to-white px-6 pb-10 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <button onClick={() => (step === 'otp' ? setStep('phone') : navigate(-1))} aria-label="Back" className="mb-6 flex h-9 w-9 items-center justify-center rounded-full hover:bg-brand-50">
        <IconChevronLeft size={22} />
      </button>

      {step === 'phone' ? (
        <>
          <h1 className="font-display text-2xl font-bold text-ink">Log in to ShopNear</h1>
          <p className="mt-1 text-sm text-ink/55">We'll send a one-time code to verify your number.</p>
          <form
            className="mt-8 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (/^[6-9]\d{9}$/.test(phone)) {
                requestOtp.mutate()
              } else {
                toast.show('Enter a valid 10-digit mobile number', 'error')
              }
            }}
          >
            <Input
              leftIcon={<IconPhone size={17} />} inputMode="numeric" maxLength={10} autoFocus
              placeholder="10-digit mobile number" value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
            <Button type="submit" size="lg" loading={requestOtp.isPending} disabled={phone.length !== 10}>Send OTP</Button>
          </form>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-bold text-ink">Enter the OTP</h1>
          <p className="mt-1 text-sm text-ink/55">Sent to +91 {phone}</p>

          {!devBannerDismissed && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-brand-300 bg-brand-50 p-3.5 text-xs">
              <span className="flex-1 text-brand-700">
                <strong>Demo mode:</strong> the OTP is always <span className="font-mono font-bold">{devOtp}</span>
              </span>
              <button onClick={() => setDevBannerDismissed(true)} aria-label="Dismiss" className="shrink-0 text-brand-400 hover:text-brand-700">
                <IconX size={15} />
              </button>
            </div>
          )}

          <form
            className="mt-6 flex flex-col gap-4"
            onSubmit={(e) => { e.preventDefault(); if (otp.length === 6) verifyOtp.mutate() }}
          >
            <Input
              inputMode="numeric" maxLength={6} autoFocus placeholder="6-digit OTP" value={otp}
              className="text-center text-lg tracking-[0.5em]"
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <Button type="submit" size="lg" loading={verifyOtp.isPending} disabled={otp.length !== 6}>Verify & continue</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => requestOtp.mutate()}>Resend OTP</Button>
          </form>
        </>
      )}
    </div>
  )
}
