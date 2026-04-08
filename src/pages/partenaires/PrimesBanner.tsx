import { Card } from "@/components/ui/card";
import { Banknote, Truck, User } from "lucide-react";
import { formatMontant } from "@/data/mockData";

interface PrimesBannerProps {
  totalPrimesAPayer: number;
  primesTransitaires: number;
  primesRepresentants: number;
}

export function PrimesBanner({ totalPrimesAPayer, primesTransitaires, primesRepresentants }: PrimesBannerProps) {
  if (totalPrimesAPayer <= 0) return null;

  return (
    <div className="sticky top-0 z-10">
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <Banknote className="h-6 w-6 text-white" />
              </div>
              <div className="text-white">
                <p className="font-semibold text-lg">Primes à payer</p>
                <div className="flex items-center gap-4 text-sm text-white/90">
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4" />
                    Transitaires: {formatMontant(primesTransitaires)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    Représentants: {formatMontant(primesRepresentants)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{formatMontant(totalPrimesAPayer)}</p>
              <p className="text-sm text-white/80">Montant total</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
