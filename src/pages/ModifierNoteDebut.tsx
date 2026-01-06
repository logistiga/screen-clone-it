import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Save, Anchor, Container, Wrench } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";

interface NoteDebut {
  id: string;
  number: string;
  client: string;
  clientId: string;
  type: "ouverture_port" | "detention" | "reparation";
  blNumber: string;
  containerNumber: string;
  dateDebut: string;
  dateFin: string;
  tarifJournalier: number;
  description: string;
}

const mockNote: NoteDebut = {
  id: "1",
  number: "ND-2024-001",
  client: "MAERSK LINE",
  clientId: "1",
  type: "ouverture_port",
  blNumber: "BL-2024-001",
  containerNumber: "MSKU1234567",
  dateDebut: "2024-01-15",
  dateFin: "2024-01-20",
  tarifJournalier: 25000,
  description: "Ouverture port standard pour conteneur 20 pieds",
};

const typeConfig = {
  ouverture_port: {
    label: "Ouverture de port",
    icon: Anchor,
  },
  detention: {
    label: "Détention",
    icon: Container,
  },
  reparation: {
    label: "Réparation conteneur",
    icon: Wrench,
  },
};

const mockClients = [
  { id: "1", name: "MAERSK LINE" },
  { id: "2", name: "CMA CGM" },
  { id: "3", name: "MSC" },
  { id: "4", name: "HAPAG-LLOYD" },
];

export default function ModifierNoteDebut() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    clientId: mockNote.clientId,
    type: mockNote.type,
    blNumber: mockNote.blNumber,
    containerNumber: mockNote.containerNumber,
    dateDebut: mockNote.dateDebut,
    dateFin: mockNote.dateFin,
    tarifJournalier: mockNote.tarifJournalier.toString(),
    description: mockNote.description,
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateDays = () => {
    if (formData.dateDebut && formData.dateFin) {
      const start = new Date(formData.dateDebut);
      const end = new Date(formData.dateFin);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
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
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    toast({
      title: "Note modifiée",
      description: `La note ${mockNote.number} a été mise à jour avec succès.`,
    });

    setIsLoading(false);
    navigate(`/notes-debut/${id}`);
  };

  return (
    <MainLayout title={`Modifier ${mockNote.number}`}>
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
              <h1 className="text-2xl font-semibold">Modifier {mockNote.number}</h1>
              <p className="text-muted-foreground">
                Modifiez les informations de la note de début
              </p>
            </div>
          </div>
          <Button type="submit" disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Enregistrement..." : "Enregistrer"}
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
                  <Label htmlFor="client">Client</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(v) => handleChange("clientId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
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
                      {Object.entries(typeConfig).map(([key, config]) => (
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
                    onChange={(e) => handleChange("containerNumber", e.target.value)}
                    placeholder="MSKU1234567"
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
                <Label htmlFor="dateDebut">Date de début</Label>
                <Input
                  id="dateDebut"
                  type="date"
                  value={formData.dateDebut}
                  onChange={(e) => handleChange("dateDebut", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFin">Date de fin</Label>
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
