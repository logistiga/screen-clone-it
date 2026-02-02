import * as React from "react";
import { motion } from "framer-motion";
import loadingGif from "@/assets/loading-transition.gif";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentLoadingStateProps {
  message?: string;
  showTableSkeleton?: boolean;
  rows?: number;
  columns?: number;
}

export const DocumentLoadingState = React.forwardRef<
  HTMLDivElement,
  DocumentLoadingStateProps
>(({ 
  message = "Chargement...",
  showTableSkeleton = true,
  rows = 5,
  columns = 6
}, ref) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header avec GIF animé */}
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <motion.img
            src={loadingGif}
            alt="Chargement"
            className="w-32 h-32 object-contain"
            animate={{ 
              y: [0, -5, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground font-medium"
        >
          {message}
        </motion.p>
      </div>

      {/* Skeleton du tableau */}
      {showTableSkeleton && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg border border-border/50 overflow-hidden bg-card"
        >
          {/* Header skeleton */}
          <div className="bg-muted/50 p-4 border-b border-border/50">
            <div className="flex gap-4">
              {Array.from({ length: columns }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 * i }}
                  style={{ flex: i === 0 ? 0.5 : 1 }}
                >
                  <Skeleton className="h-4 w-full" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Rows skeleton */}
          <div className="divide-y divide-border/50">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <motion.div
                key={rowIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + rowIndex * 0.08, duration: 0.3 }}
                className="p-4"
              >
                <div className="flex gap-4 items-center">
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <motion.div
                      key={colIndex}
                      style={{ flex: colIndex === 0 ? 0.5 : 1 }}
                      animate={{
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: colIndex * 0.1,
                      }}
                    >
                      <Skeleton 
                        className={`h-4 ${
                          colIndex === 0 ? 'w-8' : 
                          colIndex === columns - 1 ? 'w-24' : 
                          'w-full'
                        }`} 
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
});
DocumentLoadingState.displayName = "DocumentLoadingState";
