/**
 * A synthesised two-tone "new order" chime via the Web Audio API — no MP3
 * asset, no CDN, works fully offline. Kept deliberately short and simple
 * (two beeps) so it reads clearly over a noisy shop counter without being
 * obnoxious on every 5-second poll tick.
 */
let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  return ctx
}

function beep(context: AudioContext, freq: number, startAt: number, duration: number) {
  const osc = context.createOscillator()
  const gain = context.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(0.35, startAt + 0.02)
  gain.gain.linearRampToValueAtTime(0, startAt + duration)
  osc.connect(gain)
  gain.connect(context.destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.02)
}

export function playAlertTone(): void {
  try {
    const context = getContext()
    if (!context) return
    if (context.state === 'suspended') context.resume().catch(() => {})
    const now = context.currentTime
    beep(context, 880, now, 0.16)
    beep(context, 1174.7, now + 0.2, 0.2)
  } catch {
    /* audio unavailable — silently skip, the toast/notification still fire */
  }
}
