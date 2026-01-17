import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Download, Smartphone, Monitor, CheckCircle2, Info, 
  Users, FileText, ClipboardList, Receipt, Wallet, 
  BarChart3, Settings, Shield, HelpCircle, BookOpen,
  ArrowRight, Sparkles
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Guide() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Vérifier si déjà installé
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsInstalled(isStandalone);

    // Capturer l'événement d'installation
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error("Erreur d'installation:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const appVersion = "1.0.0";

  const guidePages = [
    {
      title: "Tableau de bord",
      icon: BarChart3,
      description: "Vue d'ensemble de votre activité",
      features: [
        "Statistiques en temps réel (chiffre d'affaires, factures, clients)",
        "Graphiques de performance mensuelle",
        "Activités récentes et notifications",
        "Accès rapide aux actions principales"
      ]
    },
    {
      title: "Gestion des Clients",
      icon: Users,
      description: "Gérez votre portefeuille clients",
      features: [
        "Liste complète de tous vos clients",
        "Fiche détaillée avec historique des transactions",
        "Ajout et modification des informations clients",
        "Recherche et filtrage avancés"
      ]
    },
    {
      title: "Devis",
      icon: FileText,
      description: "Créez et gérez vos devis",
      features: [
        "Création rapide de devis professionnels",
        "Conversion automatique en facture",
        "Suivi du statut (brouillon, envoyé, accepté, refusé)",
        "Export PDF et envoi par email"
      ]
    },
    {
      title: "Ordres de Travail",
      icon: ClipboardList,
      description: "Suivez vos ordres de travail",
      features: [
        "Création d'ordres à partir des devis",
        "Suivi de l'avancement des travaux",
        "Génération de connaissements",
        "Historique complet des opérations"
      ]
    },
    {
      title: "Facturation",
      icon: Receipt,
      description: "Gérez vos factures",
      features: [
        "Création de factures professionnelles",
        "Gestion des paiements et échéances",
        "Suivi des impayés et relances",
        "Export comptable et rapports"
      ]
    },
    {
      title: "Comptabilité",
      icon: Wallet,
      description: "Suivi financier complet",
      features: [
        "Gestion de la caisse et des encaissements",
        "Suivi des comptes bancaires",
        "Rapprochement bancaire",
        "Vue consolidée de la trésorerie"
      ]
    },
    {
      title: "Paramétrage",
      icon: Settings,
      description: "Configurez l'application",
      features: [
        "Gestion des utilisateurs et rôles",
        "Configuration des taxes et banques",
        "Personnalisation de la numérotation",
        "Paramètres des emails et notifications"
      ]
    }
  ];

  return (
    <MainLayout title="Guide & Installation">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Guide & Installation
          </h1>
          <p className="text-muted-foreground">
            Découvrez toutes les fonctionnalités et installez l'application sur votre appareil
          </p>
        </div>

        {/* Détails de l'application */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  À propos de l'application
                </CardTitle>
                <CardDescription>
                  Informations sur votre application de gestion
                </CardDescription>
              </div>
              <Badge variant="secondary">v{appVersion}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">Logistiga</span> - Gestion commerciale complète
                </div>
                <p className="text-sm text-muted-foreground">
                  Solution tout-en-un pour gérer vos clients, devis, factures, ordres de travail 
                  et comptabilité. Conçue pour les entreprises de logistique et transport.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Fonctionnalités clés :</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Gestion clients et partenaires
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Devis, factures et notes de débit
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Suivi comptable et reporting
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Mode hors-ligne disponible
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Installation */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Installation de l'application
            </CardTitle>
            <CardDescription>
              Installez l'application sur votre appareil pour un accès rapide
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isInstalled ? (
              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Application installée
                  </p>
                  <p className="text-sm text-muted-foreground">
                    L'application est déjà installée sur votre appareil
                  </p>
                </div>
              </div>
            ) : deferredPrompt ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Cliquez sur le bouton ci-dessous pour installer l'application. 
                  Elle sera accessible depuis votre écran d'accueil.
                </p>
                <Button 
                  onClick={handleInstall} 
                  disabled={isInstalling}
                  size="lg"
                  className="gap-2"
                >
                  {isInstalling ? (
                    <>Installation en cours...</>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Installer l'application
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  L'installation automatique n'est pas disponible. Suivez les instructions ci-dessous.
                </p>
              </div>
            )}

            {/* Instructions manuelles */}
            <div className="grid gap-4 md:grid-cols-2 pt-4">
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Sur ordinateur (Chrome)</h4>
                </div>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-primary">1.</span>
                    Cliquez sur l'icône d'installation dans la barre d'adresse
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-primary">2.</span>
                    Ou ouvrez le menu (⋮) → "Installer Logistiga"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-primary">3.</span>
                    Confirmez l'installation
                  </li>
                </ol>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Sur mobile</h4>
                </div>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-primary">1.</span>
                    <strong>iOS Safari :</strong> Appuyez sur Partager → "Sur l'écran d'accueil"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-primary">2.</span>
                    <strong>Android Chrome :</strong> Menu (⋮) → "Installer l'application"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium text-primary">3.</span>
                    L'icône apparaîtra sur votre écran d'accueil
                  </li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guide par page */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Guide d'utilisation
            </CardTitle>
            <CardDescription>
              Explorez les fonctionnalités de chaque section de l'application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {guidePages.map((page, index) => (
                <AccordionItem key={index} value={`page-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <page.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium">{page.title}</span>
                        <p className="text-sm text-muted-foreground font-normal">
                          {page.description}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-12 space-y-2">
                      {page.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Sécurité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Sécurité & Confidentialité
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Connexion sécurisée</h4>
                <p className="text-xs text-muted-foreground">
                  Toutes les communications sont chiffrées (HTTPS/SSL)
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Authentification</h4>
                <p className="text-xs text-muted-foreground">
                  Session sécurisée avec token d'authentification
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm mb-1">Données protégées</h4>
                <p className="text-xs text-muted-foreground">
                  Vos données sont stockées de manière sécurisée
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </MainLayout>
  );
}
