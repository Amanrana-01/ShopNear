import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { SHOPS } from './shops'
import { getShopCatalogue } from './inventory'

/**
 * A shop's items belong to that shop.
 *
 * `getShopCatalogue(shopId)` is the only function in the app that returns
 * ShopItems, and the only screen that calls it is the shop's own page.
 * Everything else works in products and cross-shop offers, which is a
 * different thing: a product several shops happen to stock, never one shop's
 * shelves rendered somewhere global.
 */

describe('getShopCatalogue', () => {
  it('returns only rows belonging to the shop asked for', () => {
    const leaks: string[] = []
    for (const shop of SHOPS) {
      for (const entry of getShopCatalogue(shop.id)) {
        if (entry.offer.shopId !== shop.id) leaks.push(`${shop.id} <- ${entry.offer.shopId}`)
      }
    }
    expect(leaks).toEqual([])
  })

  it('has a catalogue for every shop', () => {
    const empty = SHOPS.filter((s) => getShopCatalogue(s.id).length === 0)
    expect(empty.map((s) => s.name)).toEqual([])
  })

  it('returns nothing for an unknown or missing shop id', () => {
    // Never "everything" — the failure mode this guards is a screen that asks
    // for no shop in particular and is handed the global pool.
    expect(getShopCatalogue('shop_does-not-exist')).toEqual([])
    expect(getShopCatalogue('')).toEqual([])
  })
})

/** A call, not a mention: prose about the rule is not a breach of it. */
const CALLS_IT = /\bgetShopCatalogue\s*\(/

describe('screens', () => {
  const SRC = join(__dirname, '..', '..')
  const sep = join('a', 'b').slice(1, -1) // platform path separator


  function tsxFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) return tsxFiles(full)
      return name.endsWith('.tsx') ? [full] : []
    })
  }

  it('renders shop items only on the shop page', () => {
    const callers = [...tsxFiles(join(SRC, 'pages')), ...tsxFiles(join(SRC, 'components'))]
      .filter((f) => CALLS_IT.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(SRC.length + 1).split(sep).join('/'))
    expect(callers).toEqual(['pages/ShopPage.tsx'])
  })
})
