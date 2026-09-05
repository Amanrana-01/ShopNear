// Prisma CLI and any script invoked as `npm --workspace @shopnear/api run
// <x>` execute with cwd = apps/api, but the project keeps a single .env at
// the repo root (see README). Both dotenv's default lookup and Prisma's own
// schema validation resolve `.env` relative to cwd, so neither would ever
// see the root file on its own. This copies the root .env into apps/api
// immediately before each db/dev script runs (wired up via npm's
// `pre<script>` hooks in package.json), keeping one source of truth at the
// root while satisfying tools that only look in cwd.
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..', '..')
const source = path.join(root, '.env')
const dest = path.join(__dirname, '..', '.env')

try {
  fs.copyFileSync(source, dest)
} catch {
  // No root .env yet (e.g. a fresh clone before `cp .env.example .env`) —
  // let the downstream command fail with its own clear error instead.
}
