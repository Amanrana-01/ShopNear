import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useAppMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface Toast { id: number; message: string; tone: 'success' | 'error' | 'info' }
interface ToastContextValue { show: (message: string, tone?: Toast['tone']) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

const TONE = {
  success: { bg: 'bg-success-700', Icon: CheckCircle2 },
  error: { bg: 'bg-rose-600', Icon: AlertCircle },
  info: { bg: 'bg-ink', Icon: Info },
} as const

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const m = useAppMotion()

  const show = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t.slice(-2), { id, message, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div
          className="pointer-events-none fixed inset-x-0 bottom-28 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-8"
          aria-live="polite"
        >
          <AnimatePresence initial={false}>
            {toasts.map((t) => {
              const { bg, Icon } = TONE[t.tone]
              return (
                <motion.div
                  key={t.id}
                  layout
                  role="status"
                  initial={m.reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={m.reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.95 }}
                  transition={m.transition}
                  className={cn(
                    'pointer-events-auto flex max-w-sm items-center gap-2 rounded-pill px-4 py-2.5',
                    'text-sm font-medium text-white shadow-lift',
                    bg,
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  {t.message}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
