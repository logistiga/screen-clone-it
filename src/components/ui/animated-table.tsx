import * as React from "react";
import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

// Animated Table Row
interface AnimatedTableRowProps extends HTMLMotionProps<"tr"> {
  index?: number;
}

const AnimatedTableRow = React.forwardRef<HTMLTableRowElement, AnimatedTableRowProps>(
  ({ className, index = 0, children, ...props }, ref) => (
    <motion.tr
      ref={ref}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: "easeOut"
      }}
      whileHover={{ 
        backgroundColor: "hsl(var(--muted) / 0.5)",
        transition: { duration: 0.15 }
      }}
      className={cn(
        "border-b transition-colors data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </motion.tr>
  )
);
AnimatedTableRow.displayName = "AnimatedTableRow";

// Animated Table Body wrapper
interface AnimatedTableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

const AnimatedTableBody = React.forwardRef<HTMLTableSectionElement, AnimatedTableBodyProps>(
  ({ className, children, ...props }, ref) => (
    <tbody ref={ref} className={cn(className)} {...props}>
      <AnimatePresence mode="popLayout">
        {children}
      </AnimatePresence>
    </tbody>
  )
);
AnimatedTableBody.displayName = "AnimatedTableBody";

// Animated List Item (for non-table lists)
interface AnimatedListItemProps extends HTMLMotionProps<"div"> {
  index?: number;
}

const AnimatedListItem = React.forwardRef<HTMLDivElement, AnimatedListItemProps>(
  ({ className, index = 0, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: "easeOut"
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
);
AnimatedListItem.displayName = "AnimatedListItem";

export { AnimatedTableRow, AnimatedTableBody, AnimatedListItem };
