import cachetSignatureImg from "@/assets/cachet-signature.png";

interface SignatureCachetProps {
  className?: string;
  compact?: boolean;
  inline?: boolean;
  /** Petit cachet (max ~100px) à placer en haut à gauche du bloc Conditions de paiement */
  leftBlock?: boolean;
  size?: number;
}

/**
 * Affiche le cachet officiel + signature combinés (image unique)
 * pour les documents officiels (Devis, Factures, Ordres de Travail).
 * - Par défaut : bloc aligné à droite (legacy).
 * - inline=true : s'intègre directement sous le bloc totaux (largeur du parent).
 */
export function SignatureCachet({ className = "", compact = false, inline = false, leftBlock = false, size = 150 }: SignatureCachetProps) {
  const boxW = compact ? 190 : 230;
  const boxH = compact ? 150 : 180;

  if (leftBlock) {
    return (
      <img
        src={cachetSignatureImg}
        alt="Cachet et signature Logistiga"
        crossOrigin="anonymous"
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          position: "absolute",
          top: 4,
          left: 4,
          zIndex: 10,
          pointerEvents: "none",
          filter: "contrast(1.08) saturate(1.08)",
        }}
      />
    );
  }

  if (inline) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          marginTop: 8,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "#374151",
            marginBottom: 4,
          }}
        >
          Signature et cachet
        </p>
        <img
          src={cachetSignatureImg}
          alt="Cachet et signature Logistiga"
          crossOrigin="anonymous"
          style={{
            width: "100%",
            maxWidth: 220,
            height: "auto",
            objectFit: "contain",
            display: "inline-block",
            filter: "contrast(1.08) saturate(1.08)",
          }}
        />
      </div>
    );
  }

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
