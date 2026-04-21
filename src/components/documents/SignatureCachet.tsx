import cachetImg from "@/assets/cachet-logistiga.png";
import signatureImg from "@/assets/signature-direction.png";

interface SignatureCachetProps {
  className?: string;
  compact?: boolean;
}

/**
 * Affiche le cachet officiel et la signature de la direction
 * pour les documents officiels (Devis, Factures, Ordres de Travail).
 * Positionné à droite, sous la zone des totaux.
 */
export function SignatureCachet({ className = "", compact = false }: SignatureCachetProps) {
  const boxW = compact ? 140 : 170;
  const boxH = compact ? 110 : 135;
  return (
    <div
      className={className}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "flex-end",
        marginTop: 12,
        marginBottom: 8,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: 9,
            fontWeight: 600,
            margin: 0,
            marginBottom: 4,
            color: "#374151",
          }}
        >
          Signature et cachet
        </p>
        <div
          style={{
            position: "relative",
            display: "inline-block",
            width: boxW,
            height: boxH,
          }}
        >
          {/* Cachet officiel */}
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
              opacity: 0.92,
              pointerEvents: "none",
            }}
          />
          {/* Signature superposée au centre du cachet */}
          <img
            src={signatureImg}
            alt="Signature Direction"
            crossOrigin="anonymous"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -55%)",
              height: boxH * 0.85,
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
