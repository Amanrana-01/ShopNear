import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">404</h1>
      <p className="text-sm text-ink/55">This page doesn't exist.</p>
      <Link to="/shops"><Button size="sm">Back to console</Button></Link>
    </div>
  )
}
