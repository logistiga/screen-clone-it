import { forwardRef } from "react";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { WifiOff, Wifi, CloudOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export const OfflineIndicator = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  function OfflineIndicator(_props, ref) {
  const { isOnline, isChecking } = useNetworkStatus();

  if (isOnline && !isChecking) {
    return <div ref={ref} style={{ display: 'none' }} />;
  }

  return (
    <div ref={ref}>
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      >
        <Badge
          variant="secondary"
          className={`flex items-center gap-2 px-4 py-2 ${
            isOnline ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
          }`}
        >
          {isChecking ? (
            <>
              <Wifi className="h-4 w-4 animate-pulse" />
              <span>Vérification de la connexion...</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              <span>Mode hors-ligne</span>
              <CloudOff className="h-3 w-3" />
            </>
          )}
        </Badge>
      </motion.div>
    </AnimatePresence>
    </div>
  );
});

OfflineIndicator.displayName = "OfflineIndicator";
