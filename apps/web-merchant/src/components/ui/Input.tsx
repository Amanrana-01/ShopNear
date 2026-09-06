import { forwardRef } from 'react'
import type { InputHTMLAttributes, TextareaHTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function FieldLabel({ className, children, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('mb-1.5 block text-sm font-semibold text-ink/80', className)} {...props}>
      {children}
    </label>
  )
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, error, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'w-full min-h-[48px] rounded-2xl border-2 bg-white px-4 py-2.5 text-base text-ink',
        'placeholder:text-ink/35 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        error ? 'border-rose-300' : 'border-brand-100 focus:border-brand-400',
        className,
      )}
      {...props}
    />
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-2xl border-2 border-brand-100 bg-white px-4 py-2.5 text-base text-ink',
          'placeholder:text-ink/35 transition-colors focus:border-brand-400',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          className,
        )}
        {...props}
      />
    )
  },
)

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null
  return <p className="mt-1 text-sm font-medium text-rose-600">{children}</p>
}
