import React, { useEffect, useState } from 'react';
import { 
  Clock, 
  RefreshCw, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  CloudOff,
  Cloud,
  User,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useNetwork } from '@/contexts/NetworkContext';
import { 
  getAllOperations, 
  removeFromQueue, 
  retryOperation,
  retryAllFailed,
  getQueueStats,
  SyncQueueItem 
} from '@/lib/offline/syncQueue';
import { forceSyncNow } from '@/lib/offline/syncService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-yellow-500', icon: Clock },
  syncing: { label: 'Synchronisation...', color: 'bg-blue-500', icon: Loader2 },
  failed: { label: 'Échoué', color: 'bg-red-500', icon: AlertCircle },
  success: { label: 'Réussi', color: 'bg-green-500', icon: CheckCircle },
};

const ACTION_LABELS = {
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
};

const ENTITY_LABELS = {
  clients: 'Client',
  devis: 'Devis',
  ordres: 'Ordre de travail',
  factures: 'Facture',
  paiements: 'Paiement',
  notes: 'Note d\'honoraires',
};

export default function SyncQueue() {
  const { isOnline, syncStats, refreshSyncStats } = useNetwork();
  const [operations, setOperations] = useState<SyncQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadOperations = async () => {
    try {
      const ops = await getAllOperations();
      setOperations(ops);
    } catch (error) {
      console.error('Erreur chargement opérations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOperations();
    
    // Rafraîchir toutes les 5 secondes
    const interval = setInterval(loadOperations, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const result = await forceSyncNow();
      if (result.success) {
        toast.success(`${result.processed} élément(s) synchronisé(s) avec succès`);
      } else {
        toast.warning(`${result.processed} réussi(s), ${result.failed} échoué(s)`);
      }
      await loadOperations();
      await refreshSyncStats();
    } catch (error) {
      toast.error('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const handleRetryOne = async (id: string) => {
    try {
      await retryOperation(id);
      toast.success('Opération remise en queue');
      await loadOperations();
    } catch (error) {
      toast.error('Erreur lors du réessai');
    }
  };

  const handleRemoveOne = async (id: string) => {
    try {
      await removeFromQueue(id);
      toast.success('Opération supprimée');
      await loadOperations();
      await refreshSyncStats();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleRetryAllFailed = async () => {
    try {
      await retryAllFailed();
      toast.success('Toutes les opérations échouées remises en queue');
      await loadOperations();
    } catch (error) {
      toast.error('Erreur lors du réessai');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Queue de synchronisation</h1>
          <p className="text-muted-foreground">
            Gérez les opérations en attente de synchronisation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
              <Cloud className="h-3 w-3 mr-1" />
              En ligne
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
              <CloudOff className="h-3 w-3 mr-1" />
              Hors-ligne
            </Badge>
          )}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{syncStats.pending}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{syncStats.syncing}</p>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{syncStats.failed}</p>
                <p className="text-sm text-muted-foreground">Échoué(s)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{syncStats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleSyncAll} 
          disabled={!isOnline || syncing || syncStats.pending === 0}
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Synchroniser maintenant
        </Button>
        {syncStats.failed > 0 && (
          <Button variant="outline" onClick={handleRetryAllFailed}>
            Réessayer les échoués
          </Button>
        )}
      </div>

      {/* Liste des opérations */}
      <Card>
        <CardHeader>
          <CardTitle>Opérations en queue</CardTitle>
          <CardDescription>
            Triées par ordre chronologique de saisie
          </CardDescription>
        </CardHeader>
        <CardContent>
          {operations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Aucune opération en attente</p>
              <p className="text-sm">Toutes les données sont synchronisées</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {operations.map((op) => {
                  const StatusIcon = STATUS_CONFIG[op.status]?.icon || Clock;
                  const isSpinning = op.status === 'syncing';

                  return (
                    <div
                      key={op.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            STATUS_CONFIG[op.status]?.color || 'bg-gray-500'
                          }/10`}
                        >
                          <StatusIcon
                            className={`h-5 w-5 ${
                              STATUS_CONFIG[op.status]?.color?.replace('bg-', 'text-') || 'text-gray-500'
                            } ${isSpinning ? 'animate-spin' : ''}`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {ACTION_LABELS[op.action]} - {ENTITY_LABELS[op.entity]}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {STATUS_CONFIG[op.status]?.label || op.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(op.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {op.userId}
                            </span>
                            {op.attempts > 0 && (
                              <span className="text-orange-500">
                                {op.attempts} tentative(s)
                              </span>
                            )}
                          </div>
                          {op.lastError && (
                            <p className="text-sm text-red-500 mt-1">
                              Erreur: {op.lastError}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {op.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetryOne(op.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cette opération ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Les modifications associées ne seront
                                pas envoyées au serveur.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveOne(op.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
