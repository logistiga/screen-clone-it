import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreditsPage() {
  return (
    <MainLayout title="Crédits Bancaires">
      <Card><CardHeader><CardTitle>Suivi des crédits</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Module en cours de développement</p></CardContent></Card>
    </MainLayout>
  );
}
