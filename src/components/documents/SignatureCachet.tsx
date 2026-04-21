import cachetSignatureImg from "@/assets/cachet-signature.png";

interface SignatureCachetProps {
  className?: string;
  compact?: boolean;
}

/**
 * Affiche le cachet officiel + signature combinés (image unique)
 * pour les documents officiels (Devis, Factures, Ordres de Travail).
 * Positionné à droite, en valeur, près des conditions de paiement.
 */
export function SignatureCachet({ className = "", compact = false }: SignatureCachetProps) {
  const boxW = compact ? 190 : 255;
  const boxH = compact ? 150 : 200;
  return (
    <div
      className={className}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "flex-start",
        marginTop: 10,
        marginBottom: 10,
      }}
    >
      <div style={{ width: boxW, height: boxH, textAlign: "right" }}>
        <img
          src={cachetSignatureImg}
          alt="Cachet et signature Logistiga"
          crossOrigin="anonymous"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
            objectPosition: "right center",
            filter: "contrast(1.08) saturate(1.08)",
          }}
        />
      </div>
    </div>
  );
}
