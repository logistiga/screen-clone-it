import { useParams } from "react-router-dom";
import { useRepresentantById } from "@/hooks/use-commercial";
import { PartenaireDetailContent } from "@/components/partenaires";

export default function RepresentantDetailPage() {
  const { id } = useParams();
  const { data: representant, isLoading, error, refetch } = useRepresentantById(id);

  return (
    <PartenaireDetailContent
      type="representant"
      partenaire={representant}
      isLoading={isLoading}
      error={error}
      refetch={refetch}
    />
  );
}
