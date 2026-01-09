import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DevisPage() {
  const navigate = useNavigate();

  return (
    <MainLayout title="Devis">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Module Devis</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Le module des devis est en cours de construction avec une architecture unifiée.
        </p>
        <Button onClick={() => navigate("/devis/nouveau")} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau devis
        </Button>
      </div>
    </MainLayout>
  );
}
