import { cn } from '@/lib/utils'

/**
 * The ShopNear mark: a storefront inside a map pin.
 *
 * It says the whole proposition in one shape — a *shop* at a *place near you*
 * — which is why it beats the "SN" monogram it replaces. Drawn as inline SVG
 * rather than shipped as an image so it stays sharp at favicon size, needs no
 * network request, and can be recoloured per surface.
 *
 * Palette is the app's own: brand purple pin, white storefront, accent-orange
 * awning. The awning is the one warm note in the identity, and it earns its
 * place by being the part that reads first at 16px.
 */

export function LogoMark({
  size = 36,
  className,
  /** Inverted for use on the brand-coloured header and hero panels. */
  tone = 'brand',
}: { size?: number; className?: string; tone?: 'brand' | 'onDark' }) {
  const pin = tone === 'onDark' ? '#FFFFFF' : '#7B2FBE'
  const store = tone === 'onDark' ? '#7B2FBE' : '#FFFFFF'
  const awning = '#EA580C'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="ShopNear"
      className={cn('shrink-0', className)}
    >
      {/* Pin */}
      <path
        d="M24 3a17 17 0 0 0-17 17c0 9.6 11.5 20.8 15.6 24.5a2 2 0 0 0 2.8 0C29.5 40.8 41 29.6 41 20A17 17 0 0 0 24 3Z"
        fill={pin}
      />
      {/* Storefront body */}
      <path d="M16 17.5h16V29a1 1 0 0 1-1 1H17a1 1 0 0 1-1-1V17.5Z" fill={store} />
      {/* Doorway, cut back to the pin colour so it reads as depth at any size */}
      <path d="M21 22h6v8h-6z" fill={pin} />
      {/* Awning */}
      <path d="M14.6 17.5 17.2 12a1 1 0 0 1 .9-.6h11.8a1 1 0 0 1 .9.6l2.6 5.5H14.6Z" fill={awning} />
    </svg>
  )
}

/**
 * Mark plus wordmark. "Shop" in ink, "Near" in brand — the split makes the
 * second half read as the promise rather than as half a compound noun.
 */
export function Logo({
  size = 36,
  tone = 'brand',
  className,
}: { size?: number; tone?: 'brand' | 'onDark'; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} tone={tone} />
      <span
        className={cn(
          'font-display font-extrabold tracking-tight',
          tone === 'onDark' ? 'text-white' : 'text-ink',
        )}
        style={{ fontSize: size * 0.52 }}
      >
        Shop
        <span className={tone === 'onDark' ? 'text-white/70' : 'text-brand'}>Near</span>
      </span>
    </span>
  )
}
