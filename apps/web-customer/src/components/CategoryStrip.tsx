import type { Category } from '@shopnear/shared'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

/** Decorative only — system emoji renders correctly with zero network
 * dependency, which is why it's used here instead of an icon font/CDN. */
const ICON_EMOJI: Record<string, string> = {
  basket: '🧺', wheat: '🌾', lentil: '🫘', rice: '🍚', bottle: '🧴', spice: '🌶️', sugar: '🧂',
  milk: '🥛', butter: '🧈', cheese: '🧀', bread: '🍞', cookie: '🍪', cake: '🍰', soap: '🧼',
  toothbrush: '🪥', home: '🏠', spray: '🧽', 'washing-machine': '🧺', flame: '🪔', cup: '☕',
  chips: '🍟', candy: '🍬', bowl: '🥣', pencil: '✏️', notebook: '📓', pen: '🖊️', palette: '🎨',
  wrench: '🔧', bulb: '💡', paint: '🎨', pill: '💊', bandage: '🩹', baby: '🍼', carrot: '🥕',
  apple: '🍎', sweet: '🍭',
}

export function CategoryStrip({ categories, activeSlug }: { categories: Category[]; activeSlug?: string }) {
  const topLevel = categories.filter((c) => !c.parentId)
  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-1 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {topLevel.map((cat) => (
        <Link
          key={cat.id}
          to={`/search?category=${cat.slug}`}
          className="flex shrink-0 flex-col items-center gap-1.5 focus-visible:outline-none"
        >
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-soft transition-transform active:scale-90',
              activeSlug === cat.slug ? 'bg-brand text-white' : 'bg-white',
            )}
          >
            <span aria-hidden>{ICON_EMOJI[cat.iconName] ?? '🛒'}</span>
          </div>
          <span className="max-w-[64px] truncate text-center text-[11px] font-medium text-ink/70">{cat.name}</span>
        </Link>
      ))}
    </div>
  )
}
