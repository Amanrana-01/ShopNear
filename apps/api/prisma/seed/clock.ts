/**
 * The anchor "now" for all seeded timestamps, captured once per seed run.
 *
 * Deliberately the wall clock rather than a hard-coded instant: confidence
 * badges (spec §7) are computed from how *old* a timestamp is, so a fixed
 * date would make every seeded row look days stale the moment you demo it.
 *
 * Determinism (spec §11) is preserved because every seeded timestamp is a
 * fixed offset from this anchor — the *shape* of the data is identical on
 * every run, only its absolute position on the calendar moves. The
 * determinism check in the plan hashes prices and names, not timestamps,
 * for exactly this reason.
 *
 * Read once at module load so that a long seed run cannot drift mid-way.
 */
export const SEED_NOW = new Date()
