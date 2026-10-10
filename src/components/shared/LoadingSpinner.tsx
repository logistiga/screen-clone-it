import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Indicateur de chargement léger (remplace les anciennes animations GIF). */
export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 aria-label="Chargement" className={cn("h-10 w-10 animate-spin text-primary", className)} />;
}
