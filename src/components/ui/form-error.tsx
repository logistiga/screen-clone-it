import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FormErrorProps {
  message?: string;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex items-center gap-1.5 text-sm text-destructive mt-1.5",
            className
          )}
        >
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface FormFieldWrapperProps {
  children: React.ReactNode;
  error?: string;
  className?: string;
}

export function FormFieldWrapper({ children, error, className }: FormFieldWrapperProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {children}
      <FormError message={error} />
    </div>
  );
}
