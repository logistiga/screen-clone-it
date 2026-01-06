import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrevisionsPage() {
  return (
    <MainLayout title="Prévisions">
      <Card><CardHeader><CardTitle>Prévisions de trésorerie</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Module en cours de développement</p></CardContent></Card>
    </MainLayout>
  );
}
