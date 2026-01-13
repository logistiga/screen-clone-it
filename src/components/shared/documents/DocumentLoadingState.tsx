import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface DocumentLoadingStateProps {
  message?: string;
}

export function DocumentLoadingState({ message = "Chargement..." }: DocumentLoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-10 w-10 text-primary" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-muted-foreground"
      >
        {message}
      </motion.p>
    </div>
  );
}
