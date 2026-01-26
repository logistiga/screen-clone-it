import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Save, Anchor, Container, Wrench, PackageOpen, Loader2, Plus, Trash2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useNoteDebut, useUpdateNoteDebut } from "@/hooks/use-notes-debut";
import { useClients, useOrdres } from "@/hooks/use-commercial";

const typeConfig: Record<string, { label: string; icon: typeof Anchor }> = {
  ouverture_port: { label: "Ouverture de port", icon: Anchor },
  "Ouverture Port": { label: "Ouverture de port", icon: Anchor },
  detention: { label: "Détention", icon: Container },
  Detention: { label: "Détention", icon: Container },
  reparation: { label: "Réparation conteneur", icon: Wrench },
  Reparation: { label: "Réparation conteneur", icon: Wrench },
  relache: { label: "Relâche", icon: PackageOpen },
  Relache: { label: "Relâche", icon: PackageOpen },
};

const normalizeType = (type: string): string => {
  const mapping: Record<string, string> = {
    'ouverture_port': 'Ouverture Port',
    'detention': 'Detention',
    'reparation': 'Reparation',
    'relache': 'Relache',
  };
  return mapping[type] || type;
};

interface LigneNote {
  id?: string;
  ordreTravail: string;
  containerNumber: string;
  blNumber: string;
  dateDebut: string;
  dateFin: string;
  tarifJournalier: number;
}

