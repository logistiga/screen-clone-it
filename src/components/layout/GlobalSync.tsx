import { useAutoSync } from "@/hooks/use-auto-sync";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

/** Monté une seule fois à la racine : évite de relancer sync/Echo à chaque page. */
export function GlobalSync() {
  useAutoSync();
  useRealtimeNotifications();
  return null;
}
