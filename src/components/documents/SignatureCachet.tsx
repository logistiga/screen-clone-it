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
  const boxW = compact ? 160 : 200;
  const boxH = compact ? 110 : 140;
  return (
    <div className={`flex justify-end mt-4 mb-2 ${className}`}>
      <div className="text-center">
        <p className="text-[9px] font-semibold text-foreground mb-1">
          Signature et cachet
        </p>
        <div
          className="relative inline-block"
          style={{ width: boxW, height: boxH }}
        >
          {/* Cachet officiel — fond, centré */}
          <img
            src={cachetImg}
            alt="Cachet Logistiga"
            crossOrigin="anonymous"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              height: boxH,
              width: "auto",
              objectFit: "contain",
              opacity: 0.95,
              pointerEvents: "none",
            }}
          />
          {/* Signature — par-dessus, légèrement décalée */}
          <img
            src={signatureImg}
            alt="Signature Direction"
            crossOrigin="anonymous"
            style={{
              position: "absolute",
              top: "8%",
              left: "30%",
              height: boxH * 0.85,
              width: "auto",
              objectFit: "contain",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
