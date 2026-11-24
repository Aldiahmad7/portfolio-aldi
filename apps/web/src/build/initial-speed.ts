import { readStorage, writeStorage } from '../lib/storage'
import { DEFAULT_SPEED, RETURNING_SPEED, SPEEDS, STORAGE_KEYS, type Speed } from './config'

/**
 * The speed a visit starts with: a speed the visitor chose always wins; otherwise returning
 * visitors get the faster default (product-spec F13). Marks this visit as seen.
 */
export function initialSpeed(): Speed {
  const value = Number(readStorage('local', STORAGE_KEYS.speed))
  const chosen = SPEEDS.find((speed) => speed === value)
  const returning = readStorage('local', STORAGE_KEYS.visited) !== null
  writeStorage('local', STORAGE_KEYS.visited, 'true')
  return chosen ?? (returning ? RETURNING_SPEED : DEFAULT_SPEED)
}
