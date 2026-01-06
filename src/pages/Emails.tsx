import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmailsPage() {
  return <MainLayout title="Emails"><Card><CardHeader><CardTitle>Configuration des emails</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Module en cours de développement</p></CardContent></Card></MainLayout>;
}
