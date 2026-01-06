import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Users, Plus, Trash2, Save, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TotauxDocument } from "@/components/forms/TotauxDocument";
import { clients, LigneDocument, TAUX_TVA, TAUX_CSS, configurationNumerotation, formatMontant } from "@/data/mockData";
import { toast } from "sonner";

interface LignePrestation {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montantHT: number;
}

export default function NouveauDevisPage() {
  const navigate = useNavigate();

  // Client
  const [clientId, setClientId] = useState("");
  
  // Date validité
  const [dateValidite, setDateValidite] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  
  // Prestations
  const [prestations, setPrestations] = useState<LignePrestation[]>([
    { id: "1", description: "", quantite: 1, prixUnitaire: 0, montantHT: 0 }
  ]);
  
  // Notes
  const [notes, setNotes] = useState("");

  // Generate numero
  const generateNumero = () => {
    const year = new Date().getFullYear();
    const counter = configurationNumerotation.prochainNumeroDevis.toString().padStart(4, '0');
    return `${configurationNumerotation.prefixeDevis}-${year}-${counter}`;
  };

  // Gestion des prestations
  const handleAddPrestation = () => {
    setPrestations([
      ...prestations,
      { id: String(Date.now()), description: "", quantite: 1, prixUnitaire: 0, montantHT: 0 }
    ]);
  };

  const handleRemovePrestation = (id: string) => {
    if (prestations.length > 1) {
      setPrestations(prestations.filter(p => p.id !== id));
    }
  };

  const handlePrestationChange = (id: string, field: keyof LignePrestation, value: string | number) => {
    setPrestations(prestations.map(p => {
      if (p.id === id) {
        const updated = { ...p, [field]: value };
        if (field === 'quantite' || field === 'prixUnitaire') {
          updated.montantHT = updated.quantite * updated.prixUnitaire;
        }
        return updated;
      }
      return p;
    }));
  };

  // Calcul des totaux
  const montantHT = prestations.reduce((sum, p) => sum + p.montantHT, 0);
  const tva = Math.round(montantHT * TAUX_TVA);
  const css = Math.round(montantHT * TAUX_CSS);
  const montantTTC = montantHT + tva + css;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }

    if (prestations.every(p => !p.description || p.montantHT === 0)) {
      toast.error("Veuillez ajouter au moins une prestation");
      return;
    }

    const data = {
      id: Date.now().toString(),
      numero: generateNumero(),
      clientId,
      dateCreation: new Date().toISOString().split('T')[0],
      dateValidite,
      lignes: prestations.map(p => ({
        id: p.id,
        description: p.description,
        quantite: p.quantite,
        prixUnitaire: p.prixUnitaire,
        montantHT: p.montantHT
      })),
      montantHT,
      tva,
      css,
      montantTTC,
      statut: 'brouillon',
      notes
    };

    console.log("Devis créé:", data);
    toast.success("Devis créé avec succès");
    navigate("/devis");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/devis")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Nouveau devis
              </h1>
              <p className="text-muted-foreground text-sm">
                Numéro: <span className="font-medium">{generateNumero()}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section Client */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom du client *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date de validité
                  </Label>
                  <Input
                    type="date"
                    value={dateValidite}
                    onChange={(e) => setDateValidite(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section Prestations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Prestations
                </CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={handleAddPrestation} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Ajouter ligne
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2">Quantité</div>
                  <div className="col-span-2">Prix unitaire</div>
                  <div className="col-span-2">Montant HT</div>
                  <div className="col-span-1"></div>
                </div>
                {prestations.map((prestation) => (
                  <div key={prestation.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input
                        placeholder="Description du service..."
                        value={prestation.description}
                        onChange={(e) => handlePrestationChange(prestation.id, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="1"
                        value={prestation.quantite}
                        onChange={(e) => handlePrestationChange(prestation.id, 'quantite', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        value={prestation.prixUnitaire || ""}
                        onChange={(e) => handlePrestationChange(prestation.id, 'prixUnitaire', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        value={formatMontant(prestation.montantHT)}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="col-span-1">
                      {prestations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemovePrestation(prestation.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Récapitulatif */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent>
              <TotauxDocument
                montantHT={montantHT}
                tva={tva}
                css={css}
                montantTTC={montantTTC}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conditions et notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Conditions particulières, notes..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4 pb-6">
            <Button type="button" variant="outline" onClick={() => navigate("/devis")}>
              Annuler
            </Button>
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              Créer le devis
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
