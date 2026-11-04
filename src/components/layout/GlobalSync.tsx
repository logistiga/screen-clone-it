import { useAutoSync } from "@/hooks/use-auto-sync";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { installTreasuryRefresh } from "@/services/api/treasury-cache";

/** Monté une seule fois à la racine : évite de relancer sync/Echo à chaque page. */
export function GlobalSync() {
  const queryClient = useQueryClient();
  useEffect(() => installTreasuryRefresh(api, queryClient), [queryClient]);
  useAutoSync();
  useRealtimeNotifications();
  return null;
}
