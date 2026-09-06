import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#F7F5FB] px-6 text-center">
      <h1 className="font-display text-3xl font-bold text-ink">404</h1>
      <p className="text-ink/60">This page doesn't exist.</p>
      <Link to="/dashboard">
        <Button>Go home</Button>
      </Link>
    </div>
  )
}
