import { useEffect, useState } from 'react'

/** True while `active` is true and for `ms` after it turns false (the HUD stays up briefly after a build). */
export function useLinger(active: boolean, ms: number) {
  const [lingering, setLingering] = useState(active)
  // Adjusting state during render (not in an effect) so there is no frame where the HUD disappears.
  if (active && !lingering) setLingering(true)

  useEffect(() => {
    if (active || !lingering) return
    const timer = setTimeout(() => setLingering(false), ms)
    return () => clearTimeout(timer)
  }, [active, lingering, ms])

  return active || lingering
}
