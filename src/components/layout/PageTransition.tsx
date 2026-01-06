import { useState, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import loadingGif from "@/assets/loading-transition.gif";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [displayLocation, setDisplayLocation] = useState(location);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <>
      {/* Overlay de transition avec GIF */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <img 
                src={loadingGif} 
                alt="Chargement..." 
                className="h-32 w-32 object-contain"
              />
              <p className="text-sm text-muted-foreground animate-pulse">Chargement...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Contenu avec animation */}
      <motion.div
        key={displayLocation.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: isLoading ? 0 : 0.1 }}
      >
        {children}
      </motion.div>
    </>
  );
}