export default function ModifierNoteDebut() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: note, isLoading, error } = useNoteDebut(id);
  const { data: clientsResponse } = useClients({ per_page: 1000 });
  const clients = clientsResponse?.data || [];
  const updateMutation = useUpdateNoteDebut();

  const [clientId, setClientId] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [navire, setNavire] = useState("");
  const [lignes, setLignes] = useState<LigneNote[]>([]);

  // Fetch ordres for selected client
  const { data: ordresResponse, isLoading: isLoadingOrdres } = useOrdres(
    clientId ? { client_id: clientId, per_page: 1000 } : { per_page: 1000 }
  );
  
  const ordresForClient = useMemo(() => {
    if (!ordresResponse?.data) return [];
    if (!clientId) return ordresResponse.data;
    return ordresResponse.data.filter((o: any) => String(o.client_id) === String(clientId));
  }, [ordresResponse?.data, clientId]);

  const getOrdreById = (ordreId: string) => {
    if (!ordreId || !ordresResponse?.data) return null;
    return ordresResponse.data.find((o: any) => String(o.id) === String(ordreId));
  };

  // Populate form when note data is loaded
  useEffect(() => {
    if (note) {
      setClientId(String(note.client_id || ""));
      setType(note.type || "");
      setDescription(note.description || note.notes || "");
      setNavire(note.navire || "");

      // Si la note a des lignes, les charger
      if (note.lignes && note.lignes.length > 0) {
        setLignes(note.lignes.map((l: any) => ({
          id: String(l.id),
          ordreTravail: l.ordre_id ? String(l.ordre_id) : "",
          containerNumber: l.conteneur_numero || "",
          blNumber: l.bl_numero || "",
          dateDebut: l.date_debut || "",
          dateFin: l.date_fin || "",
          tarifJournalier: l.tarif_journalier || 0,
        })));
      } else {
        // Note simple sans lignes - créer une ligne à partir des données de la note
        setLignes([{
          id: undefined,
          ordreTravail: note.ordre_id ? String(note.ordre_id) : "",
          containerNumber: note.conteneur_numero || "",
          blNumber: note.bl_numero || "",
          dateDebut: note.date_debut || note.date_debut_stockage || "",
          dateFin: note.date_fin || note.date_fin_stockage || "",
          tarifJournalier: note.tarif_journalier || 0,
        }]);
      }
    }
  }, [note]);

  const ajouterLigne = () => {
    setLignes([
      ...lignes,
      {
        ordreTravail: "",
        containerNumber: "",
        blNumber: "",
        dateDebut: "",
        dateFin: "",
        tarifJournalier: 0,
      },
    ]);
  };

  const supprimerLigne = (index: number) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((_, i) => i !== index));
    }
  };

  const updateLigne = (index: number, field: keyof LigneNote, value: string | number) => {
    setLignes(lignes.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const handleOrdreChange = (index: number, ordreId: string) => {
    const ordre = getOrdreById(ordreId);
    const blNumero = ordre?.bl_numero || ordre?.numero_bl || "";
    
    // Get containers if any
    const conteneurs = ordre?.conteneurs || [];
    const lots = ordre?.lots || [];
    
    if (conteneurs.length === 1) {
      setLignes(lignes.map((l, i) => 
        i === index 
          ? { ...l, ordreTravail: ordreId, containerNumber: conteneurs[0].numero || "", blNumber: blNumero }
          : l
      ));
    } else if (lots.length === 1) {
      setLignes(lignes.map((l, i) => 
        i === index 
          ? { ...l, ordreTravail: ordreId, containerNumber: lots[0].numero || "", blNumber: blNumero }
          : l
      ));
    } else {
      setLignes(lignes.map((l, i) => 
        i === index 
          ? { ...l, ordreTravail: ordreId, blNumber: blNumero }
          : l
      ));
    }
  };

  const calculerJours = (dateDebut: string, dateFin: string) => {
    if (!dateDebut || !dateFin) return 0;
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const diff = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const calculerMontantLigne = (ligne: LigneNote) => {
    const jours = calculerJours(ligne.dateDebut, ligne.dateFin);
    return jours * ligne.tarifJournalier;
  };

  const montantTotal = lignes.reduce((acc, l) => acc + calculerMontantLigne(l), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-GA", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    const lignesValides = lignes.filter(
      (l) => l.dateDebut && l.dateFin && l.tarifJournalier > 0
    );

    if (lignesValides.length === 0) {
      toast.error("Veuillez remplir au moins une ligne valide (dates et tarif)");
      return;
    }

    try {
      const lignesPayload = lignesValides.map(ligne => ({
        id: ligne.id ? String(ligne.id) : undefined,
        ordre_id: ligne.ordreTravail || undefined,
        conteneur_numero: ligne.containerNumber || undefined,
        bl_numero: ligne.blNumber || undefined,
        date_debut: ligne.dateDebut,
        date_fin: ligne.dateFin,
        tarif_journalier: ligne.tarifJournalier,
      }));

      await updateMutation.mutateAsync({
        id,
        data: {
          client_id: clientId,
          type: normalizeType(type),
          description: description || undefined,
          navire: navire || undefined,
          lignes: lignesPayload,
        },
      });

      navigate(`/notes-debut/${id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !note) {
    return (
      <MainLayout title="Erreur">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive">Note non trouvée</p>
          <Button onClick={() => navigate("/notes-debut")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux notes
          </Button>
        </div>
      </MainLayout>
    );
  }

  const typeInfo = typeConfig[type] || typeConfig[note.type] || { label: "Note", icon: Anchor };

  return (
    <MainLayout title={`Modifier ${note.numero}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/notes-debut/${id}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Modifier {note.numero}</h1>
              <p className="text-muted-foreground">
                Modifiez les informations de la note de début
              </p>
            </div>
          </div>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>

        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={String(client.id)}>
                        {client.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type de note</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeConfig)
                      .filter(([key]) => !key.includes(' '))
                      .map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Navire</Label>
                <Input
                  value={navire}
                  onChange={(e) => setNavire(e.target.value)}
                  placeholder="Nom du navire"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description..."
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lignes de note */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lignes de note</CardTitle>
            <Button type="button" onClick={ajouterLigne} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une ligne
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {lignes.map((ligne, index) => (
              <div
                key={ligne.id || index}
                className="border rounded-lg p-4 space-y-4 bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Ligne {index + 1}</span>
                  {lignes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => supprimerLigne(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Ordre de travail</Label>
                    <Select
                      value={ligne.ordreTravail}
                      onValueChange={(v) => handleOrdreChange(index, v)}
                      disabled={!clientId || isLoadingOrdres}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !clientId 
                            ? "Sélectionnez d'abord un client" 
                            : isLoadingOrdres 
                              ? "Chargement..." 
                              : "Sélectionner un OT"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {ordresForClient.length === 0 ? (
                          <SelectItem value="none" disabled>
                            Aucun ordre de travail
                          </SelectItem>
                        ) : (
                          ordresForClient.map((ot: any) => (
                            <SelectItem key={ot.id} value={String(ot.id)}>
                              {ot.numero} {ot.categorie && `(${ot.categorie})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>N° Conteneur / Lot</Label>
                    <Input
                      placeholder="MSKU1234567 ou LOT-001"
                      value={ligne.containerNumber}
                      onChange={(e) =>
                        updateLigne(index, "containerNumber", e.target.value.toUpperCase())
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>N° BL</Label>
                    <Input
                      placeholder="BL-2024-001"
                      value={ligne.blNumber}
                      onChange={(e) => updateLigne(index, "blNumber", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Date début *</Label>
                    <Input
                      type="date"
                      value={ligne.dateDebut}
                      onChange={(e) => updateLigne(index, "dateDebut", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date fin *</Label>
                    <Input
                      type="date"
                      value={ligne.dateFin}
                      onChange={(e) => updateLigne(index, "dateFin", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tarif journalier (FCFA) *</Label>
                    <Input
                      type="number"
                      placeholder="25000"
                      value={ligne.tarifJournalier || ""}
                      onChange={(e) =>
                        updateLigne(index, "tarifJournalier", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Montant</Label>
                    <div className="h-10 px-3 py-2 bg-muted rounded-md flex items-center font-semibold">
                      {formatCurrency(calculerMontantLigne(ligne))} FCFA
                      <span className="text-xs text-muted-foreground ml-2">
                        ({calculerJours(ligne.dateDebut, ligne.dateFin)} jours)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Montant total HT</p>
                <p className="text-2xl font-bold">{formatCurrency(montantTotal)} FCFA</p>
                <p className="text-xs text-muted-foreground mt-1">
                  (Aucune taxe appliquée sur les notes de début)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </MainLayout>
  );
}