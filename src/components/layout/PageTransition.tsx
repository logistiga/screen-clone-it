import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
}

// Transition légère : aucune attente ni écran de chargement entre les pages.
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12 }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
