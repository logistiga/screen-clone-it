import { Badge } from "@/components/ui/badge";
import { Ban, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export const getStatutBadge = (statut: string) => {
  switch (statut.toLowerCase()) {
    case 'actif': return <Badge className="bg-primary/10 text-primary border-primary/20">Actif</Badge>;
    case 'soldé': case 'solde': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Soldé</Badge>;
    case 'en défaut': case 'en_defaut': return <Badge variant="destructive">En défaut</Badge>;
    case 'annulé': case 'annule': return <Badge className="bg-muted text-muted-foreground border-muted"><Ban className="h-3 w-3 mr-1" />Annulé</Badge>;
    default: return <Badge variant="outline">{statut}</Badge>;
  }
};

export const getEcheanceStatutBadge = (statut: string, joursRetard?: number) => {
  switch (statut.toLowerCase()) {
    case 'payée': case 'payee': return <Badge className="bg-emerald-500/10 text-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />Payée</Badge>;
    case 'en attente': case 'a_payer': return <Badge variant="outline" className="border-amber-400 text-amber-600"><Clock className="h-3 w-3 mr-1" />À payer</Badge>;
    case 'en retard': return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />{joursRetard ? `${joursRetard}j retard` : 'En retard'}</Badge>;
    default: return <Badge variant="outline">{statut}</Badge>;
  }
};

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};
