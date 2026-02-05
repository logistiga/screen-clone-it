import { useState, useEffect, useCallback, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, X, Smartphone, Monitor, Check, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const STORAGE_KEYS = {
  FIRST_LOGIN_DONE: "pwa-first-login-done",
  INSTALL_DISMISSED: "pwa-install-dismissed",
  INSTALL_SHOWN_AFTER_LOGIN: "pwa-install-shown-after-login",
};

export const PWAInstallPrompt = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  function PWAInstallPrompt(_props, ref) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Vérifier si c'est la première connexion
  const checkFirstLogin = useCallback(() => {
    const firstLoginDone = localStorage.getItem(STORAGE_KEYS.FIRST_LOGIN_DONE);
    const installShownAfterLogin = localStorage.getItem(STORAGE_KEYS.INSTALL_SHOWN_AFTER_LOGIN);
    
    // Si première connexion et prompt pas encore montré
    if (!firstLoginDone && !installShownAfterLogin) {
      return true;
    }
    return false;
  }, []);

  // Marquer la première connexion comme faite
  const markFirstLoginDone = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.FIRST_LOGIN_DONE, "true");
  }, []);

  useEffect(() => {
    // Vérifier si déjà installé (mode standalone)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Vérifier si l'utilisateur a déjà refusé récemment
    const dismissedAt = localStorage.getItem(STORAGE_KEYS.INSTALL_DISMISSED);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < oneWeek) {
        setDismissed(true);
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Vérifier si c'est après la première connexion
      const isFirstLogin = checkFirstLogin();
      const installShownAfterLogin = localStorage.getItem(STORAGE_KEYS.INSTALL_SHOWN_AFTER_LOGIN);
      
      if (isFirstLogin && !installShownAfterLogin) {
        // Attendre un peu avant de montrer le dialog (laisse le temps à l'UI de charger)
        setTimeout(() => {
          setShowInstallDialog(true);
          localStorage.setItem(STORAGE_KEYS.INSTALL_SHOWN_AFTER_LOGIN, "true");
          markFirstLoginDone();
        }, 2000);
      } else {
        // Montrer la bannière normale
        setShowInstallBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setShowInstallDialog(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [checkFirstLogin, markFirstLoginDone]);

  // Écouter les événements de connexion réussie
  useEffect(() => {
    const handleLoginSuccess = () => {
      const installShownAfterLogin = localStorage.getItem(STORAGE_KEYS.INSTALL_SHOWN_AFTER_LOGIN);
      
      if (!installShownAfterLogin && deferredPrompt && !isInstalled) {
        setTimeout(() => {
          setShowInstallDialog(true);
          localStorage.setItem(STORAGE_KEYS.INSTALL_SHOWN_AFTER_LOGIN, "true");
          markFirstLoginDone();
        }, 1500);
      }
    };

    window.addEventListener("pwa-login-success", handleLoginSuccess);
    return () => {
      window.removeEventListener("pwa-login-success", handleLoginSuccess);
    };
  }, [deferredPrompt, isInstalled, markFirstLoginDone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
      }

      setDeferredPrompt(null);
      setShowInstallBanner(false);
      setShowInstallDialog(false);
    } catch (error) {
      console.error("Erreur lors de l'installation PWA:", error);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEYS.INSTALL_DISMISSED, Date.now().toString());
    setShowInstallBanner(false);
    setShowInstallDialog(false);
    setDismissed(true);
  };

  const handleDialogClose = () => {
    setShowInstallDialog(false);
    // Montrer la bannière après fermeture du dialog
    setShowInstallBanner(true);
  };

  if (isInstalled || dismissed) {
    return <div ref={ref} style={{ display: 'none' }} />;
  }

  return (
    <div ref={ref}>
      {/* Dialog modal pour première connexion */}
      <Dialog open={showInstallDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Download className="h-6 w-6 text-primary" />
              </div>
              Bienvenue sur Logistiga !
            </DialogTitle>
            <DialogDescription className="pt-2">
              Installez l'application sur votre appareil pour une meilleure expérience.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Monitor className="h-5 w-5 text-primary" />
                <span className="text-xs text-center">Desktop</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Smartphone className="h-5 w-5 text-primary" />
                <span className="text-xs text-center">Mobile</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Wifi className="h-5 w-5 text-primary" />
                <span className="text-xs text-center">Hors-ligne</span>
              </div>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                Accès rapide depuis votre bureau
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                Fonctionne même sans connexion internet
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                Synchronisation automatique des données
              </li>
            </ul>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleInstallClick} className="flex-1" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Installer maintenant
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground"
              onClick={handleDialogClose}
            >
              Peut-être plus tard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bannière discrète */}
      <AnimatePresence>
        {showInstallBanner && !showInstallDialog && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
          >
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Download className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Installer Logistiga</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleDismiss}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-sm">
                  Installez l'application pour un accès rapide et une utilisation hors-ligne.
                </CardDescription>

                <div className="flex gap-2">
                  <Button onClick={handleInstallClick} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Installer
                  </Button>
                  <Button variant="outline" onClick={handleDismiss}>
                    Plus tard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

PWAInstallPrompt.displayName = "PWAInstallPrompt";

// Fonction utilitaire pour déclencher le prompt après connexion
export function triggerPWAInstallAfterLogin() {
  window.dispatchEvent(new CustomEvent("pwa-login-success"));
}
