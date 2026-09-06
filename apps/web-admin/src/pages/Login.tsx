import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/state/AuthContext'
import { Button } from '@/components/ui/Button'
import { IconLock, IconMail, IconAlert } from '@/components/ui/Icon'

/**
 * Admin login — email + password, at a route never linked from either
 * public app (spec §5, R8). Not a shared login form with a role dropdown.
 */
export default function Login() {
  const { login, status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from ?? '/shops'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/shops', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500 px-4">
      <div className="w-full max-w-sm rounded-card bg-white p-8 shadow-pop animate-fade-in-up">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white font-display text-lg font-bold">S</div>
          <h1 className="font-display text-lg font-bold text-ink">ShopNear Admin</h1>
          <p className="mt-1 text-sm text-ink/55">Operator console — sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink/70">Email</span>
            <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-3 py-2.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
              <IconMail size={16} className="shrink-0 text-ink/40" />
              <input
                type="email"
                required
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@shopnear.local"
                className="w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-ink/30"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink/70">Password</span>
            <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-3 py-2.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
              <IconLock size={16} className="shrink-0 text-ink/40" />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border-none bg-transparent text-sm text-ink outline-none placeholder:text-ink/30"
              />
            </div>
          </label>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
              <IconAlert size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" size="lg" fullWidth loading={submitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink/40">
          This route is internal — never linked from the customer or merchant apps.
        </p>
      </div>
    </div>
  )
}
