const memory: Record<string, string> = {};

function hasLocalStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export const storage = {
  async get(key: string): Promise<string | null> {
    if (hasLocalStorage()) return window.localStorage.getItem(key);
    return memory[key] ?? null;
  },
  async set(key: string, value: string): Promise<void> {
    if (hasLocalStorage()) {
      window.localStorage.setItem(key, value);
      return;
    }
    memory[key] = value;
  },
  async remove(key: string): Promise<void> {
    if (hasLocalStorage()) {
      window.localStorage.removeItem(key);
      return;
    }
    delete memory[key];
  },
};
