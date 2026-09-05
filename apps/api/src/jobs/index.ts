import cron from 'node-cron'
import { runDecayJob } from './decay.job'
import { runExpiryJob } from './expiry.job'

export { runDecayJob } from './decay.job'
export { runExpiryJob } from './expiry.job'

/**
 * Hourly cron registration for the real running server (spec §7/§6: "an
 * hourly node-cron job..."). Deliberately *not* called from `createApp()` /
 * anywhere Vitest touches — the demo panel and every test invoke
 * `runDecayJob`/`runExpiryJob` directly and synchronously instead, so a
 * scheduled tick can never race a test's own assertions. Call this once from
 * `server.ts` at real process startup.
 */
export function registerScheduledJobs(): void {
  cron.schedule('0 * * * *', () => {
    runDecayJob().catch((err) => console.error('decay job failed', err))
  })
  cron.schedule('0 * * * *', () => {
    runExpiryJob().catch((err) => console.error('expiry job failed', err))
  })
}
