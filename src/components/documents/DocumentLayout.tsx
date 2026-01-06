import logoLojistiga from "@/assets/lojistiga-logo.png";

interface DocumentHeaderProps {
  title: string;
  numero: string;
  dateLabel?: string;
  date: string;
  secondaryLabel?: string;
  secondaryValue?: string;
  tertiaryLabel?: string;
  tertiaryValue?: string;
}

export function DocumentHeader({ 
  title, 
  numero, 
  dateLabel = "Date",
  date,
  secondaryLabel,
  secondaryValue,
  tertiaryLabel,
  tertiaryValue
}: DocumentHeaderProps) {
  return (
    <div className="text-center mb-8">
      {/* Logo centré en grand format */}
      <div className="flex justify-center mb-6">
        <img src={logoLojistiga} alt="LOGISTIGA" className="h-24 w-auto" />
      </div>
      
      {/* Titre du document */}
      <h1 className="text-3xl font-bold text-primary mb-2">{title}</h1>
      <p className="text-xl font-semibold mb-4">{numero}</p>
      
      {/* Informations du document */}
      <div className="flex justify-center gap-6 text-sm text-muted-foreground">
        <span>{dateLabel}: <strong className="text-foreground">{date}</strong></span>
        {secondaryLabel && secondaryValue && (
          <span>{secondaryLabel}: <strong className="text-foreground">{secondaryValue}</strong></span>
        )}
        {tertiaryLabel && tertiaryValue && (
          <span>{tertiaryLabel}: <strong className="text-foreground">{tertiaryValue}</strong></span>
        )}
      </div>
    </div>
  );
}

export function DocumentFooter() {
  return (
    <div className="mt-8 pt-4 border-t">
      {/* Informations société */}
      <div className="text-center text-xs text-muted-foreground space-y-1">
        <p className="font-semibold text-foreground">
          LOGISTIGA SAS au Capital: 218 000 000 F CFA
        </p>
        <p>Siège Social : Owendo SETRAG – (GABON)</p>
        <p>
          Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03
        </p>
        <p>
          B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135
        </p>
        <p>
          Email: info@logistiga.com – Site web: www.logistiga.com
        </p>
        <div className="mt-2 pt-2 border-t border-dashed">
          <p className="font-medium">Coordonnées Bancaires</p>
          <p>Compte BGFI N°: 40003 04140 41041658011 78</p>
          <p>Compte UGB N°: 40002 00043 90000338691 84</p>
        </div>
      </div>
    </div>
  );
}

export function DocumentBankDetails() {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">COORDONNÉES BANCAIRES</h3>
      <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
        <div>
          <p className="font-medium">BGFI Bank Gabon</p>
          <p className="text-muted-foreground">Compte N°: 40003 04140 41041658011 78</p>
        </div>
        <div>
          <p className="font-medium">UGB</p>
          <p className="text-muted-foreground">Compte N°: 40002 00043 90000338691 84</p>
        </div>
      </div>
    </div>
  );
}
