import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface DocumentEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function DocumentEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: DocumentEmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="p-4 rounded-full bg-primary/10 mb-6"
      >
        <Icon className="h-12 w-12 text-primary" />
      </motion.div>
      <motion.h2 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-semibold mb-2"
      >
        {title}
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground mb-6 max-w-md"
      >
        {description}
      </motion.p>
      <motion.div 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }}
      >
        <Button onClick={onAction} className="gap-2 shadow-md" size="lg">
          <Plus className="h-5 w-5" />
          {actionLabel}
        </Button>
      </motion.div>
    </motion.div>
  );
}
