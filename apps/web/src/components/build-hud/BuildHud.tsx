import { useState } from 'react'
import { copy } from '../../app/copy'
import { useBuildState, useDirector } from '../../build/build-provider'
import { HUD_IDLE_HIDE_MS, SPEEDS } from '../../build/config'
import { CURSOR_ARROW_PATH } from '../../build/cursor-element'
import { useCommentMode, useOpenCommandBar } from '../../interactions/InteractionsProvider'
import { BuildsCount } from '../build-counter/BuildsCount'
import { useLinger } from './use-linger'

const PERCENT = 100
/** Speech-bubble pin with a pointed bottom-left corner, like the comment pins on the page. */
const COMMENT_PIN_PATH = 'M8 1a7 7 0 1 1 0 14H1V8a7 7 0 0 1 7-7z'
const hudButton =
  'rounded-pill px-2 py-1 transition-colors duration-(--duration-fast) ease-standard hover:text-blue-light'

/** Bottom pill: progress while building, then collapses to a small button. Hidden when building is off. */
export function BuildHud() {
  const director = useDirector()
  const { mode, active, progress, speed } = useBuildState()
  const building = active !== null
  const recent = useLinger(building, HUD_IDLE_HIDE_MS)
  const [opened, setOpened] = useState(false)
  const openCommandBar = useOpenCommandBar()
  const commentMode = useCommentMode()
  if (mode !== 'on') return null

  const expanded = recent || opened
  // Announce only start and finish, not every percent.
  const announcement = building
    ? copy.hud.announceStart
    : progress === 1
      ? copy.hud.announceDone
      : ''

  return (
    <aside
      aria-label={copy.hud.label}
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 font-mono text-sm"
    >
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {expanded ? (
        <div className="flex items-center gap-3 rounded-pill border border-border bg-surface py-1 pr-1 pl-4 shadow-hud">
          {building && (
            <div className="flex items-center gap-2" aria-hidden="true">
              <span className="size-2 rounded-pill bg-accent" />
              <span className="whitespace-nowrap">
                {copy.hud.building} {Math.round(progress * PERCENT)}%
              </span>
              <span className="hidden h-1 w-16 overflow-hidden rounded-pill bg-border sm:block">
                <span
                  className="block h-full origin-left bg-accent transition-transform duration-(--duration-base) ease-standard"
                  style={{ transform: `scaleX(${progress})` }}
                />
              </span>
            </div>
          )}
          <div role="group" aria-label={copy.hud.speed} className="flex">
            {SPEEDS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={option === speed}
                onClick={() => director.setSpeed(option)}
                className={`${hudButton} text-text-secondary aria-pressed:text-blue-light`}
              >
                {option}×
              </button>
            ))}
          </div>
          {building ? (
            <button type="button" onClick={director.skip} className={`${hudButton} bg-border`}>
              {copy.hud.skip}
            </button>
          ) : (
            <>
              <BuildsCount className="hidden whitespace-nowrap text-text-secondary sm:inline" />
              <button
                type="button"
                onClick={() => director.replay()}
                className={`${hudButton} bg-border`}
              >
                {copy.hud.replay}
              </button>
              {openCommandBar && (
                <button
                  type="button"
                  aria-label={copy.hud.commands}
                  aria-haspopup="dialog"
                  onClick={openCommandBar}
                  className={hudButton}
                >
                  /
                </button>
              )}
              {commentMode && (
                <button
                  type="button"
                  aria-label={copy.hud.comments}
                  aria-pressed={commentMode.active}
                  onClick={commentMode.toggle}
                  className={`${hudButton} aria-pressed:text-blue-light`}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-current">
                    <path d={COMMENT_PIN_PATH} />
                  </svg>
                </button>
              )}
              <button
                type="button"
                aria-label={copy.hud.close}
                onClick={() => setOpened(false)}
                className={hudButton}
              >
                ×
              </button>
            </>
          )}
        </div>
      ) : (
        <button
          type="button"
          aria-label={copy.hud.open}
          onClick={() => setOpened(true)}
          className="grid size-10 place-items-center rounded-pill border border-border bg-surface text-blue shadow-hud"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-current">
            <path d={CURSOR_ARROW_PATH} />
          </svg>
        </button>
      )}
    </aside>
  )
}
