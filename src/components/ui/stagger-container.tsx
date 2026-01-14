import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface StaggerContainerProps extends HTMLMotionProps<"div"> {
  staggerDelay?: number;
  initialDelay?: number;
}

// Container qui anime ses enfants en cascade
const StaggerContainer = React.forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ className, staggerDelay = 0.1, initialDelay = 0, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: initialDelay,
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
);
StaggerContainer.displayName = "StaggerContainer";

// Item enfant pour le StaggerContainer
interface StaggerItemProps extends HTMLMotionProps<"div"> {
  direction?: "up" | "down" | "left" | "right";
}

const StaggerItem = React.forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ className, direction = "up", children, ...props }, ref) => {
    const directionVariants = {
      up: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } },
      down: { hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } },
      left: { hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } },
      right: { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } },
    };

    return (
      <motion.div
        ref={ref}
        variants={directionVariants[direction]}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
StaggerItem.displayName = "StaggerItem";

// Grille animée pour les cartes statistiques
interface AnimatedGridProps extends HTMLMotionProps<"div"> {
  columns?: number;
  gap?: string;
}

const AnimatedGrid = React.forwardRef<HTMLDivElement, AnimatedGridProps>(
  ({ className, columns = 4, gap = "gap-4", children, ...props }, ref) => (
    <StaggerContainer
      ref={ref}
      staggerDelay={0.08}
      className={cn(
        `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} ${gap}`,
        className
      )}
      {...props}
    >
      {children}
    </StaggerContainer>
  )
);
AnimatedGrid.displayName = "AnimatedGrid";

export { StaggerContainer, StaggerItem, AnimatedGrid };
