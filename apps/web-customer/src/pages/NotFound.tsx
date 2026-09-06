import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-display text-5xl font-black text-brand-200">404</p>
      <h1 className="font-display text-lg font-bold text-ink">Page not found</h1>
      <p className="text-sm text-ink-muted">That page wandered off. Let's get you back home.</p>
      <Link to="/home"><Button size="sm" className="mt-2">Go home</Button></Link>
    </div>
  )
}
