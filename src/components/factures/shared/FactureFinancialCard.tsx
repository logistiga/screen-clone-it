import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Wallet, Percent, TrendingUp, CheckCircle2 } from "lucide-react";
import { formatMontant } from "@/data/mockData";

interface FactureFinancialCardProps {
  montantHT: number;
  montantTVA: number;
  montantCSS: number;
  montantTTC: number;
  montantPaye: number;
  resteAPayer: number;
  remiseType?: string | null;
  remiseValeur?: number;
  remiseMontant?: number;
}

export function FactureFinancialCard({
  montantHT,
  montantTVA,
  montantCSS,
  montantTTC,
  montantPaye,
  resteAPayer,
  remiseType,
  remiseValeur = 0,
  remiseMontant = 0,
}: FactureFinancialCardProps) {
  const hasRemise = remiseMontant > 0 && remiseType && remiseType !== 'none';
  const montantHTBrut = hasRemise ? montantHT + remiseMontant : montantHT;
  const paymentProgress = montantTTC > 0 ? (montantPaye / montantTTC) * 100 : 0;
  const isPaid = resteAPayer <= 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.3 }}
    >
      <Card className="h-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-green-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
            <div className="p-1.5 rounded-lg bg-green-500/10">
              <CreditCard className="h-4 w-4 text-green-600" />
            </div>
            Récapitulatif financier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amounts */}
          <div className="space-y-2">
            {hasRemise ? (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Montant HT brut</span>
                  <span className="font-medium">{formatMontant(montantHTBrut)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-red-600">
                  <span className="flex items-center gap-1.5">
                    <Percent className="h-3.5 w-3.5" />
                    Remise {remiseType === 'pourcentage' && remiseValeur ? `(${remiseValeur}%)` : ''}
                  </span>
                  <span className="font-medium">- {formatMontant(remiseMontant)}</span>
                </div>
              </>
            ) : null}
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Montant HT</span>
              <span className="font-semibold">{formatMontant(montantHT)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">TVA</span>
              <span>{formatMontant(montantTVA)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">CSS</span>
              <span>{formatMontant(montantCSS)}</span>
            </div>
          </div>

          {/* Total TTC - Highlighted */}
          <motion.div
            className="flex justify-between items-center py-3 px-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="font-bold text-sm">Total TTC</span>
            <span className="font-bold text-xl text-primary">{formatMontant(montantTTC)}</span>
          </motion.div>

          {/* Payment status */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" />
                Montant payé
              </span>
              <span className="text-green-600 font-semibold">{formatMontant(montantPaye)}</span>
            </div>
            
            {/* Progress bar */}
            <div className="space-y-1.5">
              <Progress 
                value={paymentProgress} 
                className="h-2 bg-muted"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(paymentProgress)}% payé</span>
                <span>{formatMontant(montantPaye)} / {formatMontant(montantTTC)}</span>
              </div>
            </div>

            {/* Remaining amount */}
            <motion.div 
              className={`flex justify-between items-center py-3 px-4 rounded-xl ${
                isPaid 
                  ? 'bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20' 
                  : 'bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20'
              }`}
              animate={!isPaid ? { scale: [1, 1.01, 1] } : {}}
              transition={{ repeat: !isPaid ? Infinity : 0, duration: 3 }}
            >
              <span className="font-semibold text-sm flex items-center gap-1.5">
                {isPaid ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                )}
                Reste à payer
              </span>
              <span className={`font-bold text-lg ${isPaid ? 'text-green-600' : 'text-red-600'}`}>
                {formatMontant(resteAPayer)}
              </span>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
