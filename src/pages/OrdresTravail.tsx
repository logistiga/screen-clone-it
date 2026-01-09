import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function OrdresTravailPage() {
  const navigate = useNavigate();

  return (
    <MainLayout title="Ordres de Travail">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Module en reconstruction</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Le module des ordres de travail est en cours de reconstruction avec une nouvelle architecture.
        </p>
        <Button onClick={() => navigate("/ordres/nouveau")} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel ordre
        </Button>
      </div>
    </MainLayout>
  );
}
