import { ReactNode } from "react";
import { motion, Variants, Easing } from "framer-motion";

interface PageTransitionProps {
  children: ReactNode;
}

// Easing personnalisé
const customEase: Easing = [0.25, 0.46, 0.45, 0.94];

// Variants pour la transition de page rapide
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: customEase,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.1,
      ease: customEase,
    },
  },
};

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="h-full"
    >
      {children}
    </motion.div>
  );
}
