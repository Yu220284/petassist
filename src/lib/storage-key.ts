/** Read a localStorage value, migrating from legacy `pockassist.*` keys. */
export function readStorage(key: string, legacyKeys: string[] = []): string | null {
  if (typeof window === "undefined") return null;
  try {
    const current = window.localStorage.getItem(key);
    if (current != null) return current;
    for (const legacy of legacyKeys) {
      const old = window.localStorage.getItem(legacy);
      if (old == null) continue;
      window.localStorage.setItem(key, old);
      return old;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
