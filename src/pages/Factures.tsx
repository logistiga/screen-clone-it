import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Plus, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FacturesPage() {
  const navigate = useNavigate();

  return (
    <MainLayout title="Factures">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Module en reconstruction</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Le module des factures est en cours de reconstruction avec une nouvelle architecture.
        </p>
        <Button onClick={() => navigate("/factures/nouvelle")} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle facture
        </Button>
      </div>
    </MainLayout>
  );
}
