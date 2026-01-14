import React from 'react';
import { CloudOff, Cloud, Loader2 } from 'lucide-react';
import { useEntitySyncStatus } from '@/contexts/NetworkContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SyncStatusBadgeProps {
  entityType: 'clients' | 'devis' | 'ordres' | 'factures' | 'paiements' | 'notes';
  entityId: string;
  className?: string;
  showOnlyWhenUnsynced?: boolean;
}

export function SyncStatusBadge({
  entityType,
  entityId,
  className,
  showOnlyWhenUnsynced = true,
}: SyncStatusBadgeProps) {
  const { isUnsynced, isOnline } = useEntitySyncStatus(entityType, entityId);

  // Ne rien afficher si synchronisé et showOnlyWhenUnsynced est true
  if (!isUnsynced && showOnlyWhenUnsynced) {
    return null;
  }

  // Non synchronisé et hors-ligne
  if (isUnsynced && !isOnline) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'inline-flex items-center justify-center h-5 w-5 rounded-full bg-destructive/10 text-destructive',
                className
              )}
            >
              <CloudOff className="h-3 w-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Hors-ligne - Sera synchronisé à la reconnexion</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Non synchronisé mais en ligne (en attente de sync)
  if (isUnsynced && isOnline) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'inline-flex items-center justify-center h-5 w-5 rounded-full bg-yellow-500/10 text-yellow-600',
                className
              )}
            >
              <Loader2 className="h-3 w-3 animate-spin" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>En attente de synchronisation</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Synchronisé
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500/10 text-green-600',
              className
            )}
          >
            <Cloud className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Synchronisé</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
