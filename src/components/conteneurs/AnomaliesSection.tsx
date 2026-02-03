import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  PlusCircle,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

import { anomaliesApi, ConteneurAnomalie, AnomaliesStats } from "@/lib/api/conteneurs-traites";

export function AnomaliesSection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedAnomalies, setSelectedAnomalies] = useState<number[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'ajouter' | 'ignorer';
    anomalie?: ConteneurAnomalie;
  }>({ open: false, action: 'ajouter' });

  // Récupérer les anomalies non traitées
  const { data: anomaliesData, isLoading, refetch } = useQuery({
    queryKey: ['conteneurs-anomalies', 'non_traite'],
    queryFn: () => anomaliesApi.getAll({ statut: 'non_traite', per_page: 50 }),
  });

  // Récupérer les stats
  const { data: stats } = useQuery<AnomaliesStats>({
    queryKey: ['conteneurs-anomalies-stats'],
    queryFn: () => anomaliesApi.getStats(),
  });

  // Mutations
  const detecterMutation = useMutation({
    mutationFn: () => anomaliesApi.detecter(),
    onSuccess: (data) => {
      toast.success(data.message || 'Détection terminée');
      queryClient.invalidateQueries({ queryKey: ['conteneurs-anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-anomalies-stats'] });
    },
    onError: () => {
      toast.error("Erreur lors de la détection");
    },
  });

  const ajouterMutation = useMutation({
    mutationFn: (anomalieId: number) => anomaliesApi.ajouterAOrdre(anomalieId),
    onSuccess: (data) => {
      toast.success(data.message || 'Conteneur ajouté');
      queryClient.invalidateQueries({ queryKey: ['conteneurs-anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-anomalies-stats'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites'] });
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout");
    },
  });

  const ignorerMutation = useMutation({
    mutationFn: (anomalieId: number) => anomaliesApi.ignorer(anomalieId),
    onSuccess: () => {
      toast.success('Anomalie ignorée');
      queryClient.invalidateQueries({ queryKey: ['conteneurs-anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-anomalies-stats'] });
    },
    onError: () => {
      toast.error("Erreur lors de l'opération");
    },
  });

  const traiterMasseMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: number[]; action: 'ajouter' | 'ignorer' }) =>
      anomaliesApi.traiterEnMasse(ids, action),
    onSuccess: (data) => {
      toast.success(data.message || 'Anomalies traitées');
      setSelectedAnomalies([]);
      queryClient.invalidateQueries({ queryKey: ['conteneurs-anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-anomalies-stats'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites'] });
    },
    onError: () => {
      toast.error("Erreur lors du traitement");
    },
  });

  const anomalies: ConteneurAnomalie[] = anomaliesData?.data || [];
  const nombreAnomalies = stats?.non_traitees || 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAnomalies(anomalies.map((a) => a.id));
    } else {
      setSelectedAnomalies([]);
    }
  };

  const handleSelectAnomalie = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedAnomalies((prev) => [...prev, id]);
    } else {
      setSelectedAnomalies((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleConfirmAction = () => {
    if (confirmDialog.anomalie) {
      if (confirmDialog.action === 'ajouter') {
        ajouterMutation.mutate(confirmDialog.anomalie.id);
      } else {
        ignorerMutation.mutate(confirmDialog.anomalie.id);
      }
    }
    setConfirmDialog({ open: false, action: 'ajouter' });
  };

  const handleMasseAction = (action: 'ajouter' | 'ignorer') => {
    if (selectedAnomalies.length > 0) {
      traiterMasseMutation.mutate({ ids: selectedAnomalies, action });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd MMM yyyy HH:mm", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  if (nombreAnomalies === 0 && !isLoading) {
    return null; // Ne pas afficher la section s'il n'y a pas d'anomalies
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="p-0 hover:bg-transparent">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="h-5 w-5" />
                  Anomalies détectées
                  <Badge variant="destructive" className="ml-2">
                    {nombreAnomalies}
                  </Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-2" />
                  )}
                </CardTitle>
              </Button>
            </CollapsibleTrigger>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => detecterMutation.mutate()}
                disabled={detecterMutation.isPending}
              >
                <Search className={`h-4 w-4 mr-1 ${detecterMutation.isPending ? 'animate-spin' : ''}`} />
                Détecter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-orange-600 mt-1">
            Conteneurs présents dans OPS mais absents des ordres de travail correspondants
          </p>
        </CardHeader>

        <CollapsibleContent>
          <CardContent>
            {/* Actions en masse */}
            {selectedAnomalies.length > 0 && (
              <div className="mb-4 p-3 bg-white rounded-lg border flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedAnomalies.length} anomalie(s) sélectionnée(s)
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleMasseAction('ajouter')}
                    disabled={traiterMasseMutation.isPending}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Ajouter tous aux OT
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMasseAction('ignorer')}
                    disabled={traiterMasseMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Ignorer tous
                  </Button>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-orange-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedAnomalies.length === anomalies.length && anomalies.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Conteneur manquant</TableHead>
                      <TableHead>N° BL</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Ordre existant</TableHead>
                      <TableHead>Détecté le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {anomalies.map((anomalie) => (
                      <TableRow key={anomalie.id} className="bg-white">
                        <TableCell>
                          <Checkbox
                            checked={selectedAnomalies.includes(anomalie.id)}
                            onCheckedChange={(checked) => 
                              handleSelectAnomalie(anomalie.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-medium text-orange-700">
                            {anomalie.numero_conteneur}
                          </span>
                        </TableCell>
                        <TableCell>{anomalie.numero_bl || "-"}</TableCell>
                        <TableCell>{anomalie.client_nom || "-"}</TableCell>
                        <TableCell>
                          {anomalie.ordre_travail ? (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto"
                              onClick={() => navigate(`/ordres/${anomalie.ordre_travail?.id}`)}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              {anomalie.ordre_travail.numero}
                            </Button>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(anomalie.detected_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => 
                                setConfirmDialog({ open: true, action: 'ajouter', anomalie })
                              }
                              disabled={ajouterMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Ajouter à l'OT
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => 
                                setConfirmDialog({ open: true, action: 'ignorer', anomalie })
                              }
                              disabled={ignorerMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {anomalies.length > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                💡 Ces conteneurs sont présents dans OPS pour le même client et numéro de BL, 
                mais n'ont pas été ajoutés à l'ordre de travail correspondant.
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* Dialog de confirmation */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog((prev) => ({ ...prev, open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'ajouter' 
                ? "Ajouter le conteneur à l'ordre ?"
                : "Ignorer cette anomalie ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'ajouter' ? (
                <>
                  Le conteneur <strong>{confirmDialog.anomalie?.numero_conteneur}</strong> sera 
                  ajouté à l'ordre de travail <strong>{confirmDialog.anomalie?.ordre_travail?.numero}</strong>.
                </>
              ) : (
                <>
                  L'anomalie pour le conteneur <strong>{confirmDialog.anomalie?.numero_conteneur}</strong> 
                  sera marquée comme ignorée (erreur de saisie ou cas particulier).
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              {confirmDialog.action === 'ajouter' ? 'Ajouter' : 'Ignorer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
