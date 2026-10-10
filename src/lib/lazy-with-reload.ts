import { lazy as reactLazy } from "react";

const KEY = "chunk-reload-at";

/**
 * React.lazy qui recharge la page une fois si un morceau du site a été
 * remplacé par une nouvelle version (ancien fichier introuvable).
 */
export const lazy: typeof reactLazy = (factory) =>
  reactLazy(() =>
    factory().catch((err: unknown) => {
      const last = Number(sessionStorage.getItem(KEY) || 0);
      if (Date.now() - last > 10_000) {
        sessionStorage.setItem(KEY, String(Date.now()));
        window.location.reload();
        return new Promise<never>(() => undefined);
      }
      throw err;
    }),
  );
