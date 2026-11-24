import type { ActionDefinition, ActionName } from '../types'
import { dragAction } from './drag'
import { drawRectAction } from './draw-rect'
import { fillAction } from './fill'
import { nudgeAction } from './nudge'
import { selectAction } from './select'
import { typeAction } from './type'
import { visitAction } from './visit'

export const actions: Readonly<Record<ActionName, ActionDefinition>> = {
  type: typeAction,
  drawRect: drawRectAction,
  select: selectAction,
  drag: dragAction,
  fill: fillAction,
  nudge: nudgeAction,
  visit: visitAction,
}
