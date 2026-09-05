import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: ReactNode
  rightSlot?: ReactNode
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leftIcon, rightSlot, error, id, ...props },
  ref,
) {
  return (
    <div className="w-full">
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="pointer-events-none absolute left-4 text-ink/40">{leftIcon}</span>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-full border border-black/10 bg-white text-[15px] text-ink placeholder:text-ink/40',
            'py-3 pr-4 transition-shadow duration-150',
            leftIcon ? 'pl-11' : 'pl-4',
            rightSlot && 'pr-11',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
            error && 'border-rose-400 focus:ring-rose-400',
            className,
          )}
          {...props}
        />
        {rightSlot && <span className="absolute right-4">{rightSlot}</span>}
      </div>
      {error && <p className="mt-1.5 pl-4 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
})
