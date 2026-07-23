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

createRoot(document.getElementById("root")!).render(<App />);
