import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PWAUpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [swRegistration, setSwRegistration] = useState<globalThis.ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Écouter les mises à jour du service worker
      const handleControllerChange = () => {
        setShowUpdatePrompt(true);
      };

      navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

      // Vérifier s'il y a un SW en attente
      navigator.serviceWorker.ready.then((reg) => {
        setSwRegistration(reg);
        
        if (reg.waiting) {
          setShowUpdatePrompt(true);
        }

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setShowUpdatePrompt(true);
              }
            });
          }
        });

        // Vérifier les mises à jour toutes les heures
        setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000);
      });

      return () => {
        navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      };
    }
  }, []);

  const handleUpdate = () => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
      >
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Mise à jour disponible</CardTitle>
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
            <CardDescription>
              Une nouvelle version de Logistiga est disponible. Mettez à jour pour profiter des dernières fonctionnalités.
            </CardDescription>

            <div className="flex gap-2">
              <Button onClick={handleUpdate} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Mettre à jour
              </Button>
              <Button variant="outline" onClick={handleDismiss}>
                Plus tard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
