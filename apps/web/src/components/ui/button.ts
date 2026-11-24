export type ButtonVariant = 'primary' | 'ghost'

const BASE =
  'inline-flex h-10 items-center justify-center gap-2 rounded-pill px-5 font-mono text-sm font-medium'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-bg hover:bg-blue-light',
  ghost: 'border border-border text-text hover:border-blue-light',
}

/** Shared by <a> and <button> so links that look like buttons stay consistent. */
export const buttonClass = (variant: ButtonVariant) => `${BASE} ${VARIANTS[variant]}`
