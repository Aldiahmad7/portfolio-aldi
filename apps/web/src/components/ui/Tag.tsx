interface TagProps {
  children: string
}

export function Tag({ children }: TagProps) {
  return (
    <span className="rounded-sm border border-border px-2 py-0.5 font-mono text-xs text-blue-pale">
      {children}
    </span>
  )
}
