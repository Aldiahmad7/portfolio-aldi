/**
 * A small Indonesian + English word list. It only has to stop the obvious cases on a public
 * guestbook; anything subtler is handled by manual moderation (`hidden`).
 */
const BLOCKED_WORDS = [
  'anjing',
  'bangsat',
  'bajingan',
  'kontol',
  'memek',
  'ngentot',
  'jancok',
  'goblok',
  'tolol',
  'asshole',
  'bitch',
  'cunt',
  'fuck',
  'shit',
  'dick',
  'nigger',
  'faggot',
] as const

const LEET: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  $: 's',
}

/** Lowercase, undo basic leetspeak, and drop everything that is not a letter: "Sh1t!" becomes "shit". */
export function normalizeForFilter(word: string): string {
  return [...word.toLowerCase()]
    .map((character) => LEET[character] ?? character)
    .join('')
    .replace(/[^a-z]/g, '')
}

/**
 * Checks word by word (a word starting with a blocked word counts, so "fucking" matches). Joining
 * words first would flag innocent pairs such as "class hit" → "classhit".
 */
export function containsProfanity(...texts: readonly string[]): boolean {
  return texts.some((text) =>
    text
      .split(/\s+/)
      .map(normalizeForFilter)
      .some((word) => BLOCKED_WORDS.some((blocked) => word.startsWith(blocked))),
  )
}
