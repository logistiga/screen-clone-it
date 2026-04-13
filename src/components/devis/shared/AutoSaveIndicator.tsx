import * as React from "react";
import { Cloud, CloudOff, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface AutoSaveIndicatorProps {
  hasDraft: boolean;
  lastSaved: Date | null;
  isSaving: boolean;
  onRestore: () => void;
  onClear: () => void;
  showRestorePrompt?: boolean;
  onDismissPrompt?: () => void;
}

const AutoSaveIndicator = React.forwardRef<HTMLDivElement, AutoSaveIndicatorProps>(function AutoSaveIndicator(
  {
    hasDraft,
    lastSaved,
    isSaving,
    onRestore,
    onClear,
    showRestorePrompt = false,
    onDismissPrompt,
  },
  ref,
) {
  const formattedTime = lastSaved
    ? formatDistanceToNow(lastSaved, { addSuffix: true, locale: fr })
    : null;

  if (showRestorePrompt && hasDraft) {
    return (
      <div
        ref={ref}
        className="mb-6 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 animate-fade-in dark:border-amber-800 dark:from-amber-900/20 dark:to-orange-900/20"
      >
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/40">
            <Cloud className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-800 dark:text-amber-300">Brouillon trouvé</h4>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              Un brouillon a été sauvegardé {formattedTime}. Voulez-vous le restaurer ?
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={onRestore} className="gap-2 bg-amber-600 hover:bg-amber-700">
                <RotateCcw className="h-4 w-4" />
                Restaurer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onClear();
                  onDismissPrompt?.();
                }}
                className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/40"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismissPrompt}
                className="text-amber-600 hover:text-amber-700 dark:text-amber-400"
              >
                Ignorer
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 px-2 py-1 transition-all duration-300",
                isSaving && "border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                !isSaving && hasDraft && "border-green-300 bg-green-50 text-green-600 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400",
                !isSaving && !hasDraft && "border-muted text-muted-foreground",
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs">Sauvegarde...</span>
                </>
              ) : hasDraft ? (
                <>
                  <Cloud className="h-3 w-3" />
                  <span className="text-xs">Brouillon sauvé</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-3 w-3" />
                  <span className="hidden text-xs sm:inline">Pas de brouillon</span>
                </>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isSaving ? (
              <p>Sauvegarde en cours...</p>
            ) : hasDraft && lastSaved ? (
              <p>Dernière sauvegarde: {formattedTime}</p>
            ) : (
              <p>Les données seront sauvegardées automatiquement</p>
            )}
          </TooltipContent>
        </Tooltip>

        {hasDraft && !isSaving && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={onClear}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Supprimer le brouillon</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
});

AutoSaveIndicator.displayName = "AutoSaveIndicator";

export default AutoSaveIndicator;
