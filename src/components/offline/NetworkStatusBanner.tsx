import React from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { Wifi, WifiOff, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { forceSyncNow } from '@/lib/offline/syncService';
import { toast } from 'sonner';

interface NetworkStatusBannerProps {
  className?: string;
  showSyncButton?: boolean;
}

export function NetworkStatusBanner({ className, showSyncButton = true }: NetworkStatusBannerProps) {
  const { isOnline, isSyncing, syncStats } = useNetwork();
  const [isForceSyncing, setIsForceSyncing] = React.useState(false);

  // Ne rien afficher si tout va bien
  if (isOnline && syncStats.pending === 0 && syncStats.failed === 0) {
    return null;
  }

  const handleForceSync = async () => {
    setIsForceSyncing(true);
    try {
      const result = await forceSyncNow();
      if (result.success) {
        toast.success(`${result.processed} élément(s) synchronisé(s)`);
      } else {
        toast.error(`${result.failed} erreur(s) lors de la synchronisation`);
      }
    } catch (error) {
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setIsForceSyncing(false);
    }
  };

  // Hors-ligne
  if (!isOnline) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 px-4 py-2 bg-destructive text-destructive-foreground',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">
            Mode hors-ligne
            {syncStats.pending > 0 && (
              <span className="ml-1 text-xs opacity-80">
                ({syncStats.pending} modification{syncStats.pending > 1 ? 's' : ''} en attente)
              </span>
            )}
          </span>
        </div>
        <span className="text-xs opacity-75">
          Les données sont sauvegardées localement
        </span>
      </div>
    );
  }

  // En cours de synchronisation
  if (isSyncing || isForceSyncing) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 px-4 py-2 bg-yellow-500 text-yellow-950',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">
            Synchronisation en cours...
            {syncStats.pending > 0 && (
              <span className="ml-1 text-xs opacity-80">
                ({syncStats.pending} élément{syncStats.pending > 1 ? 's' : ''})
              </span>
            )}
          </span>
        </div>
      </div>
    );
  }

  // Éléments en attente de synchronisation
  if (syncStats.pending > 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 px-4 py-2 bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">
            {syncStats.pending} modification{syncStats.pending > 1 ? 's' : ''} en attente de synchronisation
          </span>
        </div>
        {showSyncButton && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleForceSync}
            className="h-7 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Synchroniser
          </Button>
        )}
      </div>
    );
  }

  // Erreurs de synchronisation
  if (syncStats.failed > 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 px-4 py-2 bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            {syncStats.failed} erreur{syncStats.failed > 1 ? 's' : ''} de synchronisation
          </span>
        </div>
        {showSyncButton && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleForceSync}
            className="h-7 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Réessayer
          </Button>
        )}
      </div>
    );
  }

  return null;
}
