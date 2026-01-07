import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  FileText,
  ClipboardList,
  Receipt,
  Wallet,
  TrendingUp,
  Plus,
  ArrowRight,
  Building2,
  CreditCard,
  FileStack,
  Handshake,
} from "lucide-react";
import { formatMontant } from "@/data/mockData";

export default function DashboardPage() {
  const navigate = useNavigate();

  // Statistiques (vides car données en mémoire)
  const stats = {
    clients: 0,
    devis: 0,
    ordres: 0,
    factures: 0,
    caisse: 0,
    banque: 0,
  };

  const quickActions = [
    { label: "Nouveau client", icon: Users, path: "/clients/nouveau", color: "bg-blue-500" },
    { label: "Nouveau devis", icon: FileText, path: "/devis/nouveau", color: "bg-purple-500" },
    { label: "Nouvel ordre", icon: ClipboardList, path: "/ordres/nouveau", color: "bg-green-500" },
    { label: "Nouvelle facture", icon: Receipt, path: "/factures/nouvelle", color: "bg-orange-500" },
  ];

  const modules = [
    { title: "Clients", description: "Gérez vos clients et leurs informations", icon: Users, path: "/clients", count: stats.clients },
    { title: "Partenaires", description: "Transitaires, armateurs, représentants", icon: Handshake, path: "/partenaires", count: 0 },
    { title: "Devis", description: "Créez et suivez vos propositions", icon: FileText, path: "/devis", count: stats.devis },
    { title: "Ordres de travail", description: "Gérez vos opérations", icon: ClipboardList, path: "/ordres", count: stats.ordres },
    { title: "Factures", description: "Facturation et encaissements", icon: Receipt, path: "/factures", count: stats.factures },
    { title: "Notes de début", description: "Notes et documents opérationnels", icon: FileStack, path: "/notes-debut", count: 0 },
  ];

  const financeModules = [
    { title: "Caisse", description: "Mouvements de caisse", icon: Wallet, path: "/caisse", amount: stats.caisse },
    { title: "Banque", description: "Opérations bancaires", icon: Building2, path: "/banque", amount: stats.banque },
    { title: "Crédits Bancaires", description: "Suivi des emprunts", icon: CreditCard, path: "/credits", amount: 0 },
    { title: "Reporting", description: "Analyses et statistiques", icon: TrendingUp, path: "/reporting", amount: null },
  ];

  return (
    <MainLayout title="Tableau de bord">
      <div className="space-y-8">
        {/* Message de bienvenue */}
        <div className="rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border border-primary/20">
          <h2 className="text-2xl font-bold mb-2">Bienvenue sur Lojistiga</h2>
          <p className="text-muted-foreground">
            Votre solution de gestion logistique et transit. Commencez par créer vos premiers documents.
          </p>
        </div>

        {/* Actions rapides */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary"
                onClick={() => navigate(action.path)}
              >
                <div className={`p-2 rounded-full ${action.color} text-white`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Modules Commercial */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Commercial</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Card
                key={module.title}
                className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
                onClick={() => navigate(module.path)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <module.icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-base">{module.title}</CardTitle>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                  <p className="text-2xl font-bold">{module.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Modules Finance */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Finance & Comptabilité</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {financeModules.map((module) => (
              <Card
                key={module.title}
                className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50"
                onClick={() => navigate(module.path)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <module.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-sm">{module.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-1">{module.description}</p>
                  {module.amount !== null && (
                    <p className="text-lg font-bold">{formatMontant(module.amount)}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Accès paramétrage */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div>
            <h4 className="font-medium">Paramétrage</h4>
            <p className="text-sm text-muted-foreground">
              Configurez les utilisateurs, rôles, taxes et numérotation
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/utilisateurs")}>
            Accéder aux paramètres
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
