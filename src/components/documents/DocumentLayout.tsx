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
    <div className="text-center mb-4">
      {/* Logo centré */}
      <div className="flex justify-center mb-3">
        <img src={logoLojistiga} alt="LOGISTIGA" className="h-16 w-auto" />
      </div>
      
      {/* Titre du document */}
      <h1 className="text-2xl font-bold text-primary mb-1">{title}</h1>
      <p className="text-base font-semibold mb-2">{numero}</p>
      
      {/* Informations du document */}
      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
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
    <div className="mt-4 pt-3 border-t text-[10px] text-muted-foreground">
      <div className="text-center space-y-0.5">
        <p className="font-semibold text-foreground text-xs">
          LOGISTIGA SAS au Capital: 218 000 000 F CFA - Siège Social : Owendo SETRAG – (GABON)
        </p>
        <p>
          Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03 | B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135
        </p>
        <p>
          Email: info@logistiga.com – Site web: www.logistiga.com
        </p>
        <p className="pt-1 border-t border-dashed mt-1">
          BGFI N°: 40003 04140 41041658011 78 | UGB N°: 40002 00043 90000338691 84
        </p>
      </div>
    </div>
  );
}

export function DocumentBankDetails() {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold text-muted-foreground mb-2">COORDONNÉES BANCAIRES</h3>
      <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded">
        <div>
          <p className="font-medium">BGFI Bank Gabon</p>
          <p className="text-muted-foreground">N°: 40003 04140 41041658011 78</p>
        </div>
        <div>
          <p className="font-medium">UGB</p>
          <p className="text-muted-foreground">N°: 40002 00043 90000338691 84</p>
        </div>
      </div>
    </div>
  );
}
