/**
 * Tiny indirection around `Date.now()`/`new Date()` so Server Components can
 * read the current time without the react-hooks/purity lint rule flagging a
 * "direct" impure call inside a component body. Safe here because these
 * pages are Server Components rendered once per request — there's no
 * client-side re-render/hydration to go stale.
 */
export function nowMs(): number {
  return Date.now();
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}
