import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { motion, Easing } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
}

const customEase: Easing = [0.25, 0.46, 0.45, 0.94];

/** Fondu rapide entre les pages, sans attente artificielle. */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: customEase }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
