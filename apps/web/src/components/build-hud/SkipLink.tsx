import { copy } from '../../app/copy'
import { useDirector } from '../../build/build-provider'

/**
 * First focusable element on the page. Rendered in the prerendered HTML; styles/build.css hides it
 * whenever the page is not building (reduced motion, already skipped, JS took over and finished).
 */
export function SkipLink() {
  const director = useDirector()
  return (
    <button
      type="button"
      onClick={director.skip}
      className="build-skip-link sr-only z-50 rounded-pill bg-blue px-4 py-2 font-mono text-sm text-bg focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
    >
      {copy.hud.skipLink}
    </button>
  )
}
