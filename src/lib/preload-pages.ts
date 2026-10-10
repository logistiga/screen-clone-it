/**
 * Précharge en arrière-plan le code de toutes les pages, une par une,
 * quand le navigateur est libre. Les changements de page deviennent instantanés.
 */
const pages = import.meta.glob("../pages/*.tsx");
let started = false;

type IdleWindow = Window & { requestIdleCallback?: (cb: () => void) => number };

export function preloadAllPages(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  const loaders = Object.values(pages);
  const idle = (cb: () => void) => {
    const w = window as IdleWindow;
    if (w.requestIdleCallback) w.requestIdleCallback(cb);
    else setTimeout(cb, 200);
  };
  const next = () => {
    const load = loaders.shift();
    if (!load) return;
    load().catch(() => undefined).finally(() => idle(next));
  };
  setTimeout(() => idle(next), 1500);
}
