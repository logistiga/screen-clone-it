import cachetImg from "@/assets/cachet-logistiga.png";
import signatureImg from "@/assets/signature-direction.png";

interface SignatureCachetProps {
  className?: string;
  compact?: boolean;
}

/**
 * Affiche le cachet officiel et la signature de la direction
 * pour les documents officiels (Devis, Factures, Ordres de Travail).
 */
export function SignatureCachet({ className = "", compact = false }: SignatureCachetProps) {
  const size = compact ? "h-16" : "h-20";
  return (
    <div className={`flex justify-end mt-3 mb-2 ${className}`}>
      <div className="text-center">
        <p className="text-[8px] font-semibold text-muted-foreground mb-1">
          Signature et cachet
        </p>
        <div className="relative inline-block" style={{ width: compact ? 110 : 130, height: compact ? 80 : 95 }}>
          {/* Cachet en arrière-plan */}
          <img
            src={cachetImg}
            alt="Cachet Logistiga"
            className={`absolute inset-0 m-auto ${size} object-contain opacity-90`}
            style={{ left: 0, right: 0, top: 0, bottom: 0 }}
          />
          {/* Signature par-dessus, légèrement décalée */}
          <img
            src={signatureImg}
            alt="Signature Direction"
            className={`absolute ${size} object-contain`}
            style={{ left: "35%", top: "10%" }}
          />
        </div>
      </div>
    </div>
  );
}
