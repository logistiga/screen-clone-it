import { useNavigate } from "react-router-dom";
import { roundMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell } from "@/components/ui/table";
import { AnimatedTableRow } from "@/components/ui/animated-table";
import {
  Eye, Edit, ArrowRight, Wallet, Ban, Trash2, Download,
  Mail, MessageCircle, Check, RotateCcw,
} from "lucide-react";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { getStatutBadge, getTypeBadge } from "./ordres-helpers";

interface OrdreTableRowProps {
  ordre: any;
  index: number;
  onConfirmAction: (action: { type: "supprimer" | "facturer"; id: string; numero: string }) => void;
  onPaiement: (data: any) => void;
  onAnnulationPaiement: (data: { id: string; numero: string }) => void;
  onAnnulation: (data: { id: number; numero: string }) => void;
  onEmail: (ordre: any) => void;
  onWhatsApp: (ordre: any) => void;
}

export function OrdreTableRow({
  ordre, index, onConfirmAction, onPaiement,
  onAnnulationPaiement, onAnnulation, onEmail, onWhatsApp,
}: OrdreTableRowProps) {
  const navigate = useNavigate();
  const resteAPayer = roundMoney((ordre.montant_ttc || 0) - (ordre.montant_paye || 0));

  return (
    <AnimatedTableRow key={ordre.id} index={index} className="cursor-pointer">
      <TableCell
        className="font-medium text-primary hover:underline cursor-pointer"
        onClick={() => navigate(`/ordres/${ordre.id}`)}
      >
        {ordre.numero}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
            {ordre.client?.nom?.substring(0, 2).toUpperCase() || "??"}
          </div>
          <span className="truncate max-w-[150px]">{ordre.client?.nom}</span>
        </div>
      </TableCell>
      <TableCell>{formatDate(ordre.date || ordre.created_at)}</TableCell>
      <TableCell>{getTypeBadge(ordre)}</TableCell>
      <TableCell className="text-right font-medium">{formatMontant(ordre.montant_ttc)}</TableCell>
      <TableCell className="text-right">
        <span className={(ordre.montant_paye || 0) > 0 ? "text-emerald-600 dark:text-emerald-400" : ""}>
          {formatMontant(ordre.montant_paye)}
        </span>
        {resteAPayer > 0 && ordre.statut !== "facture" && (
          <div className="text-xs text-destructive">Reste: {formatMontant(resteAPayer)}</div>
        )}
      </TableCell>
      <TableCell>{getStatutBadge(ordre.statut)}</TableCell>
      <TableCell>
        {ordre.categorie === "conteneurs" ? (
          ordre.logistiga_synced_at ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
              <Check className="h-3 w-3 mr-1" />
              Envoyé
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
              En attente
            </Badge>
          )
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {ordre.facture?.numero ? (
          <span
            className="text-sm font-medium text-blue-600 hover:underline cursor-pointer"
            onClick={() => navigate(`/factures/${ordre.facture.id}`)}
          >
            {ordre.facture.numero}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Voir" onClick={() => navigate(`/ordres/${ordre.id}`)} className="transition-all duration-200 hover:scale-110 hover:bg-primary/10">
            <Eye className="h-4 w-4" />
          </Button>
          {ordre.statut !== "annule" && (
            <Button variant="ghost" size="icon" title="Modifier" onClick={() => navigate(`/ordres/${ordre.id}/modifier`)} className="transition-all duration-200 hover:scale-110 hover:bg-blue-500/10">
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {ordre.statut !== "facture" && ordre.statut !== "annule" && (
            <Button variant="ghost" size="icon" title="Convertir en facture" className="text-primary transition-all duration-200 hover:scale-110 hover:bg-primary/10" onClick={() => onConfirmAction({ type: "facturer", id: ordre.id, numero: ordre.numero })}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          {ordre.statut !== "facture" && ordre.statut !== "annule" && resteAPayer > 0 && (
            <Button variant="ghost" size="icon" title="Paiement" className="text-emerald-600 transition-all duration-200 hover:scale-110 hover:bg-emerald-500/10"
              onClick={() => onPaiement({
                id: ordre.id, numero: ordre.numero, montantRestant: resteAPayer,
                clientId: ordre.client_id ? Number(ordre.client_id) : undefined,
                montantHT: ordre.montant_ht || 0, montantDejaPaye: ordre.montant_paye || 0,
                exonereTva: ordre.exonere_tva || false, exonereCss: ordre.exonere_css || false,
              })}
            >
              <Wallet className="h-4 w-4" />
            </Button>
          )}
          {ordre.statut !== "annule" && (ordre.montant_paye || 0) > 0 && (
            <Button variant="ghost" size="icon" title="Annuler le paiement" className="text-amber-600 transition-all duration-200 hover:scale-110 hover:bg-amber-500/10" onClick={() => onAnnulationPaiement({ id: ordre.id, numero: ordre.numero })}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" title="Télécharger PDF" onClick={() => navigate(`/ordres/${ordre.id}/pdf`)} className="text-primary transition-all duration-200 hover:scale-110 hover:bg-primary/10">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Email" className="text-blue-600 transition-all duration-200 hover:scale-110 hover:bg-blue-500/10" onClick={() => onEmail(ordre)}>
            <Mail className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="WhatsApp" className="text-emerald-600 transition-all duration-200 hover:scale-110 hover:bg-emerald-500/10" onClick={() => onWhatsApp(ordre)}>
            <MessageCircle className="h-4 w-4" />
          </Button>
          {ordre.statut !== "annule" && ordre.statut !== "facture" && (
            <Button variant="ghost" size="icon" title="Annuler" className="text-orange-600 transition-all duration-200 hover:scale-110 hover:bg-orange-500/10" onClick={() => onAnnulation({ id: Number(ordre.id), numero: ordre.numero })}>
              <Ban className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" title="Supprimer" className="text-destructive transition-all duration-200 hover:scale-110 hover:bg-red-500/10" onClick={() => onConfirmAction({ type: "supprimer", id: ordre.id, numero: ordre.numero })}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </AnimatedTableRow>
  );
}
