import { HistoriqueTimeline } from "@/components/shared/HistoriqueTimeline";

interface OrdreHistoriqueProps {
  ordre: {
    id?: number | string;
    numero?: string;
    created_at?: string;
    date?: string;
  };
}

export function OrdreHistorique({ ordre }: OrdreHistoriqueProps) {
  return (
    <HistoriqueTimeline
      documentId={ordre.id || 0}
      documentNumero={ordre.numero}
      module="ordres_travail"
      createdAt={ordre.created_at || ordre.date}
      title="Historique des actions"
    />
  );
}
