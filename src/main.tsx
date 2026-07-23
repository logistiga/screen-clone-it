import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Nettoyage unique du Service Worker + caches pour forcer le rechargement
// de la nouvelle interface (résout l'affichage de l'ancienne version cachée).
const SW_CLEANUP_KEY = "sw-cleanup-v3";
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  if (!localStorage.getItem(SW_CLEANUP_KEY)) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .then(() => {
        if ("caches" in window) {
          return caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
        }
      })
      .then(() => {
        localStorage.setItem(SW_CLEANUP_KEY, "1");
        window.location.reload();
      })
      .catch(() => {
        localStorage.setItem(SW_CLEANUP_KEY, "1");
      });
  }
}

// Recharge automatiquement quand un chunk JS échoue à se charger
// (ancien index.html référencant des hash supprimés après un nouveau build)
const CHUNK_RELOAD_KEY = "chunk-reload-once";
const isChunkError = (msg?: string) =>
  !!msg && /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(msg);
window.addEventListener("error", (e) => {
  if (isChunkError(e?.message) && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    window.location.reload();
  }
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = (e?.reason && (e.reason.message || String(e.reason))) || "";
  if (isChunkError(msg) && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
