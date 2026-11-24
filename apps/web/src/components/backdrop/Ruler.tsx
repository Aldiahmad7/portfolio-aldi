const LABEL_COUNT = 40
const LABEL_STEP_PX = 100
const LABEL_INSET_PX = 3
const labels = Array.from({ length: LABEL_COUNT }, (_, index) => index * LABEL_STEP_PX)

interface RulerProps {
  axis: 'x' | 'y'
}

/** Decorative design-tool ruler, fixed to the viewport edge. */
export function Ruler({ axis }: RulerProps) {
  const isX = axis === 'x'
  return (
    <div
      className={
        isX
          ? 'ruler-x absolute inset-x-0 top-0 h-ruler border-b border-border bg-bg'
          : 'ruler-y absolute inset-y-0 left-0 w-ruler border-r border-border bg-bg'
      }
    >
      {labels.map((offset) => (
        <span
          key={offset}
          className={
            isX
              ? 'ruler-label absolute top-1 font-mono leading-none text-text-muted'
              : 'ruler-label absolute left-1 font-mono leading-none text-text-muted [writing-mode:vertical-lr]'
          }
          style={isX ? { left: offset + LABEL_INSET_PX } : { top: offset + LABEL_INSET_PX }}
        >
          {offset}
        </span>
      ))}
    </div>
  )
}
