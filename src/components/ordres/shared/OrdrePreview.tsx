import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Ship, User, Container, Package, Truck, FileText, 
  Calendar, Hash, Warehouse, RotateCcw, MapPin 
} from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { getCategoriesLabels, CategorieDocument } from "@/types/documents";

interface OrdrePreviewProps {
  categorie: CategorieDocument | "";
  client?: { id: number; nom: string } | null;
  montantHT: number;
  tva: number;
  css: number;
  montantTTC: number;
  numeroBL?: string;
  typeOperation?: string;
  typeOperationIndep?: string;
  conteneurs?: { numero: string; taille: string }[];
  lots?: { description: string; quantite: number }[];
  prestations?: { description: string; quantite: number }[];
  notes?: string;
}

export function OrdrePreview({
  categorie,
  client,
  montantHT,
  tva,
  css,
  montantTTC,
  numeroBL,
  typeOperation,
  typeOperationIndep,
  conteneurs = [],
  lots = [],
  prestations = [],
  notes,
}: OrdrePreviewProps) {
  const categoriesLabels = getCategoriesLabels();

  const getCategorieConfig = () => {
    switch (categorie) {
      case "conteneurs":
        return { 
          icon: <Container className="h-5 w-5" />, 
          color: "bg-blue-500/10 text-blue-600 border-blue-200" 
        };
      case "conventionnel":
        return { 
          icon: <Ship className="h-5 w-5" />, 
          color: "bg-purple-500/10 text-purple-600 border-purple-200" 
        };
      case "operations_independantes":
        return { 
          icon: <Truck className="h-5 w-5" />, 
          color: "bg-green-500/10 text-green-600 border-green-200" 
        };
      default:
        return { icon: <Package className="h-5 w-5" />, color: "bg-muted" };
    }
  };

  const getTypeIndepIcon = () => {
    switch (typeOperationIndep) {
      case "transport": return <Truck className="h-4 w-4" />;
      case "manutention": return <Package className="h-4 w-4" />;
      case "stockage": return <Warehouse className="h-4 w-4" />;
      case "location": return <Calendar className="h-4 w-4" />;
      case "double_relevage": return <RotateCcw className="h-4 w-4" />;
      default: return null;
    }
  };

  const config = getCategorieConfig();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="sticky top-4"
    >
      <Card className="overflow-hidden border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Prévisualisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Catégorie */}
          {categorie && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Catégorie
              </span>
              <Badge className={`${config.color} flex items-center gap-2 w-fit py-1.5 px-3`}>
                {config.icon}
                <span>{categoriesLabels[categorie]?.label}</span>
              </Badge>
              {typeOperation && (
                <Badge variant="outline" className="ml-2">
                  {typeOperation}
                </Badge>
              )}
              {typeOperationIndep && (
                <Badge variant="outline" className="ml-2 flex items-center gap-1 w-fit">
                  {getTypeIndepIcon()}
                  <span className="capitalize">{typeOperationIndep.replace("_", " ")}</span>
                </Badge>
              )}
            </motion.div>
          )}

          <Separator />

          {/* Client */}
          {client && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Client
              </span>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">{client.nom}</span>
              </div>
            </motion.div>
          )}

          {/* BL */}
          {numeroBL && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-2"
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                N° BL
              </span>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{numeroBL}</span>
              </div>
            </motion.div>
          )}

          {/* Conteneurs */}
          {conteneurs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Conteneurs ({conteneurs.length})
              </span>
              <div className="space-y-1.5">
                {conteneurs.slice(0, 3).map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-md p-2">
                    <Container className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono text-xs">{c.numero || `Conteneur ${i + 1}`}</span>
                    <Badge variant="outline" className="text-xs ml-auto">{c.taille}</Badge>
                  </div>
                ))}
                {conteneurs.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{conteneurs.length - 3} autre(s)
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Lots */}
          {lots.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Lots ({lots.length})
              </span>
              <div className="space-y-1.5">
                {lots.slice(0, 3).map((l, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-md p-2">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate flex-1">{l.description || `Lot ${i + 1}`}</span>
                    <Badge variant="outline" className="text-xs">x{l.quantite}</Badge>
                  </div>
                ))}
                {lots.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{lots.length - 3} autre(s)
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Prestations */}
          {prestations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Prestations ({prestations.length})
              </span>
              <div className="space-y-1.5">
                {prestations.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 rounded-md p-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate flex-1">{p.description || `Prestation ${i + 1}`}</span>
                    <Badge variant="outline" className="text-xs">x{p.quantite}</Badge>
                  </div>
                ))}
                {prestations.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{prestations.length - 3} autre(s)
                  </span>
                )}
              </div>
            </motion.div>
          )}

          <Separator />

          {/* Totaux */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-3"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Montants
            </span>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant HT</span>
                <span className="font-medium">{formatMontant(montantHT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA</span>
                <span>{formatMontant(tva)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CSS</span>
                <span>{formatMontant(css)}</span>
              </div>
              <Separator />
              <motion.div 
                className="flex justify-between text-lg font-bold"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span>Total TTC</span>
                <span className="text-primary">{formatMontant(montantTTC)}</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Notes */}
          {notes && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Notes
              </span>
              <p className="text-sm text-muted-foreground line-clamp-3 italic">
                {notes}
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
