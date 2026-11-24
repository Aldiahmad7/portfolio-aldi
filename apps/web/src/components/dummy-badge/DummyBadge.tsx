import dummyCount from 'virtual:dummy-count'

// Text lives here, not in app/copy.ts, so it is tree-shaken out of production with the component.
const label = (count: number) => `Dummy content: ${count} tersisa`

/** Dev-only reminder of placeholder content left. App renders it behind import.meta.env.DEV. */
export function DummyBadge() {
  if (dummyCount === 0) return null
  return (
    <p className="fixed top-24 right-4 z-50 rounded-pill border border-border bg-surface px-3 py-1 font-mono text-xs text-blue-pale shadow-hud">
      {label(dummyCount)}
    </p>
  )
}
