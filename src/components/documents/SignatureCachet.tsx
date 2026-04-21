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
  const boxW = compact ? 220 : 280;
  const boxH = compact ? 180 : 220;
  return (
    <div className={`flex justify-end mt-6 mb-4 ${className}`}>
      <div className="text-center">
        <p className="text-[10px] font-semibold text-foreground mb-2">
          Signature et cachet
        </p>
        <div
          className="relative inline-block"
          style={{ width: boxW, height: boxH }}
        >
          {/* Cachet officiel — grand, centré */}
          <img
            src={cachetImg}
            alt="Cachet Logistiga"
            crossOrigin="anonymous"
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              height: boxH,
              width: "auto",
              objectFit: "contain",
              opacity: 0.95,
              pointerEvents: "none",
            }}
          />
          {/* Signature — par-dessus, centrée sur le cachet */}
          <img
            src={signatureImg}
            alt="Signature Direction"
            crossOrigin="anonymous"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -55%)",
              height: boxH * 0.95,
              width: "auto",
              objectFit: "contain",
              pointerEvents: "none",
              mixBlendMode: "multiply",
            }}
          />
        </div>
      </div>
    </div>
  );
}
