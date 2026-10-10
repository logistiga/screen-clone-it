/**
 * Précharge en arrière-plan uniquement les pages les plus utilisées,
 * quand le navigateur est libre et que la connexion le permet.
 */
const pages = import.meta.glob([
  "../pages/Dashboard.tsx",
  "../pages/Clients.tsx",
  "../pages/Devis.tsx",
  "../pages/OrdresTravail.tsx",
  "../pages/Factures.tsx",
  "../pages/Caisse.tsx",
]);
let started = false;

type IdleWindow = Window & { requestIdleCallback?: (cb: () => void) => number };
type NetNavigator = Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };

export function preloadAllPages(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  const conn = (navigator as NetNavigator).connection;
  if (conn?.saveData || /2g/.test(conn?.effectiveType ?? "")) return;
  const loaders = Object.values(pages);
  const idle = (cb: () => void) => {
    const w = window as IdleWindow;
    if (w.requestIdleCallback) w.requestIdleCallback(cb);
    else setTimeout(cb, 500);
  };
  const next = () => {
    const load = loaders.shift();
    if (!load) return;
    load().catch(() => undefined).finally(() => idle(next));
  };
  setTimeout(() => idle(next), 4000);
}
