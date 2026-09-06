import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { IconLoader } from './Icon'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg' | 'xl'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-600 active:bg-brand-700 shadow-soft disabled:bg-brand-200',
  secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200',
  outline: 'border-2 border-brand-200 text-brand-700 bg-white hover:bg-brand-50',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-soft disabled:bg-rose-200',
  success: 'bg-teal-600 text-white hover:bg-teal-700 shadow-soft disabled:bg-teal-100',
}
// Sizes skew large across the whole app on purpose — this is a
// behind-the-counter, one-thumb, low-literacy interface (spec: "big touch
// targets"). Even "sm" stays comfortably tappable.
const SIZE_CLASSES: Record<Size, string> = {
  sm: 'text-sm px-3.5 py-2 gap-1.5 min-h-[40px]',
  md: 'text-base px-5 py-3 gap-2 min-h-[48px]',
  lg: 'text-lg px-6 py-4 gap-2 min-h-[56px]',
  xl: 'text-xl px-8 py-5 gap-2.5 min-h-[68px]',
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
        'inline-flex items-center justify-center rounded-2xl font-semibold',
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
      {loading && <IconLoader size={18} />}
      {children}
    </button>
  )
})
