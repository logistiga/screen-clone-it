import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Wallet } from "lucide-react";
import { formatMontant } from "@/data/mockData";

interface OrdreFinancialCardProps {
  montantHT: number;
  montantTVA: number;
  montantCSS: number;
  montantTTC: number;
  montantPaye: number;
  resteAPayer: number;
}

export function OrdreFinancialCard({
  montantHT,
  montantTVA,
  montantCSS,
  montantTTC,
  montantPaye,
  resteAPayer,
}: OrdreFinancialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-500/5 to-transparent">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-green-600" />
            Récapitulatif financier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Montant HT</span>
            <span className="font-medium">{formatMontant(montantHT)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">TVA</span>
            <span>{formatMontant(montantTVA)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">CSS</span>
            <span>{formatMontant(montantCSS)}</span>
          </div>
          <Separator />
          <motion.div
            className="flex justify-between items-center text-lg"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span className="font-bold">Total TTC</span>
            <span className="font-bold text-primary text-xl">{formatMontant(montantTTC)}</span>
          </motion.div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1">
              <Wallet className="h-4 w-4" />
              Montant payé
            </span>
            <span className="text-green-600 font-medium">{formatMontant(montantPaye)}</span>
          </div>
          <div className="flex justify-between items-center font-semibold">
            <span>Reste à payer</span>
            <motion.span
              className={resteAPayer > 0 ? "text-destructive" : "text-green-600"}
              animate={resteAPayer > 0 ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: resteAPayer > 0 ? Infinity : 0, duration: 2 }}
            >
              {formatMontant(resteAPayer)}
            </motion.span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
