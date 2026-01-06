import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
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
import { ArrowLeft, Save } from "lucide-react";
import { LignesDocumentForm } from "@/components/forms/LignesDocumentForm";
import { TotauxDocument } from "@/components/forms/TotauxDocument";
import { clients, LigneDocument, TAUX_TVA, TAUX_CSS, configurationNumerotation } from "@/data/mockData";
import { toast } from "sonner";

const typesOperation = [
  { value: 'conteneurs', label: 'Conteneurs' },
  { value: 'conventionnel', label: 'Conventionnel' },
  { value: 'location', label: 'Location véhicule' },
  { value: 'transport', label: 'Transport' },
  { value: 'manutention', label: 'Manutention' },
  { value: 'stockage', label: 'Stockage' },
];

export default function NouvelOrdrePage() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState("");
  const [typeOperation, setTypeOperation] = useState("");
  const [notes, setNotes] = useState("");
  const [lignes, setLignes] = useState<LigneDocument[]>([]);

  // Calculate totals
  const montantHT = lignes.reduce((sum, l) => sum + l.montantHT, 0);
  const tva = Math.round(montantHT * TAUX_TVA);
  const css = Math.round(montantHT * TAUX_CSS);
  const montantTTC = montantHT + tva + css;

  // Generate numero
  const generateNumero = () => {
    const year = new Date().getFullYear();
    const counter = configurationNumerotation.prochainNumeroOrdre.toString().padStart(4, '0');
    return `${configurationNumerotation.prefixeOrdre}-${year}-${counter}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (!typeOperation) {
      toast.error("Veuillez sélectionner un type d'opération");
      return;
    }
    if (lignes.length === 0) {
      toast.error("Veuillez ajouter au moins une ligne");
      return;
    }

    const data = {
      id: Date.now().toString(),
      numero: generateNumero(),
      clientId,
      dateCreation: new Date().toISOString().split('T')[0],
      typeOperation,
      lignes,
      montantHT,
      tva,
      css,
      montantTTC,
      montantPaye: 0,
      statut: 'en_cours',
      notes
    };

    console.log("Ordre créé:", data);
    toast.success("Ordre de travail créé avec succès");
    navigate("/ordres-travail");
  };

  return (
    <MainLayout title="Nouvel Ordre de Travail">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/ordres-travail")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux ordres
          </Button>
          <div className="text-sm text-muted-foreground">
            Numéro: <span className="font-medium">{generateNumero()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="typeOperation">Type d'opération *</Label>
                  <Select value={typeOperation} onValueChange={setTypeOperation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typesOperation.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lignes */}
          <Card>
            <CardHeader>
              <CardTitle>Détail des prestations</CardTitle>
            </CardHeader>
            <CardContent>
              <LignesDocumentForm lignes={lignes} onChange={setLignes} />
            </CardContent>
          </Card>

          {/* Totaux */}
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
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
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instructions ou remarques..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/ordres-travail")}>
              Annuler
            </Button>
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" />
              Créer l'ordre de travail
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
