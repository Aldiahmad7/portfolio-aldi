import { z } from 'zod/mini'

// C0/C1 control characters except tab and newline, which a message may contain. Matching control
// characters is the whole point here.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g

/** Trimmed text without control characters, between `min` and `max` characters long. */
export function cleanText(min: number, max: number) {
  return z.string().check(
    z.overwrite((value) => value.replace(CONTROL_CHARACTERS, '')),
    z.trim(),
    z.minLength(min),
    z.maxLength(max),
  )
}
