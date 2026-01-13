import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, User, Package, MapPin, Calendar, Receipt, Percent, Building2, Ship, Truck, Anchor } from "lucide-react";
import { CategorieDocument, getCategoriesLabels } from "@/types/documents";
import type { DevisConteneursData } from "@/components/devis/forms/DevisConteneursForm";
import type { DevisConventionnelData } from "@/components/devis/forms/DevisConventionnelForm";
import type { DevisIndependantData } from "@/components/devis/forms/DevisIndependantForm";
import { RemiseData } from "@/components/shared/RemiseInput";

interface Client {
  id: number;
  nom: string;
  email?: string;
  telephone?: string;
}

interface DevisPreviewProps {
  categorie: CategorieDocument | "";
  client?: Client;
  dateValidite: string;
  notes: string;
  conteneursData?: DevisConteneursData | null;
  conventionnelData?: DevisConventionnelData | null;
  independantData?: DevisIndependantData | null;
  montantHT: number;
  tva: number;
  css: number;
  montantTTC: number;
  remiseData?: RemiseData;
  armateurs?: any[];
  transitaires?: any[];
  representants?: any[];
}

const formatMontant = (montant: number) => {
  return montant.toLocaleString("fr-FR") + " XAF";
};

export default function DevisPreview({
  categorie,
  client,
  dateValidite,
  notes,
  conteneursData,
  conventionnelData,
  independantData,
  montantHT,
  tva,
  css,
  montantTTC,
  remiseData,
  armateurs = [],
  transitaires = [],
  representants = [],
}: DevisPreviewProps) {
  const categoriesLabels = getCategoriesLabels();

  const getArmateurNom = (id: string) => {
    const a = armateurs.find((arm: any) => String(arm.id) === id);
    return a?.nom || "Non défini";
  };

  const getTransitaireNom = (id: string) => {
    const t = transitaires.find((tr: any) => String(tr.id) === id);
    return t?.nom || "Non défini";
  };

  const getRepresentantNom = (id: string) => {
    const r = representants.find((rep: any) => String(rep.id) === id);
    return r ? `${r.prenom} ${r.nom}` : "Non défini";
  };

  if (!categorie) {
    return (
      <Card className="sticky top-4 border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mb-4 opacity-40" />
          <p className="text-center">Sélectionnez une catégorie pour voir l'aperçu</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4 shadow-lg border-primary/20 overflow-hidden">
      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">Aperçu du devis</h3>
            <p className="text-sm text-primary-foreground/80">Mise à jour en temps réel</p>
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Catégorie */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="py-1.5 px-3 flex items-center gap-2">
            {categoriesLabels[categorie].icon}
            <span>{categoriesLabels[categorie].label}</span>
          </Badge>
        </div>

        <Separator />

        {/* Client */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4 text-primary" />
            <span>Client</span>
          </div>
          {client ? (
            <div className="pl-6 space-y-1">
              <p className="font-medium">{client.nom}</p>
              {client.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
              {client.telephone && <p className="text-sm text-muted-foreground">{client.telephone}</p>}
            </div>
          ) : (
            <p className="pl-6 text-sm text-muted-foreground italic">Non sélectionné</p>
          )}
        </div>

        {/* Validité */}
        {dateValidite && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Valide jusqu'au:</span>
            <span className="font-medium">{new Date(dateValidite).toLocaleDateString("fr-FR")}</span>
          </div>
        )}

        <Separator />

        {/* Détails par catégorie */}
        {categorie === "conteneurs" && conteneursData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 text-primary" />
              <span>Détails conteneurs</span>
            </div>
            
            {conteneursData.numeroBL && (
              <div className="pl-6 flex items-center gap-2 text-sm">
                <Ship className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">N° BL:</span>
                <span className="font-medium">{conteneursData.numeroBL}</span>
              </div>
            )}

            {conteneursData.armateurId && (
              <div className="pl-6 flex items-center gap-2 text-sm">
                <Anchor className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Armateur:</span>
                <span className="font-medium">{getArmateurNom(conteneursData.armateurId)}</span>
              </div>
            )}

            {conteneursData.transitaireId && (
              <div className="pl-6 flex items-center gap-2 text-sm">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Transitaire:</span>
                <span className="font-medium">{getTransitaireNom(conteneursData.transitaireId)}</span>
              </div>
            )}

            {conteneursData.conteneurs.length > 0 && (
              <div className="pl-6 mt-2">
                <p className="text-sm text-muted-foreground mb-2">{conteneursData.conteneurs.length} conteneur(s):</p>
                <div className="space-y-2">
                  {conteneursData.conteneurs.slice(0, 3).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-muted/50 rounded-md p-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{c.numero || `Conteneur ${i + 1}`}</span>
                        <Badge variant="outline" className="text-xs">{c.taille}</Badge>
                      </div>
                      <span className="text-muted-foreground">{c.operations.length} op.</span>
                    </div>
                  ))}
                  {conteneursData.conteneurs.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{conteneursData.conteneurs.length - 3} autre(s)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {categorie === "conventionnel" && conventionnelData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Truck className="h-4 w-4 text-primary" />
              <span>Détails conventionnel</span>
            </div>
            
            {conventionnelData.numeroBL && (
              <div className="pl-6 flex items-center gap-2 text-sm">
                <Ship className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">N° BL:</span>
                <span className="font-medium">{conventionnelData.numeroBL}</span>
              </div>
            )}

            {conventionnelData.lieuChargement && (
              <div className="pl-6 flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-green-500" />
                <span className="text-muted-foreground">Chargement:</span>
                <span className="font-medium">{conventionnelData.lieuChargement}</span>
              </div>
            )}

            {conventionnelData.lieuDechargement && (
              <div className="pl-6 flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-red-500" />
                <span className="text-muted-foreground">Déchargement:</span>
                <span className="font-medium">{conventionnelData.lieuDechargement}</span>
              </div>
            )}

            {conventionnelData.lots.length > 0 && (
              <div className="pl-6 mt-2">
                <p className="text-sm text-muted-foreground mb-2">{conventionnelData.lots.length} lot(s):</p>
                <div className="space-y-1">
                  {conventionnelData.lots.slice(0, 3).map((l, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-muted/50 rounded-md p-2">
                      <span className="font-medium truncate max-w-[150px]">{l.description || `Lot ${i + 1}`}</span>
                      <span className="text-muted-foreground">{formatMontant(l.prixTotal)}</span>
                    </div>
                  ))}
                  {conventionnelData.lots.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{conventionnelData.lots.length - 3} autre(s)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {categorie === "operations_independantes" && independantData && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 text-primary" />
              <span>Opérations indépendantes</span>
            </div>
            
            {independantData.typeOperationIndep && (
              <div className="pl-6">
                <Badge variant="outline">{independantData.typeOperationIndep}</Badge>
              </div>
            )}

            {independantData.prestations.length > 0 && (
              <div className="pl-6 mt-2">
                <p className="text-sm text-muted-foreground mb-2">{independantData.prestations.length} prestation(s):</p>
                <div className="space-y-1">
                  {independantData.prestations.slice(0, 3).map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-muted/50 rounded-md p-2">
                      <span className="font-medium truncate max-w-[150px]">{p.description || `Prestation ${i + 1}`}</span>
                      <span className="text-muted-foreground">{formatMontant(p.montantHT)}</span>
                    </div>
                  ))}
                  {independantData.prestations.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{independantData.prestations.length - 3} autre(s)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Notes */}
        {notes && (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">Notes</p>
              <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md line-clamp-3">
                {notes}
              </p>
            </div>
            <Separator />
          </>
        )}

        {/* Récapitulatif financier */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Receipt className="h-4 w-4 text-primary" />
            <span>Récapitulatif</span>
          </div>
          
          <div className="bg-gradient-to-br from-muted/50 to-muted rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant HT</span>
              <span className="font-medium">{formatMontant(montantHT)}</span>
            </div>

            {remiseData && remiseData.montantCalcule > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span className="flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  Remise {remiseData.type === "pourcentage" ? `(${remiseData.valeur}%)` : ""}
                </span>
                <span>-{formatMontant(remiseData.montantCalcule)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">TVA</span>
              <span>{formatMontant(tva)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CSS</span>
              <span>{formatMontant(css)}</span>
            </div>

            <Separator />

            <div className="flex justify-between font-bold text-lg">
              <span>Total TTC</span>
              <span className="text-primary">{formatMontant(montantTTC)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
