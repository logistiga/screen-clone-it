import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Anchor, Container, Wrench, PackageOpen } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const typeConfig = {
  ouverture_port: {
    label: "Ouverture de port",
    icon: Anchor,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    route: "/notes-debut/ouverture-port",
  },
  detention: {
    label: "Détention",
    icon: Container,
    color: "bg-amber-100 text-amber-700 border-amber-200",
    route: "/notes-debut/detention",
  },
  reparation: {
    label: "Réparation conteneur",
    icon: Wrench,
    color: "bg-green-100 text-green-700 border-green-200",
    route: "/notes-debut/reparation",
  },
  relache: {
    label: "Relâche",
    icon: PackageOpen,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    route: "/notes-debut/relache",
  },
};

export default function NouvelleNoteDebut() {
  const navigate = useNavigate();

  return (
    <MainLayout title="Nouvelle note de début">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/notes-debut")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Nouvelle note de début
            </h1>
            <p className="text-muted-foreground mt-1">
              Sélectionnez le type de note à créer
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sélectionnez le type de note</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(typeConfig).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(config.route)}
                    className={`p-8 rounded-xl border-2 border-dashed transition-all hover:border-primary hover:bg-primary/5 ${config.color}`}
                  >
                    <Icon className="h-12 w-12 mx-auto mb-4" />
                    <p className="font-semibold text-lg">{config.label}</p>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
