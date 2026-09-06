import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Database-backed suites (Tasks 3-9) must not run concurrently against
    // the same Postgres instance, so we keep a single fork.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'legacy/**'],
    // seedHistory.test.ts's beforeAll runs the full catalogue + shops +
    // history seed sequentially against real Postgres — well over the 10s
    // default hook timeout.
    hookTimeout: 60_000,
  },
})
