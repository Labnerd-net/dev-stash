const RECENTLY_USED_KEY = "recently-used-item-ids";
const MAX_RECENT = 10;

export function pushRecentItem(id: string): void {
  try {
    const current = getRecentItemIds().filter((x) => x !== id);
    current.unshift(id);
    localStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(current.slice(0, MAX_RECENT)));
  } catch {
    // quota exceeded or unavailable — ignore
  }
}

export function getRecentItemIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENTLY_USED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
