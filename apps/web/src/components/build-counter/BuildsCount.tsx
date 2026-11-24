import { copy } from '../../app/copy'
import { useBuildsCount } from './BuildsCountProvider'

/** "Built N times"; renders nothing while unknown or when the API is down (docs/product-spec.md F10). */
export function BuildsCount({ className }: { className?: string }) {
  const count = useBuildsCount()
  if (count === null) return null
  return <span className={className}>{copy.counter.built(count)}</span>
}
