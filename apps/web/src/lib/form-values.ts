/** Text fields of a form as a plain object, ready for a shared schema. */
export function formValues(form: HTMLFormElement): Record<string, string> {
  const values: Record<string, string> = {}
  new FormData(form).forEach((value, key) => {
    if (typeof value === 'string') values[key] = value
  })
  return values
}

/** Top-level field names of failed schema checks, e.g. `email`. */
export function invalidFields(issues: readonly { path: readonly PropertyKey[] }[]) {
  return new Set(issues.map((issue) => String(issue.path[0])))
}
