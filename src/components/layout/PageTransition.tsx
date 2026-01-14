import { useState, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence, Variants, Easing } from "framer-motion";
import loadingGif from "@/assets/loading-transition.gif";

interface PageTransitionProps {
  children: ReactNode;
}

// Easing personnalisé
const customEase: Easing = [0.25, 0.46, 0.45, 0.94];

// Variants pour la transition de page style moderne
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: customEase,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: {
      duration: 0.25,
      ease: customEase,
    },
  },
};

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
      }, 600);
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: "radial-gradient(circle at center, hsl(var(--background)) 0%, hsl(var(--background) / 0.95) 100%)",
              backdropFilter: "blur(8px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.9, opacity: 0, rotate: 10 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as Easing }}
              className="flex flex-col items-center gap-6"
            >
              {/* Container du GIF avec effet glow */}
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full scale-150" />
                <motion.img 
                  src={loadingGif} 
                  alt="Chargement..." 
                  className="relative h-28 w-28 object-contain"
                  animate={{ 
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
              
              {/* Texte avec effet shimmer */}
              <motion.p
                animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-sm font-medium"
                style={{
                  background: "linear-gradient(90deg, hsl(var(--muted-foreground)) 0%, hsl(var(--primary)) 50%, hsl(var(--muted-foreground)) 100%)",
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Chargement...
              </motion.p>

              {/* Barre de progression animée */}
              <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Contenu avec animation de page */}
      <AnimatePresence mode="wait">
        <motion.div
          key={displayLocation.pathname}
          variants={pageVariants}
          initial="initial"
          animate="enter"
          exit="exit"
          className="h-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
