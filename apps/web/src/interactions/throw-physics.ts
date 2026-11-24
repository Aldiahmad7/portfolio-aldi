import { THROW } from './config'

export interface Sample {
  x: number
  y: number
  /** Milliseconds. */
  time: number
}

export interface Body {
  x: number
  y: number
  /** Pixels per second. */
  vx: number
  vy: number
}

export interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}

const clampSpeed = (vx: number, vy: number) => {
  const speed = Math.hypot(vx, vy)
  const scale = speed > THROW.maxSpeed ? THROW.maxSpeed / speed : 1
  return { vx: vx * scale, vy: vy * scale }
}

/** Release velocity from the last pointer samples (oldest first), capped at THROW.maxSpeed. */
export function releaseVelocity(samples: readonly Sample[]) {
  const recent = samples.slice(-THROW.samples)
  const first = recent[0]
  const last = recent.at(-1)
  if (!first || !last || last.time <= first.time) return { vx: 0, vy: 0 }
  const seconds = (last.time - first.time) / 1000
  return clampSpeed((last.x - first.x) / seconds, (last.y - first.y) / seconds)
}

/** One direction at THROW.tapSpeed, for touch where a tap stands in for a throw. */
export function tapVelocity(random: () => number) {
  const angle = random() * Math.PI * 2
  return { vx: Math.cos(angle) * THROW.tapSpeed, vy: Math.sin(angle) * THROW.tapSpeed }
}

function bounce(position: number, velocity: number, min: number, max: number) {
  if (position < min) return { position: min, velocity: Math.abs(velocity) * THROW.bounce }
  if (position > max) return { position: max, velocity: -Math.abs(velocity) * THROW.bounce }
  return { position, velocity }
}

/** Advances a thrown body: friction, then a bounce off any edge it crossed. */
export function stepBody(body: Body, seconds: number, bounds: Bounds): Body {
  const dt = Math.min(seconds, THROW.maxFrameSeconds)
  const keep = THROW.frictionPerSecond ** dt
  const x = bounce(body.x + body.vx * dt, body.vx * keep, bounds.left, bounds.right)
  const y = bounce(body.y + body.vy * dt, body.vy * keep, bounds.top, bounds.bottom)
  return { x: x.position, y: y.position, vx: x.velocity, vy: y.velocity }
}

export const isResting = (body: Body) => Math.hypot(body.vx, body.vy) < THROW.minSpeed
