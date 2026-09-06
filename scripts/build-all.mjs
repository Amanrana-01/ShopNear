/**
 * Builds all three clients into a single deployable directory, so the whole
 * platform lives behind one URL:
 *
 *   dist/                 customer storefront   →  /
 *   dist/merchant/        shop console          →  /merchant
 *   dist/admin/           operator console      →  /admin
 *
 * Each app stays its own bundle; only the hosting is unified. Two things have
 * to agree for that to work, and both are set here rather than committed to
 * any app's config, so `npm run dev` keeps serving each app at its own root:
 *
 *   SHOPNEAR_BASE      Vite's `base` — rewrites asset URLs into the subpath,
 *                      and is read back by the router as BASE_URL.
 *   VITE_*_URL         where each app should link to its siblings (see the
 *                      `lib/apps.ts` in web-customer and web-merchant).
 *
 * The SPA fallback for each subpath is configured in the root vercel.json.
 */
import { spawnSync } from 'node:child_process'
import { rm, cp, mkdir, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'dist')

const APPS = [
  {
    workspace: '@shopnear/web-customer',
    from: 'apps/web-customer/dist',
    to: '.',
    env: { VITE_MERCHANT_URL: '/merchant', VITE_ADMIN_URL: '/admin' },
  },
  {
    workspace: '@shopnear/web-merchant',
    from: 'apps/web-merchant/dist',
    to: 'merchant',
    env: { SHOPNEAR_BASE: '/merchant/', VITE_CUSTOMER_URL: '/' },
  },
  {
    workspace: '@shopnear/web-admin',
    from: 'apps/web-admin/dist',
    to: 'admin',
    env: { SHOPNEAR_BASE: '/admin/' },
  },
]

function build(app) {
  console.log(`\n── building ${app.workspace} ${Object.entries(app.env).map(([k, v]) => `${k}=${v}`).join(' ')}`)
  const result = spawnSync('npm', ['--workspace', app.workspace, 'run', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...app.env },
  })
  if (result.status !== 0) {
    console.error(`\nBuild failed for ${app.workspace} (exit ${result.status}).`)
    process.exit(result.status ?? 1)
  }
}

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

for (const app of APPS) build(app)

// Copy after every build succeeds, so a failure never leaves a half-assembled
// dist that looks deployable.
for (const app of APPS) {
  const source = path.join(ROOT, app.from)
  try {
    await access(source)
  } catch {
    console.error(`\nExpected build output at ${app.from}, but it does not exist.`)
    process.exit(1)
  }
  await cp(source, path.join(OUT, app.to), { recursive: true })
}

console.log(
  '\n✓ Combined build complete → dist/\n' +
    '    /           customer storefront\n' +
    '    /merchant   shop console\n' +
    '    /admin      operator console\n' +
    '\n  Preview it locally with:  npx serve dist  (or any static server)\n' +
    '  Remember to set VITE_API_URL for the deployed API before building for production.\n',
)
