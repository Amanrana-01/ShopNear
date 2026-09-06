import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-600 active:bg-brand-700 shadow-soft disabled:bg-brand-200',
  secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200',
  outline: 'border border-brand-200 text-brand-700 bg-white hover:bg-brand-50',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-soft',
}
const SIZE_CLASSES: Record<Size, string> = {
  // Every size clears the 44px minimum touch target at md and above; `sm` is
  // reserved for controls that sit inside an already-tappable row.
  sm: 'text-sm px-3.5 py-2 gap-1.5',
  md: 'text-sm px-5 py-3 gap-2',
  lg: 'text-[15px] px-6 py-3.5 gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, fullWidth, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-pill font-bold',
        'transition-all duration-150 ease-out active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
})
