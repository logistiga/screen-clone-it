import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import { PageTransition } from "@/components/layout/PageTransition";
import { useClients, useOrdres } from "@/hooks/use-commercial";
import { useCreateNoteDebut } from "@/hooks/use-notes-debut";

interface NoteDebutFormProps {
  noteType: "ouverture_port" | "detention" | "reparation";
  title: string;
  subtitle: string;
}

interface LigneNote {
  id: string;
  ordreTravail: string;
  containerNumber: string;
  blNumber: string;
  dateDebut: string;
  dateFin: string;
  tarifJournalier: number;
}

export function NoteDebutForm({ noteType, title, subtitle }: NoteDebutFormProps) {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [lignes, setLignes] = useState<LigneNote[]>([
    {
      id: "1",
      ordreTravail: "",
      containerNumber: "",
      blNumber: "",
      dateDebut: "",
      dateFin: "",
      tarifJournalier: 0,
    },
  ]);

  // Fetch clients from backend
  const { data: clientsResponse, isLoading: isLoadingClients } = useClients({ per_page: 1000 });
  const clients = clientsResponse?.data || [];

  // Fetch ordres for selected client
  const { data: ordresResponse, isLoading: isLoadingOrdres } = useOrdres(
    clientId ? { client_id: clientId, per_page: 1000 } : { per_page: 1000 }
  );
  
  // Filter ordres by selected client
  const ordresForClient = useMemo(() => {
    if (!ordresResponse?.data) return [];
    if (!clientId) return ordresResponse.data;
    return ordresResponse.data.filter((o: any) => String(o.client_id) === String(clientId));
  }, [ordresResponse?.data, clientId]);

  // Get ordre details by id
  const getOrdreById = (ordreId: string) => {
    if (!ordreId || !ordresResponse?.data) return null;
    return ordresResponse.data.find((o: any) => String(o.id) === String(ordreId));
  };

  // Get the category/type of selected ordre for a line
  const getOrdreCategorie = (ordreId: string): string | null => {
    const ordre = getOrdreById(ordreId);
    return ordre?.categorie || null;
  };

  // Check if the ordre is conventionnel (uses lot instead of container)
  const isConventionnel = (ordreId: string): boolean => {
    const categorie = getOrdreCategorie(ordreId);
    return categorie === 'conventionnel';
  };

  // Get containers or lots from an ordre
  const getConteneursFromOrdre = (ordreId: string): { numero: string; blNumero?: string }[] => {
    const ordre = getOrdreById(ordreId);
    if (!ordre) return [];
    
    // For conteneurs category
    if (ordre.conteneurs && ordre.conteneurs.length > 0) {
      return ordre.conteneurs.map((c: any) => ({
        numero: c.numero || c.numero_conteneur || '',
        blNumero: c.bl_numero || ordre.bl_numero || ordre.numero_bl || ''
      }));
    }
    
    // For conventionnel category (lots)
    if (ordre.lots && ordre.lots.length > 0) {
      return ordre.lots.map((lot: any) => ({
        numero: lot.numero || lot.numero_lot || '',
        blNumero: lot.bl_numero || ordre.bl_numero || ordre.numero_bl || ''
      }));
    }
    
    return [];
  };

  // Reset lignes ordre de travail when client changes
  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    // Reset ordre de travail in all lines when client changes - use functional update to avoid stale closure
    setLignes(prev => prev.map(l => ({ ...l, ordreTravail: "", containerNumber: "", blNumber: "" })));
  };

  // Handle ordre selection - auto-fill containers/lots
  const handleOrdreChange = (ligneId: string, ordreId: string) => {
    const conteneurs = getConteneursFromOrdre(ordreId);
    const ordre = getOrdreById(ordreId);
    
    if (conteneurs.length === 0) {
      // No containers/lots, just update the ordre field
      updateLigne(ligneId, "ordreTravail", ordreId);
      // Still try to get BL from ordre
      if (ordre?.bl_numero || ordre?.numero_bl) {
        setLignes(prev => prev.map(l => 
          l.id === ligneId 
            ? { ...l, ordreTravail: ordreId, blNumber: ordre.bl_numero || ordre.numero_bl || '' }
            : l
        ));
      }
      return;
    }
    
    if (conteneurs.length === 1) {
      // Single container - just fill current line
      setLignes(prev => prev.map(l => 
        l.id === ligneId 
          ? { 
              ...l, 
              ordreTravail: ordreId, 
              containerNumber: conteneurs[0].numero,
              blNumber: conteneurs[0].blNumero || ''
            }
          : l
      ));
    } else {
      // Multiple containers - replace current line and add new lines for each container
      setLignes(prev => {
        const currentIndex = prev.findIndex(l => l.id === ligneId);
        const currentLine = prev[currentIndex];
        
        // Create new lines for each container
        const newLines: LigneNote[] = conteneurs.map((c, idx) => ({
          id: idx === 0 ? ligneId : String(Date.now() + idx),
          ordreTravail: ordreId,
          containerNumber: c.numero,
          blNumber: c.blNumero || '',
          dateDebut: currentLine.dateDebut,
          dateFin: currentLine.dateFin,
          tarifJournalier: currentLine.tarifJournalier,
        }));
        
        // Replace current line with new lines
        return [
          ...prev.slice(0, currentIndex),
          ...newLines,
          ...prev.slice(currentIndex + 1)
        ];
      });
      
      toast({
        title: "Conteneurs pré-remplis",
        description: `${conteneurs.length} ${isConventionnel(ordreId) ? 'lots' : 'conteneurs'} ont été ajoutés depuis l'ordre de travail.`,
      });
    }
  };

  const ajouterLigne = () => {
    setLignes([
      ...lignes,
      {
        id: String(Date.now()),
        ordreTravail: "",
        containerNumber: "",
        blNumber: "",
        dateDebut: "",
        dateFin: "",
        tarifJournalier: 0,
      },
    ]);
  };

  const supprimerLigne = (id: string) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((l) => l.id !== id));
    }
  };

  const updateLigne = (id: string, field: keyof LigneNote, value: string | number) => {
    setLignes(
      lignes.map((l) =>
        l.id === id ? { ...l, [field]: value } : l
      )
    );
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

  const createNote = useCreateNoteDebut();

  const handleSubmit = async () => {
    if (!clientId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un client",
        variant: "destructive",
      });
      return;
    }

    // Validation: only dates and tarif are required (N° Conteneur/Lot and N° BL are optional)
    const lignesValides = lignes.filter(
      (l) => l.dateDebut && l.dateFin && l.tarifJournalier > 0
    );

    if (lignesValides.length === 0) {
      // Find what's missing to give a specific error
      const firstLigne = lignes[0];
      const missing: string[] = [];
      if (!firstLigne.dateDebut) missing.push("Date début");
      if (!firstLigne.dateFin) missing.push("Date fin");
      if (!firstLigne.tarifJournalier || firstLigne.tarifJournalier <= 0) missing.push("Tarif journalier");

      toast({
        title: "Erreur",
        description: missing.length > 0 
          ? `Champs manquants: ${missing.join(", ")}` 
          : "Veuillez remplir au moins une ligne valide",
        variant: "destructive",
      });
      return;
    }

    // Map frontend type to backend format
    const typeMapping: Record<string, string> = {
      'ouverture_port': 'Ouverture Port',
      'detention': 'Detention',
      'reparation': 'Reparation',
    };
    const backendType = typeMapping[noteType] || noteType;

    // Créer UNE SEULE note avec TOUTES les lignes (création groupée)
    try {
      const lignesPayload = lignesValides.map(ligne => ({
        ordre_id: ligne.ordreTravail || undefined,
        conteneur_numero: ligne.containerNumber || undefined,
        bl_numero: ligne.blNumber || undefined,
        date_debut: ligne.dateDebut,
        date_fin: ligne.dateFin,
        tarif_journalier: ligne.tarifJournalier,
      }));

      await createNote.mutateAsync({
        type: backendType,
        client_id: clientId,
        description: description || undefined,
        lignes: lignesPayload,
      });
      
      toast({
        title: "Succès",
        description: `Note créée avec ${lignesValides.length} ligne(s)`,
      });
      
      navigate("/notes-debut");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/notes-debut/nouvelle")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          </div>
        </div>

        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={clientId} onValueChange={handleClientChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingClients ? "Chargement..." : "Sélectionner un client"} />
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
                <Label>Description</Label>
                <Textarea
                  placeholder="Description de la note..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lignes de note */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lignes de note</CardTitle>
            <Button onClick={ajouterLigne} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une ligne
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {lignes.map((ligne, index) => (
              <div
                key={ligne.id}
                className="border rounded-lg p-4 space-y-4 bg-muted/30"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Ligne {index + 1}</span>
                  {lignes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => supprimerLigne(ligne.id)}
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
                      onValueChange={(v) => handleOrdreChange(ligne.id, v)}
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
                            Aucun ordre de travail pour ce client
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
                    <Label>
                      {isConventionnel(ligne.ordreTravail) ? "N° Lot" : "N° Conteneur / Lot"}
                    </Label>
                    <Input
                      placeholder={isConventionnel(ligne.ordreTravail) ? "LOT-001" : "MSKU1234567 ou LOT-001"}
                      value={ligne.containerNumber}
                      onChange={(e) =>
                        updateLigne(ligne.id, "containerNumber", e.target.value.toUpperCase())
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>N° BL</Label>
                    <Input
                      placeholder="BL-2024-001"
                      value={ligne.blNumber}
                      onChange={(e) => updateLigne(ligne.id, "blNumber", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Date début *</Label>
                    <Input
                      type="date"
                      value={ligne.dateDebut}
                      onChange={(e) => updateLigne(ligne.id, "dateDebut", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date fin *</Label>
                    <Input
                      type="date"
                      value={ligne.dateFin}
                      onChange={(e) => updateLigne(ligne.id, "dateFin", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tarif journalier (FCFA) *</Label>
                    <Input
                      type="number"
                      placeholder="25000"
                      value={ligne.tarifJournalier || ""}
                      onChange={(e) =>
                        updateLigne(ligne.id, "tarifJournalier", Number(e.target.value))
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
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="text-2xl font-bold">{formatCurrency(montantTotal)} FCFA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate("/notes-debut")} disabled={createNote.isPending}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={createNote.isPending}>
            {createNote.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {createNote.isPending ? "Enregistrement..." : "Enregistrer la note"}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
