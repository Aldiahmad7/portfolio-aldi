type StorageArea = 'local' | 'session'

/** Web Storage can throw (private mode, blocked cookies); every read and write tolerates that. */
function area(name: StorageArea): Storage | null {
  try {
    return name === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function readStorage(name: StorageArea, key: string): string | null {
  try {
    return area(name)?.getItem(key) ?? null
  } catch {
    return null
  }
}

export function writeStorage(name: StorageArea, key: string, value: string) {
  try {
    area(name)?.setItem(key, value)
  } catch {
    // Not persisting a preference is acceptable; the page keeps working.
  }
}
