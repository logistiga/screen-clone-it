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
  const boxW = compact ? 170 : 210;
  const boxH = compact ? 170 : 210;
  return (
    <div
      className={className}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "flex-end",
        marginTop: 16,
        marginBottom: 12,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            margin: 0,
            marginBottom: 6,
            color: "#374151",
            letterSpacing: 0.3,
          }}
        >
          Signature et cachet
        </p>
        <img
          src={cachetSignatureImg}
          alt="Cachet et signature Logistiga"
          crossOrigin="anonymous"
          style={{
            width: boxW,
            height: boxH,
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
