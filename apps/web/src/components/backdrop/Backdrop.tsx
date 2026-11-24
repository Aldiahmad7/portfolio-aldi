import './backdrop.css'
import { Ruler } from './Ruler'

/** Fixed, motionless background layer. Only section content ever moves. */
export function Backdrop() {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="backdrop-dots absolute inset-0" />
        <div className="backdrop-noise absolute inset-0" />
      </div>
      {/*
       * Rulers frame the canvas like in a design tool, so content scrolls under them, never over.
       * z-30 matches the navbar: below the crew layer (z-40), whose cursors may cross the edges.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-30 hidden overflow-hidden md:block"
      >
        <Ruler axis="x" />
        <Ruler axis="y" />
        <div className="absolute top-0 left-0 size-ruler border-r border-b border-border bg-bg" />
      </div>
    </>
  )
}
