import { MainLayout } from "@/components/layout/MainLayout";
import { ClipboardList } from "lucide-react";

export default function NouvelOrdrePage() {
  return (
    <MainLayout title="Nouvel ordre de travail">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">En construction</h2>
        <p className="text-muted-foreground">Le formulaire sera disponible prochainement.</p>
      </div>
    </MainLayout>
  );
}
