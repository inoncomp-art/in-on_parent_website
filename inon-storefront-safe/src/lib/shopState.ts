const BAG_KEY = "inon.bag";
const WISHLIST_KEY = "inon.wishlist";

function read(key: string): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function write(key: string, value: string[]): void {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("inon-shop-state"));
}

export function readBag(): string[] { return read(BAG_KEY); }
export function readWishlist(): string[] { return read(WISHLIST_KEY); }
export function addToBag(slug: string): string[] { const next = [...readBag(), slug]; write(BAG_KEY, next); return next; }
export function removeBagItemAt(index: number): string[] { const next = readBag().filter((_, itemIndex) => itemIndex !== index); write(BAG_KEY, next); return next; }
export function toggleWishlist(slug: string): string[] { const current = readWishlist(); const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]; write(WISHLIST_KEY, next); return next; }
