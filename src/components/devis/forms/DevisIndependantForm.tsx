import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TypeOperationIndep,
  TypeMarchandise,
  LignePrestationEtendue,
  getInitialPrestationEtendue,
  getTypeMarchandiseLabels,
  calculateDaysBetween,
} from "@/types/documents";
import OperationsIndependantesForm from "@/components/operations/OperationsIndependantesForm";

export interface DevisIndependantInitialData {
  typeOperationIndep?: TypeOperationIndep | "";
  typeMarchandise?: TypeMarchandise | "";
  descriptionGenerale?: string;
  observationInterne?: string;
  lieuChargement?: string;
  lieuDechargement?: string;
  prestations?: LignePrestationEtendue[];
}

interface DevisIndependantFormProps {
  onDataChange: (data: DevisIndependantData) => void;
  initialData?: DevisIndependantInitialData;
}

export interface DevisIndependantData {
  /** @deprecated */
  typeOperationIndep: TypeOperationIndep | "";
  typeMarchandise: TypeMarchandise | "";
  descriptionGenerale: string;
  observationInterne: string;
  lieuChargement: string;
  lieuDechargement: string;
  prestations: LignePrestationEtendue[];
  montantHT: number;
}

export default function DevisIndependantForm({ onDataChange, initialData }: DevisIndependantFormProps) {
  const lastInitKey = useRef<string>("");
  const [typeMarchandise, setTypeMarchandise] = useState<TypeMarchandise | "">(
    initialData?.typeMarchandise ?? ""
  );
  const [descriptionGenerale, setDescriptionGenerale] = useState(initialData?.descriptionGenerale ?? "");
  const [observationInterne, setObservationInterne] = useState(initialData?.observationInterne ?? "");
  const [lieuChargement, setLieuChargement] = useState(initialData?.lieuChargement ?? "");
  const [lieuDechargement, setLieuDechargement] = useState(initialData?.lieuDechargement ?? "");
  const [prestations, setPrestations] = useState<LignePrestationEtendue[]>(
    initialData?.prestations?.length ? initialData.prestations : [getInitialPrestationEtendue()]
  );

  useEffect(() => {
    if (!initialData) return;
    const key = JSON.stringify({
      tm: initialData.typeMarchandise ?? "",
      dg: initialData.descriptionGenerale ?? "",
      oi: initialData.observationInterne ?? "",
      ps: (initialData.prestations ?? []).map((p) => p.id),
    });
    if (key === lastInitKey.current) return;
    if (initialData.typeMarchandise !== undefined) setTypeMarchandise(initialData.typeMarchandise ?? "");
    if (initialData.descriptionGenerale !== undefined)
      setDescriptionGenerale(initialData.descriptionGenerale ?? "");
    if (initialData.observationInterne !== undefined)
      setObservationInterne(initialData.observationInterne ?? "");
    if (initialData.prestations?.length) {
      const oldType = initialData.typeOperationIndep;
      setPrestations(
        initialData.prestations.map((p) => ({
          ...p,
          typeOperation: p.typeOperation || (oldType as TypeOperationIndep | "") || "",
        }))
      );
    }
    lastInitKey.current = key;
  }, [initialData]);

  const totalHT = (items: LignePrestationEtendue[]) =>
    items.reduce((s, p) => s + (p.montantHT || 0), 0);

  useEffect(() => {
    onDataChange({
      typeOperationIndep: "",
      typeMarchandise,
      descriptionGenerale,
      observationInterne,
      lieuChargement,
      lieuDechargement,
      prestations,
      montantHT: totalHT(prestations),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeMarchandise, descriptionGenerale, observationInterne, prestations, lieuChargement, lieuDechargement]);

  const handleAddPrestation = () => {
    setPrestations([...prestations, { ...getInitialPrestationEtendue(), id: String(Date.now()) }]);
  };
  const handleRemovePrestation = (id: string) => {
    if (prestations.length > 1) setPrestations(prestations.filter((p) => p.id !== id));
  };
  const handlePrestationChange = (id: string, field: keyof LignePrestationEtendue, value: string | number) => {
    setPrestations((curr) =>
      curr.map((p) => {
        if (p.id !== id) return p;
        const updated: LignePrestationEtendue = { ...p, [field]: value } as LignePrestationEtendue;
        if (field === "dateDebut" || field === "dateFin") {
          const d = field === "dateDebut" ? String(value) : updated.dateDebut || "";
          const f = field === "dateFin" ? String(value) : updated.dateFin || "";
          if (d && f) {
            updated.quantite = calculateDaysBetween(d, f);
            updated.montantHT = updated.quantite * updated.prixUnitaire;
          }
        }
        if (field === "quantite" || field === "prixUnitaire") {
          updated.montantHT = updated.quantite * updated.prixUnitaire;
        }
        if (field === "lieuDepart") setLieuChargement(String(value));
        if (field === "lieuArrivee") setLieuDechargement(String(value));
        return updated;
      })
    );
  };

  const marchandiseLabels = getTypeMarchandiseLabels();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations marchandise</CardTitle>
          <CardDescription>Type, description et observation pour cette opération.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type de marchandise *</Label>
            <Select value={typeMarchandise || undefined} onValueChange={(v) => setTypeMarchandise(v as TypeMarchandise)}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Sélectionner un type" /></SelectTrigger>
              <SelectContent>
                {(Object.keys(marchandiseLabels) as TypeMarchandise[]).map((k) => (
                  <SelectItem key={k} value={k}>{marchandiseLabels[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description générale</Label>
            <Textarea value={descriptionGenerale} onChange={(e) => setDescriptionGenerale(e.target.value)} rows={3} placeholder="Description de l'opération (visible sur le document)" />
          </div>
          <div className="space-y-2">
            <Label>Observation interne</Label>
            <Textarea value={observationInterne} onChange={(e) => setObservationInterne(e.target.value)} rows={3} placeholder="Notes internes (non imprimées sur le PDF)" />
          </div>
        </CardContent>
      </Card>

      <OperationsIndependantesForm
        prestations={prestations}
        onAddPrestation={handleAddPrestation}
        onRemovePrestation={handleRemovePrestation}
        onPrestationChange={handlePrestationChange}
      />
    </>
  );
}
