import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { IconCheckCircle, IconAlert } from './Icon'

interface ToastItem {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  show: (message: string, tone?: ToastItem['tone']) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string, tone: ToastItem['tone'] = 'info') => {
    const id = nextId++
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex max-w-sm items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-pop animate-fade-in-up',
              t.tone === 'success' && 'bg-teal-600 text-white',
              t.tone === 'error' && 'bg-rose-600 text-white',
              t.tone === 'info' && 'bg-ink text-white',
            )}
          >
            {t.tone === 'success' && <IconCheckCircle size={18} />}
            {t.tone === 'error' && <IconAlert size={18} />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
