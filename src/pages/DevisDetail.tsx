import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Clock,
  User,
  AlertCircle,
  Loader2,
  FileText,
  Receipt,
  Percent,
  Coins,
  Container,
  Package,
  Wrench,
  Building2,
  Ship,
  MapPin,
} from "lucide-react";
import { useDevisById, useConvertDevisToOrdre } from "@/hooks/use-commercial";
import {
  DevisHeader,
  DevisHeaderSkeleton,
  DevisStatCard,
  DevisStatCardSkeleton,
  DevisTimeline,
} from "@/components/devis/shared";
import { cn } from "@/lib/utils";

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' XAF';
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

export default function DevisDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("details");

  // Cast to any for API response flexibility
  const { data: devisResponse, isLoading, error } = useDevisById(id || '');
  const devisData = devisResponse as any;
  const convertMutation = useConvertDevisToOrdre();

  if (isLoading) {
    return (
      <MainLayout title="Chargement...">
        <div className="space-y-6 animate-fade-in">
          <DevisHeaderSkeleton />
          <div className="grid gap-4 md:grid-cols-4">
            <DevisStatCardSkeleton />
            <DevisStatCardSkeleton />
            <DevisStatCardSkeleton />
            <DevisStatCardSkeleton />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !devisData) {
    return (
      <MainLayout title="Devis non trouvé">
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="p-4 rounded-full bg-destructive/10 mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Devis non trouvé</h2>
          <p className="text-muted-foreground mb-4">
            Le devis demandé n'existe pas ou a été supprimé.
          </p>
          <Button onClick={() => navigate(-1)}>Retour</Button>
        </div>
      </MainLayout>
    );
  }

  const handleConvertToOrdre = async () => {
    if (!id) return;
    try {
      const result = await convertMutation.mutateAsync(id);
      // Rediriger vers l'ordre créé en mode édition pour compléter les données
      const ordreId = result?.data?.id;
      if (ordreId) {
        navigate(`/ordres/${ordreId}/modifier`);
      } else {
        navigate("/ordres");
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Calculs
  const montantHT = devisData.montant_ht || 0;
  const remise = devisData.remise_montant || 0;
  const tva = devisData.montant_tva || devisData.tva || 0;
  const css = devisData.montant_css || devisData.css || 0;
  const montantTTC = devisData.montant_ttc || 0;

  const getCategorieInfo = () => {
    const config: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
      Conteneur: { label: "Conteneurs", icon: <Container className="h-4 w-4" />, color: "text-blue-600" },
      Lot: { label: "Conventionnel", icon: <Package className="h-4 w-4" />, color: "text-amber-600" },
      Independant: { label: "Indépendant", icon: <Wrench className="h-4 w-4" />, color: "text-purple-600" },
    };
    return config[devisData.type_document] || config.Conteneur;
  };

  const categorieInfo = getCategorieInfo();

  return (
    <MainLayout title={`Devis ${devisData.numero}`}>
      <div className="space-y-6 animate-fade-in">
        {/* Header moderne */}
        <DevisHeader
          devis={devisData}
          onConvert={handleConvertToOrdre}
          isConverting={convertMutation.isPending}
          onWhatsApp={() => {
            const pdfUrl = `${window.location.origin}/devis/${devisData.id}/pdf`;
            const montant = new Intl.NumberFormat('fr-FR').format(devisData.montant_ttc || 0) + ' FCFA';
            const message = `Bonjour${devisData.client?.nom ? ` ${devisData.client.nom}` : ''},

Veuillez trouver ci-dessous votre devis n° *${devisData.numero}* d'un montant de *${montant}*.

📄 *Détails du devis :*
• Client : ${devisData.client?.nom || '-'}
• Montant HT : ${new Intl.NumberFormat('fr-FR').format(devisData.montant_ht || 0)} FCFA
• TVA : ${new Intl.NumberFormat('fr-FR').format(devisData.montant_tva || 0)} FCFA
• Montant TTC : ${montant}
• Date de validité : ${devisData.date_validite ? new Date(devisData.date_validite).toLocaleDateString('fr-FR') : '-'}

📎 *Lien du document PDF :*
${pdfUrl}

Pour toute question, n'hésitez pas à nous contacter.

Cordialement,
L'équipe Lojistiga`;

            let phone = devisData.client?.telephone || "";
            phone = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
            
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = phone 
              ? `https://wa.me/${phone.startsWith('+') ? phone.slice(1) : phone}?text=${encodedMessage}`
              : `https://wa.me/?text=${encodedMessage}`;
            
            window.open(whatsappUrl, '_blank');
          }}
        />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DevisStatCard
            title="Montant HT"
            value={formatMontant(montantHT)}
            icon={Receipt}
            variant="primary"
          />
          {remise > 0 ? (
            <DevisStatCard
              title="Remise"
              value={`- ${formatMontant(remise)}`}
              icon={Percent}
              variant="warning"
              subtitle={devisData.remise_type === 'pourcentage' 
                ? `${devisData.remise_valeur}%` 
                : 'Montant fixe'}
            />
          ) : (
            <DevisStatCard
              title="TVA (18%)"
              value={formatMontant(tva)}
              icon={Percent}
              variant="default"
            />
          )}
          <DevisStatCard
            title="Taxes"
            value={formatMontant(tva + css)}
            icon={Coins}
            variant="info"
            subtitle={`TVA: ${formatMontant(tva)} + CSS: ${formatMontant(css)}`}
          />
          <DevisStatCard
            title="Total TTC"
            value={formatMontant(montantTTC)}
            icon={FileText}
            variant="success"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="details" className="gap-2">
              <FileText className="h-4 w-4" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="client" className="gap-2">
              <User className="h-4 w-4" />
              Client
            </TabsTrigger>
            <TabsTrigger value="historique" className="gap-2">
              <Clock className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Info catégorie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className={categorieInfo.color}>{categorieInfo.icon}</span>
                  {categorieInfo.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {devisData.navire && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Ship className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Navire</p>
                        <p className="font-medium">{devisData.navire}</p>
                      </div>
                    </div>
                  )}
                  {devisData.numero_bl && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">N° BL</p>
                        <p className="font-medium font-mono">{devisData.numero_bl}</p>
                      </div>
                    </div>
                  )}
                  {devisData.armateur?.nom && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Armateur</p>
                        <p className="font-medium">{devisData.armateur.nom}</p>
                      </div>
                    </div>
                  )}
                  {devisData.transitaire?.nom && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Transitaire</p>
                        <p className="font-medium">{devisData.transitaire.nom}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lignes du devis */}
            {devisData.lignes && devisData.lignes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prestations</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Désignation</TableHead>
                        <TableHead>Lieu</TableHead>
                        <TableHead className="text-center">Quantité</TableHead>
                        <TableHead className="text-right">Prix unitaire</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devisData.lignes.map((ligne: any, index: number) => (
                        <TableRow key={ligne.id || index} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <TableCell className="font-medium">{ligne.description || ligne.designation}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {ligne.lieu_depart && ligne.lieu_arrivee 
                              ? `${ligne.lieu_depart} → ${ligne.lieu_arrivee}`
                              : ligne.lieu_depart || ligne.lieu_arrivee || '-'}
                          </TableCell>
                          <TableCell className="text-center">{ligne.quantite}</TableCell>
                          <TableCell className="text-right">{formatMontant(ligne.prix_unitaire)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMontant((ligne.quantite || 1) * (ligne.prix_unitaire || 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Conteneurs */}
            {devisData.conteneurs && devisData.conteneurs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Container className="h-5 w-5 text-blue-600" />
                    Conteneurs ({devisData.conteneurs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {devisData.conteneurs.map((conteneur: any, index: number) => (
                    <div 
                      key={conteneur.id || index} 
                      className="p-4 rounded-lg border bg-muted/20 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Container className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-mono font-semibold">{conteneur.numero}</p>
                            <p className="text-sm text-muted-foreground">
                              {conteneur.taille}' - {conteneur.type || 'DRY'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{conteneur.operations?.length || 0} opérations</Badge>
                      </div>
                      
                      {conteneur.operations && conteneur.operations.length > 0 && (
                        <div className="space-y-2 mt-3 pt-3 border-t">
                          {conteneur.operations.map((op: any, opIndex: number) => (
                            <div key={opIndex} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">{op.description || op.type}</span>
                              <span className="font-medium">{formatMontant(op.prix_unitaire * (op.quantite || 1))}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Lots (conventionnel) */}
            {devisData.lots && devisData.lots.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-amber-600" />
                    Lots ({devisData.lots.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>N° Lot</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Quantité</TableHead>
                        <TableHead className="text-right">Prix unitaire</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devisData.lots.map((lot: any, index: number) => (
                        <TableRow key={lot.id || index} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                          <TableCell className="font-mono">{lot.numero_lot}</TableCell>
                          <TableCell>{lot.description}</TableCell>
                          <TableCell className="text-center">{lot.quantite}</TableCell>
                          <TableCell className="text-right">{formatMontant(lot.prix_unitaire)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMontant(lot.prix_total || (lot.quantite * lot.prix_unitaire))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {devisData.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{devisData.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Récapitulatif financier */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Récapitulatif financier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant HT</span>
                  <span className="font-medium">{formatMontant(montantHT)}</span>
                </div>
                {remise > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Remise ({devisData.remise_type === 'pourcentage' ? `${devisData.remise_valeur}%` : 'fixe'})</span>
                    <span className="font-medium">- {formatMontant(remise)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA (18%)</span>
                  <span>{formatMontant(tva)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CSS (1%)</span>
                  <span>{formatMontant(css)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total TTC</span>
                  <span className="text-primary">{formatMontant(montantTTC)}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="client" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Informations client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  {/* Avatar client */}
                  <div className={cn(
                    "h-16 w-16 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg",
                    "bg-gradient-to-br from-primary to-primary/80"
                  )}>
                    {devisData.client?.nom?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold">{devisData.client?.nom}</h3>
                      {devisData.client?.type && (
                        <Badge variant="outline" className="mt-1">{devisData.client.type}</Badge>
                      )}
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      {devisData.client?.email && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 text-sm">@</span>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="font-medium">{devisData.client.email}</p>
                          </div>
                        </div>
                      )}
                      {devisData.client?.telephone && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="text-emerald-600 text-sm">📞</span>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Téléphone</p>
                            <p className="font-medium">{devisData.client.telephone}</p>
                          </div>
                        </div>
                      )}
                      {(devisData.client?.adresse || devisData.client?.ville) && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 md:col-span-2">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Adresse</p>
                            <p className="font-medium">
                              {[devisData.client.adresse, devisData.client.ville].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historique" className="mt-6">
            <DevisTimeline devis={devisData} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
