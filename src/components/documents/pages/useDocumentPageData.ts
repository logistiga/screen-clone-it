import { useMemo } from "react";
import {
  useArmateurs,
  useClients,
  useRepresentants,
  useTransitaires,
} from "@/hooks/use-commercial";

const toArray = (v: any): any[] =>
  Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : [];

/**
 * Fetch les listes de référence partagées entre Devis / Ordre / Facture.
 * Renvoie aussi un loading agrégé et la première erreur rencontrée.
 */
export function useDocumentPageData(opts: { clientsPerPage?: number } = {}) {
  const perPage = opts.clientsPerPage ?? 500;

  const clientsQ = useClients({ per_page: perPage });
  const armateursQ = useArmateurs();
  const transitairesQ = useTransitaires();
  const representantsQ = useRepresentants({ per_page: perPage });

  const clients = clientsQ.data?.data ?? [];
  const armateurs = toArray(armateursQ.data);
  const transitaires = toArray(transitairesQ.data);
  const representants = toArray(representantsQ.data);

  const isLoading =
    clientsQ.isLoading ||
    armateursQ.isLoading ||
    transitairesQ.isLoading ||
    representantsQ.isLoading;

  const error =
    clientsQ.error ||
    armateursQ.error ||
    transitairesQ.error ||
    representantsQ.error ||
    null;

  return useMemo(
    () => ({ clients, armateurs, transitaires, representants, isLoading, error }),
    [clients, armateurs, transitaires, representants, isLoading, error],
  );
}
