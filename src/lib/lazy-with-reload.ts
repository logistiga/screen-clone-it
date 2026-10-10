import { lazy as reactLazy, ComponentType } from "react";

const KEY = "chunk-reload-at";

/**
 * React.lazy qui recharge la page une fois si un morceau du site a été
 * remplacé par une nouvelle version (ancien fichier introuvable).
 */
export function lazy<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return reactLazy(() =>
    factory().catch((err: unknown) => {
      const last = Number(sessionStorage.getItem(KEY) || 0);
      if (Date.now() - last > 10_000) {
        sessionStorage.setItem(KEY, String(Date.now()));
        window.location.reload();
        return new Promise<{ default: T }>(() => undefined);
      }
      throw err;
    }),
  );
}
