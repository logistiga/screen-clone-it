import { useState } from "react";
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
import { FormError } from "@/components/ui/form-error";
import {
  TypeOperationIndep,
  TypeMarchandise,
  LignePrestationEtendue,
  getTypeMarchandiseLabels,
} from "@/types/documents";
import OperationsIndependantesForm from "@/components/operations/OperationsIndependantesForm";
import {
  useInitialDataSync,
  useEmitFormData,
  usePrestations,
  useIndependantValidation,
} from "./hooks";

/**
 * Données communes à tous les formulaires Indépendant
 * (Devis / Ordre / Facture). `lieuChargement` / `lieuDechargement`
 * ne sont utilisés que côté Devis mais conservés ici pour simplifier.
 */
export interface IndependantFormData {
  /** @deprecated conservé pour compat ; ne plus utiliser */
  typeOperationIndep: TypeOperationIndep | "";
  typeMarchandise: TypeMarchandise | "";
  descriptionGenerale: string;
  observationInterne: string;
  lieuChargement?: string;
  lieuDechargement?: string;
  prestations: LignePrestationEtendue[];
  montantHT: number;
}

export interface IndependantFormInitial extends Partial<IndependantFormData> {}

interface IndependantFormProps {
  onDataChange: (data: IndependantFormData) => void;
  initialData?: IndependantFormInitial | null;
  /** Suivre les lieux de chargement/déchargement (Devis uniquement). */
  trackLieux?: boolean;
  /** Activer la validation Zod + FormError (Ordre uniquement). */
  withValidation?: boolean;
}

export default function IndependantForm({
  onDataChange,
  initialData,
  trackLieux = false,
  withValidation = false,
}: IndependantFormProps) {
  const [typeMarchandise, setTypeMarchandise] = useState<TypeMarchandise | "">(
    initialData?.typeMarchandise ?? "",
  );
  const [descriptionGenerale, setDescriptionGenerale] = useState(
    initialData?.descriptionGenerale ?? "",
  );
  const [observationInterne, setObservationInterne] = useState(
    initialData?.observationInterne ?? "",
  );
  const [lieuChargement, setLieuChargement] = useState(initialData?.lieuChargement ?? "");
  const [lieuDechargement, setLieuDechargement] = useState(initialData?.lieuDechargement ?? "");

  const { prestations, setPrestations, add, remove, change, totalHT } = usePrestations(
    initialData?.prestations,
    {
      onLieuDepartChange: trackLieux ? setLieuChargement : undefined,
      onLieuArriveeChange: trackLieux ? setLieuDechargement : undefined,
    },
  );

  // Synchronisation initialData → état local (anti-boucle via clé sérialisable)
  useInitialDataSync(
    initialData,
    (d) =>
      JSON.stringify({
        tm: d.typeMarchandise ?? "",
        dg: d.descriptionGenerale ?? "",
        oi: d.observationInterne ?? "",
        ps: (d.prestations ?? []).map((p) => p.id),
      }),
    (d) => {
      if (d.typeMarchandise !== undefined) setTypeMarchandise(d.typeMarchandise ?? "");
      if (d.descriptionGenerale !== undefined) setDescriptionGenerale(d.descriptionGenerale ?? "");
      if (d.observationInterne !== undefined) setObservationInterne(d.observationInterne ?? "");
      if (d.prestations?.length) {
        const oldType = d.typeOperationIndep;
        setPrestations(
          d.prestations.map((p) => ({
            ...p,
            typeOperation:
              p.typeOperation || (oldType as TypeOperationIndep | "") || "",
          })),
        );
      }
    },
  );

  // Validation (Ordre uniquement)
  const { errors, touched, handleBlur, getFieldError } = useIndependantValidation({
    enabled: withValidation,
    typeMarchandise,
    prestations,
  });

  // Émission du payload vers le parent
  useEmitFormData(
    {
      typeOperationIndep: "" as TypeOperationIndep | "",
      typeMarchandise,
      descriptionGenerale,
      observationInterne,
      prestations,
      montantHT: totalHT,
      ...(trackLieux ? { lieuChargement, lieuDechargement } : {}),
    } as IndependantFormData,
    onDataChange,
    [
      typeMarchandise,
      descriptionGenerale,
      observationInterne,
      prestations,
      lieuChargement,
      lieuDechargement,
    ],
  );

  const marchandiseLabels = getTypeMarchandiseLabels();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations marchandise</CardTitle>
          <CardDescription>Type, description et observation pour cette opération.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type de marchandise *</Label>
            <Select
              value={typeMarchandise || undefined}
              onValueChange={(v) => {
                setTypeMarchandise(v as TypeMarchandise);
                handleBlur("typeMarchandise");
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(marchandiseLabels) as TypeMarchandise[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {marchandiseLabels[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {withValidation && <FormError message={getFieldError("typeMarchandise")} />}
          </div>

          <div className="space-y-2">
            <Label>Description générale</Label>
            <Textarea
              value={descriptionGenerale}
              onChange={(e) => setDescriptionGenerale(e.target.value)}
              rows={3}
              placeholder="Description de l'opération (visible sur le document)"
            />
          </div>

          <div className="space-y-2">
            <Label>Observation interne</Label>
            <Textarea
              value={observationInterne}
              onChange={(e) => setObservationInterne(e.target.value)}
              rows={3}
              placeholder="Notes internes (non imprimées sur le PDF)"
            />
          </div>
        </CardContent>
      </Card>

      <OperationsIndependantesForm
        prestations={prestations}
        onAddPrestation={add}
        onRemovePrestation={remove}
        onPrestationChange={change}
        onReplacePrestations={setPrestations}
        errors={withValidation ? errors : undefined}
        touched={withValidation ? touched : undefined}
        onBlur={withValidation ? handleBlur : undefined}
      />
    </div>
  );
}
