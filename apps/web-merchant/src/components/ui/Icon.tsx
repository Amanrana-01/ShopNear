import type { SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base(props: IconProps) {
  const { size = 20, ...rest } = props
  return {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const, 'aria-hidden': true, focusable: false, ...rest,
  }
}

export const IconHome = (p: IconProps) => (
  <svg {...base(p)}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" /></svg>
)
export const IconBag = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 8h12l-1 12.5a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
)
export const IconUser = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
)
export const IconChevronRight = (p: IconProps) => (
  <svg {...base(p)}><polyline points="9 6 15 12 9 18" /></svg>
)
export const IconChevronLeft = (p: IconProps) => (
  <svg {...base(p)}><polyline points="15 6 9 12 15 18" /></svg>
)
export const IconChevronDown = (p: IconProps) => (
  <svg {...base(p)}><polyline points="6 9 12 15 18 9" /></svg>
)
export const IconChevronUp = (p: IconProps) => (
  <svg {...base(p)}><polyline points="6 15 12 9 18 15" /></svg>
)
export const IconMapPin = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
)
export const IconCheckCircle = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.3 2.3 4.7-5.1" /></svg>
)
export const IconClock = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5.2l3.5 2" /></svg>
)
export const IconAlert = (p: IconProps) => (
  <svg {...base(p)}><path d="M10.6 4.2 2.9 18a1.5 1.5 0 0 0 1.3 2.2h15.6a1.5 1.5 0 0 0 1.3-2.2L13.4 4.2a1.5 1.5 0 0 0-2.8 0Z" /><line x1="12" y1="10" x2="12" y2="13.5" /><circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none" /></svg>
)
export const IconHelp = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.3a2.5 2.5 0 1 1 3.6 2.3c-.9.5-1.1 1-1.1 1.9" /><circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" /></svg>
)
export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
)
export const IconMinus = (p: IconProps) => (
  <svg {...base(p)}><line x1="5" y1="12" x2="19" y2="12" /></svg>
)
export const IconX = (p: IconProps) => (
  <svg {...base(p)}><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
)
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}><polyline points="4 12 9.5 17.5 20 6" /></svg>
)
export const IconPackage = (p: IconProps) => (
  <svg {...base(p)}><path d="M21 8.5 12 4 3 8.5v7L12 20l9-4.5v-7Z" /><path d="M3 8.5 12 13l9-4.5" /><line x1="12" y1="13" x2="12" y2="20" /></svg>
)
export const IconStore = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" /><path d="M3 5h18l1.2 4.2a1.6 1.6 0 0 1-1.55 2 1.9 1.9 0 0 1-1.8-1.4A1.9 1.9 0 0 1 17 11.2a1.9 1.9 0 0 1-1.85-1.4 1.9 1.9 0 0 1-1.85 1.4A1.9 1.9 0 0 1 11.45 9.8 1.9 1.9 0 0 1 9.6 11.2a1.9 1.9 0 0 1-1.85-1.4A1.9 1.9 0 0 1 5.9 11.2a1.6 1.6 0 0 1-1.55-2L3 5Z" /></svg>
)
export const IconTruck = (p: IconProps) => (
  <svg {...base(p)}><rect x="2" y="7" width="12" height="9" rx="1" /><path d="M14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></svg>
)
export const IconPhone = (p: IconProps) => (
  <svg {...base(p)}><path d="M5 4h3.2l1.3 4.4-2 1.6a12 12 0 0 0 5.5 5.5l1.6-2 4.4 1.3V18a2 2 0 0 1-2.2 2A16 16 0 0 1 3 6.2 2 2 0 0 1 5 4Z" /></svg>
)
export const IconEdit = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /></svg>
)
export const IconLogOut = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><polyline points="15 16 20 12 15 8" /><line x1="20" y1="12" x2="9" y2="12" /></svg>
)
export const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)}><line x1="4" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></svg>
)
export const IconLoader = (p: IconProps) => (
  <svg {...base(p)} className={`animate-spin ${p.className ?? ''}`}><path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></svg>
)
export const IconTrash = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></svg>
)
export const IconClipboard = (p: IconProps) => (
  <svg {...base(p)}><rect x="6" y="4" width="12" height="17" rx="1.5" /><rect x="9" y="2.5" width="6" height="3" rx="1" /></svg>
)
export const IconBell = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 10a6 6 0 0 1 12 0c0 4.5 1.5 6 1.5 6h-15S6 14.5 6 10Z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>
)
export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.2" y2="16.2" /></svg>
)
export const IconCamera = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13.5" r="3.5" /></svg>
)
export const IconBarcode = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 5v14M8 5v14M11 5v14M15 5v14M17.5 5v14M20 5v14" /></svg>
)
export const IconGlobe = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" /></svg>
)
export const IconCalendar = (p: IconProps) => (
  <svg {...base(p)}><rect x="3.5" y="5" width="17" height="15" rx="1.5" /><line x1="3.5" y1="9.5" x2="20.5" y2="9.5" /><line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" /></svg>
)
export const IconTrendingUp = (p: IconProps) => (
  <svg {...base(p)}><polyline points="3 17 9.5 10.5 13.5 14.5 21 6" /><polyline points="14.5 6 21 6 21 12.5" /></svg>
)
export const IconRefresh = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" /><polyline points="18 3 18 7 14 7" /><polyline points="6 21 6 17 10 17" /></svg>
)
export const IconFilter = (p: IconProps) => (
  <svg {...base(p)}><line x1="4" y1="7" x2="20" y2="7" /><circle cx="9" cy="7" r="2" fill="currentColor" stroke="none" /><line x1="4" y1="17" x2="20" y2="17" /><circle cx="15" cy="17" r="2" fill="currentColor" stroke="none" /></svg>
)
export const IconCopy = (p: IconProps) => (
  <svg {...base(p)}><rect x="9" y="9" width="11" height="11" rx="1.5" /><path d="M5.5 15H5a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 5 3.5h8.5A1.5 1.5 0 0 1 15 5v.5" /></svg>
)
export const IconLock = (p: IconProps) => (
  <svg {...base(p)}><rect x="5" y="10.5" width="14" height="9.5" rx="1.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>
)
export const IconVolume = ({ muted, ...p }: IconProps & { muted?: boolean }) => (
  <svg {...base(p)}>
    <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4Z" />
    {muted ? <line x1="15" y1="9" x2="20" y2="15" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7" />}
    {muted && <line x1="20" y1="9" x2="15" y2="15" />}
  </svg>
)
