import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";

interface DocumentErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const DocumentErrorState = forwardRef<HTMLDivElement, DocumentErrorStateProps>(
  function DocumentErrorState({ 
    message = "Erreur lors du chargement des données",
    onRetry 
  }, ref) {
    return (
      <motion.div 
        ref={ref}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="p-4 rounded-full bg-destructive/10 mb-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <p className="text-destructive mb-4 font-medium">{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Réessayer
          </Button>
        )}
      </motion.div>
    );
  }
);
