import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  Edit,
  ArrowRight,
  Wallet,
  Loader2,
  Download,
} from "lucide-react";
import { formatDate } from "@/data/mockData";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import {
  typeIndepConfigs,
  typeConteneurConfigs,
  getStatutConfig,
  getTypeFromLignes,
  Container,
  Ship,
  Truck,
} from "./ordreTypeConfigs";

interface OrdreHeaderProps {
  ordre: any;
  id: string;
  resteAPayer: number;
  onPaiementClick: () => void;
  onConvertClick: () => void;
  isConverting: boolean;
}

export function OrdreHeader({
  ordre,
  id,
  resteAPayer,
  onPaiementClick,
  onConvertClick,
  isConverting,
}: OrdreHeaderProps) {
  const navigate = useNavigate();
  const statutConfig = getStatutConfig(ordre.statut);
  const { downloadPdf } = usePdfDownload({ filename: `ordre-${ordre.numero}.pdf` });

  const getTypeBadge = () => {
    const { categorie, type_operation, type_operation_indep } = ordre;

    if (categorie === 'conteneurs') {
      const typeOp = type_operation?.toLowerCase() || '';
      if (typeOp.includes('import') || typeOp === 'import') {
        const config = typeConteneurConfigs.import;
        const IconComponent = config.icon;
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 font-medium`}>
            <IconComponent className="h-3.5 w-3.5" />
            <span>Conteneurs / Import</span>
          </Badge>
        );
      }
      if (typeOp.includes('export') || typeOp === 'export') {
        const config = typeConteneurConfigs.export;
        const IconComponent = config.icon;
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 font-medium`}>
            <IconComponent className="h-3.5 w-3.5" />
            <span>Conteneurs / Export</span>
          </Badge>
        );
      }
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 flex items-center gap-1.5 font-medium">
          <Container className="h-3.5 w-3.5" />
          Conteneurs
        </Badge>
      );
    }

    if (categorie === 'operations_independantes') {
      let typeIndep = type_operation_indep?.toLowerCase() || type_operation?.toLowerCase() || '';
      if (!typeIndep || !typeIndepConfigs[typeIndep]) {
        typeIndep = getTypeFromLignes(ordre);
      }
      const config = typeIndepConfigs[typeIndep];
      if (config) {
        const IconComponent = config.icon;
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 font-medium`}>
            <IconComponent className="h-3.5 w-3.5" />
            <span>Indépendant / {config.label}</span>
          </Badge>
        );
      }
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 flex items-center gap-1.5 font-medium">
          <Truck className="h-3.5 w-3.5" />
          Indépendant
        </Badge>
      );
    }

    if (categorie === 'conventionnel') {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 flex items-center gap-1.5 font-medium">
          <Ship className="h-3.5 w-3.5" />
          Conventionnel
        </Badge>
      );
    }

    return (
      <Badge className="bg-muted text-muted-foreground flex items-center gap-1.5">
        {ordre.type_document || categorie || 'N/A'}
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/50 backdrop-blur-sm p-4 rounded-lg border"
    >
      <div className="flex items-center gap-4">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </motion.div>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{ordre.numero}</h1>
            <Badge
              variant="outline"
              className={`${statutConfig.className} flex items-center gap-1`}
            >
              {statutConfig.icon && <statutConfig.icon className="h-3.5 w-3.5" />}
              {statutConfig.label}
            </Badge>
            {getTypeBadge()}
          </div>
          <p className="text-muted-foreground mt-1">
            Créé le {formatDate(ordre.date)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            className="gap-2"
            onClick={downloadPdf}
          >
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Button>
        </motion.div>
        {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
          <>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate(`/ordres/${id}/modifier`)}
              >
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
            </motion.div>
            {resteAPayer > 0 && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="gap-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  onClick={onPaiementClick}
                >
                  <Wallet className="h-4 w-4" />
                  Paiement
                </Button>
              </motion.div>
            )}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className="gap-2 shadow-md"
                onClick={onConvertClick}
                disabled={isConverting}
              >
                {isConverting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Facturer
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
