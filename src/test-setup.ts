// Setup global pour Vitest — simule le navigateur
Object.defineProperty(window, 'localStorage', {
  value: (() => {
    let store: Record<string, string> = {};
    return {
      getItem:    (k: string) => store[k] ?? null,
      setItem:    (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear:      () => { store = {}; },
    };
  })(),
  writable: true,
});
