import type { CrewId, DialogKey } from './types'

export interface CrewMember {
  id: CrewId
  name: string
  /** CSS value referencing a token, never a raw color. */
  color: string
  /** Label text color chosen per character for ≥ 4.5:1 contrast (docs/design-system.md §1). */
  labelText: 'dark' | 'light'
  /** Multiplies the character's cursor travel time (Intern is slow). */
  speedFactor: number
}

export const crew: Record<CrewId, CrewMember> = {
  pixel: {
    id: 'pixel',
    name: 'Pixel',
    color: 'var(--color-blue)',
    labelText: 'dark',
    speedFactor: 1,
  },
  kern: {
    id: 'kern',
    name: 'Kern',
    color: 'var(--color-blue-light)',
    labelText: 'dark',
    speedFactor: 1,
  },
  bugsy: {
    id: 'bugsy',
    name: 'Bugsy',
    color: 'var(--color-blue-pale)',
    labelText: 'dark',
    speedFactor: 1,
  },
  intern: {
    id: 'intern',
    name: 'Intern',
    color: 'var(--color-blue-dark)',
    labelText: 'light',
    speedFactor: 1.6,
  },
  red: { id: 'red', name: 'Red', color: 'var(--color-red)', labelText: 'dark', speedFactor: 1 },
}

export const crewIds = Object.keys(crew) as CrewId[]

/**
 * Crew lines in casual Indonesian (docs/crew.md §3: short, never mocking the visitor). A character
 * without lines for a key stays quiet; the validator warns when a script asks for such a line.
 */
export const dialog: Record<DialogKey, Partial<Record<CrewId, readonly string[]>>> = {
  greet: {
    pixel: ['halo, jangan sentuh layoutku ya'],
    kern: ['hai! font-nya bagus kan?'],
  },
  typo: { kern: ['eh typo', 'ups, kerning-nya…'] },
  oops: { bugsy: ['WAIT', 'bukan di situ 😅', 'aku bisa jelasin'] },
  fixed: { bugsy: ['aman, aman', 'anggap aja nggak lihat'] },
  nudge: { pixel: ['1px lagi…', 'nah, sekarang sempurna'] },
  red: { red: ['gimana kalau… merah?', 'trust me'] },
  notRed: { pixel: ['biru lagi.'], kern: ['brand guideline, Red.'] },
  late: { intern: ['udah selesai ya?', 'aku ngapain ya', 'maaf telat, kopi'] },
  hello: {
    pixel: ['oh hai, You'],
    kern: ['mau bantu?'],
    bugsy: ['klik-klik aja, santai'],
    intern: ['oh hai, You'],
    red: ['mau bantu?'],
  },
  thrown: {
    pixel: ['HEI!', 'ok itu kasar'],
    kern: ['aku lagi kerja!', 'HEI!'],
    bugsy: ['wheee', 'lagi!'],
    intern: ['wheee'],
    red: ['ok itu kasar'],
  },
  restore: { pixel: ['siapa yang geser ini?', 'kembalikan ke grid'] },
  unknownCommand: { bugsy: ['perintah apa itu?'], kern: ['coba ketik help'] },
  envelope: { pixel: ['terkirim!', 'aku antar ya 📨'] },
}
