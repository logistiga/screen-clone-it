import { useParams } from "react-router-dom";
import { useArmateurById } from "@/hooks/use-commercial";
import { PartenaireDetailContent } from "@/components/partenaires";

export default function ArmateurDetailPage() {
  const { id } = useParams();
  const { data: armateur, isLoading, error, refetch } = useArmateurById(id);

  return (
    <PartenaireDetailContent
      type="armateur"
      partenaire={armateur}
      isLoading={isLoading}
      error={error}
      refetch={refetch}
    />
  );
}
