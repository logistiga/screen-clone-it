import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Anchor, Container, Wrench, PackageOpen, Loader2 } from "lucide-react";
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
import { useClients } from "@/hooks/use-commercial";

const typeConfig: Record<string, { label: string; icon: typeof Anchor }> = {
  ouverture_port: {
    label: "Ouverture de port",
    icon: Anchor,
  },
  "Ouverture Port": {
    label: "Ouverture de port",
    icon: Anchor,
  },
  detention: {
    label: "Détention",
    icon: Container,
  },
  Detention: {
    label: "Détention",
    icon: Container,
  },
  reparation: {
    label: "Réparation conteneur",
    icon: Wrench,
  },
  Reparation: {
    label: "Réparation conteneur",
    icon: Wrench,
  },
  relache: {
    label: "Relâche",
    icon: PackageOpen,
  },
  Relache: {
    label: "Relâche",
    icon: PackageOpen,
  },
};

// Normalize type to backend format
const normalizeType = (type: string): string => {
  const mapping: Record<string, string> = {
    'ouverture_port': 'Ouverture Port',
    'detention': 'Detention',
    'reparation': 'Reparation',
    'relache': 'Relache',
  };
  return mapping[type] || type;
};

export default function ModifierNoteDebut() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch note data
  const { data: note, isLoading, error } = useNoteDebut(id);
  
  // Fetch clients
  const { data: clientsResponse } = useClients({ per_page: 1000 });
  const clients = clientsResponse?.data || [];

  const updateMutation = useUpdateNoteDebut();

  const [formData, setFormData] = useState({
    clientId: "",
    type: "",
    blNumber: "",
    containerNumber: "",
    dateDebut: "",
    dateFin: "",
    tarifJournalier: "",
    description: "",
    navire: "",
  });

  // Populate form when note data is loaded
  useEffect(() => {
    if (note) {
      setFormData({
        clientId: note.client_id || "",
        type: note.type || "",
        blNumber: note.bl_numero || "",
        containerNumber: note.conteneur_numero || "",
        dateDebut: note.date_debut || note.date_debut_stockage || "",
        dateFin: note.date_fin || note.date_fin_stockage || "",
        tarifJournalier: String(note.tarif_journalier || ""),
        description: note.description || note.observations || note.notes || "",
        navire: note.navire || "",
      });
    }
  }, [note]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateDays = () => {
    if (formData.dateDebut && formData.dateFin) {
      const start = new Date(formData.dateDebut);
      const end = new Date(formData.dateFin);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  };

  const calculateTotal = () => {
    const days = calculateDays();
    const tarif = parseFloat(formData.tarifJournalier) || 0;
    return days * tarif;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-GA", {
      style: "decimal",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;

    if (!formData.clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    if (!formData.dateDebut || !formData.dateFin) {
      toast.error("Veuillez remplir les dates de début et de fin");
      return;
    }

    const jours = calculateDays();
    const montantHt = calculateTotal();

    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          client_id: formData.clientId,
          type: normalizeType(formData.type),
          bl_numero: formData.blNumber || undefined,
          conteneur_numero: formData.containerNumber || undefined,
          date_debut: formData.dateDebut,
          date_fin: formData.dateFin,
          nombre_jours: jours,
          tarif_journalier: parseFloat(formData.tarifJournalier) || 0,
          montant_ht: montantHt,
          description: formData.description || undefined,
          navire: formData.navire || undefined,
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

  const typeInfo = typeConfig[formData.type] || typeConfig[note.type] || { label: "Note", icon: Anchor };

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informations principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(v) => handleChange("clientId", v)}
                  >
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
                  <Label htmlFor="type">Type de note</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => handleChange("type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeConfig)
                        .filter(([key]) => !key.includes(' ')) // Filter out duplicates
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
                  <Label htmlFor="blNumber">N° BL</Label>
                  <Input
                    id="blNumber"
                    value={formData.blNumber}
                    onChange={(e) => handleChange("blNumber", e.target.value)}
                    placeholder="BL-2024-XXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="containerNumber">N° Conteneur</Label>
                  <Input
                    id="containerNumber"
                    value={formData.containerNumber}
                    onChange={(e) => handleChange("containerNumber", e.target.value.toUpperCase())}
                    placeholder="MSKU1234567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="navire">Navire</Label>
                  <Input
                    id="navire"
                    value={formData.navire}
                    onChange={(e) => handleChange("navire", e.target.value)}
                    placeholder="Nom du navire"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Description de la note..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Période et tarification */}
          <Card>
            <CardHeader>
              <CardTitle>Période et tarification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dateDebut">Date de début *</Label>
                <Input
                  id="dateDebut"
                  type="date"
                  value={formData.dateDebut}
                  onChange={(e) => handleChange("dateDebut", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFin">Date de fin *</Label>
                <Input
                  id="dateFin"
                  type="date"
                  value={formData.dateFin}
                  onChange={(e) => handleChange("dateFin", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tarifJournalier">Tarif journalier (FCFA)</Label>
                <Input
                  id="tarifJournalier"
                  type="number"
                  value={formData.tarifJournalier}
                  onChange={(e) => handleChange("tarifJournalier", e.target.value)}
                  placeholder="25000"
                />
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nombre de jours</span>
                  <span className="font-medium">{calculateDays()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant total</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(calculateTotal())} FCFA
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </MainLayout>
  );
}
