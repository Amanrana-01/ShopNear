import type { SVGProps } from 'react'

// Copied from apps/web-customer's icon set (same conventions), plus a
// handful of admin-only additions at the bottom. Deliberately inline SVG —
// no icon-font/CDN dependency, so the app stays fully offline.
export type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base(props: IconProps) {
  const { size = 20, ...rest } = props
  return {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const, 'aria-hidden': true, focusable: false, ...rest,
  }
}

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
export const IconX = (p: IconProps) => (
  <svg {...base(p)}><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>
)
export const IconStore = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" /><path d="M3 5h18l1.2 4.2a1.6 1.6 0 0 1-1.55 2 1.9 1.9 0 0 1-1.8-1.4A1.9 1.9 0 0 1 17 11.2a1.9 1.9 0 0 1-1.85-1.4 1.9 1.9 0 0 1-1.85 1.4A1.9 1.9 0 0 1 11.45 9.8 1.9 1.9 0 0 1 9.6 11.2a1.9 1.9 0 0 1-1.85-1.4A1.9 1.9 0 0 1 5.9 11.2a1.6 1.6 0 0 1-1.55-2L3 5Z" /></svg>
)
export const IconPackage = (p: IconProps) => (
  <svg {...base(p)}><path d="M21 8.5 12 4 3 8.5v7L12 20l9-4.5v-7Z" /><path d="M3 8.5 12 13l9-4.5" /><line x1="12" y1="13" x2="12" y2="20" /></svg>
)
export const IconClipboard = (p: IconProps) => (
  <svg {...base(p)}><rect x="6" y="4" width="12" height="17" rx="1.5" /><rect x="9" y="2.5" width="6" height="3" rx="1" /></svg>
)
export const IconFlag = (p: IconProps) => (
  <svg {...base(p)}><path d="M6 3v18" /><path d="M6 4h11l-2.2 3.8L17 11.5H6" /></svg>
)
export const IconBarChart = (p: IconProps) => (
  <svg {...base(p)}><line x1="4" y1="20" x2="20" y2="20" /><rect x="6" y="12" width="3" height="7" /><rect x="10.5" y="7" width="3" height="12" /><rect x="15" y="10" width="3" height="9" /></svg>
)
export const IconSliders = (p: IconProps) => (
  <svg {...base(p)}><line x1="5" y1="21" x2="5" y2="14" /><line x1="5" y1="10" x2="5" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="19" y1="21" x2="19" y2="16" /><line x1="19" y1="12" x2="19" y2="3" /><circle cx="5" cy="12" r="2" /><circle cx="12" cy="10" r="2" /><circle cx="19" cy="14" r="2" /></svg>
)
export const IconLoader = (p: IconProps) => (
  <svg {...base(p)} className={`animate-spin ${p.className ?? ''}`}><path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></svg>
)
export const IconLogOut = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><polyline points="15 16 20 12 15 8" /><line x1="20" y1="12" x2="9" y2="12" /></svg>
)
export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.2" y2="16.2" /></svg>
)
export const IconChevronDown = (p: IconProps) => (
  <svg {...base(p)}><polyline points="6 9 12 15 18 9" /></svg>
)
export const IconChevronRight = (p: IconProps) => (
  <svg {...base(p)}><polyline points="9 6 15 12 9 18" /></svg>
)
export const IconMapPin = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></svg>
)
export const IconStar = (p: IconProps & { filled?: boolean }) => {
  const { filled, ...rest } = p
  return (
    <svg {...base(rest)} fill={filled ? 'currentColor' : 'none'}>
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    </svg>
  )
}
export const IconLock = (p: IconProps) => (
  <svg {...base(p)}><rect x="5" y="10.5" width="14" height="9" rx="1.5" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></svg>
)
export const IconMail = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="m4 6.5 8 6 8-6" /></svg>
)
export const IconMerge = (p: IconProps) => (
  <svg {...base(p)}><path d="M7 4v6a3 3 0 0 0 3 3h4" /><path d="M17 4v6a3 3 0 0 1-3 3" /><polyline points="14 10 17 13 20 10" /><line x1="12" y1="13" x2="12" y2="20" /></svg>
)
export const IconGrid = (p: IconProps) => (
  <svg {...base(p)}><rect x="3.5" y="3.5" width="7" height="7" rx="1" /><rect x="13.5" y="3.5" width="7" height="7" rx="1" /><rect x="3.5" y="13.5" width="7" height="7" rx="1" /><rect x="13.5" y="13.5" width="7" height="7" rx="1" /></svg>
)
export const IconArrowRight = (p: IconProps) => (
  <svg {...base(p)}><line x1="4" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></svg>
)
export const IconInfo = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="7.5" r="0.9" fill="currentColor" stroke="none" /></svg>
)
export const IconTrendingUp = (p: IconProps) => (
  <svg {...base(p)}><polyline points="3 17 9 11 13 15 21 6" /><polyline points="14 6 21 6 21 13" /></svg>
)
export const IconEdit = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /></svg>
)
export const IconTrash = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></svg>
)
export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
)
