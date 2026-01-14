import { useState, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence, Easing } from "framer-motion";
import loadingGif from "@/assets/loading-transition.gif";

interface PageTransitionProps {
  children: ReactNode;
}

// Easing personnalisé
const customEase: Easing = [0.25, 0.46, 0.45, 0.94];

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setIsLoading(true);
      // Délai court pour montrer le GIF pendant le chargement
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <>
      {/* Overlay de transition avec GIF */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2, ease: customEase }}
              className="flex flex-col items-center gap-4"
            >
              {/* Container du GIF */}
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full scale-125" />
                <img 
                  src={loadingGif} 
                  alt="Chargement..." 
                  className="relative h-20 w-20 object-contain"
                />
              </div>
              
              {/* Texte de chargement */}
              <p className="text-sm font-medium text-muted-foreground">
                Chargement...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Contenu avec animation rapide */}
      <motion.div
        key={displayLocation.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: customEase }}
        className="h-full"
      >
        {children}
      </motion.div>
    </>
  );
}
