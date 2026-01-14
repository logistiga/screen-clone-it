import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientAvatar } from "./ClientAvatar";
import { ClientHealthBadge } from "./ClientHealthBadge";
import { 
  ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, Calendar,
  MoreHorizontal, FileText, Receipt, ClipboardList, MessageCircle,
  Download, History, Merge, QrCode
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Client } from "@/lib/api/commercial";
import { formatDate } from "@/data/mockData";
import { usePdfDownload } from "@/hooks/use-pdf-download";

interface ClientDetailHeaderProps {
  client: Client;
  onDelete: () => void;
  onEmail?: () => void;
}

export function ClientDetailHeader({ client, onDelete, onEmail }: ClientDetailHeaderProps) {
  const navigate = useNavigate();
  const solde = Number(client.solde) || 0;
  const { downloadPdf } = usePdfDownload({ filename: `client-${client.nom}.pdf` });
  
  // Calculer l'ancienneté du client
  const getClientAge = () => {
    if (!client.created_at) return null;
    const created = new Date(client.created_at);
    const now = new Date();
    const diffYears = now.getFullYear() - created.getFullYear();
    const diffMonths = now.getMonth() - created.getMonth();
    const totalMonths = diffYears * 12 + diffMonths;
    
    if (totalMonths < 1) return "Nouveau";
    if (totalMonths < 12) return `${totalMonths} mois`;
    if (diffYears === 1) return "1 an";
    return `${diffYears} ans`;
  };

  const clientAge = getClientAge();

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border shadow-sm">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="relative p-6">
        {/* Top row - Back button and actions */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 hover:bg-white/50 dark:hover:bg-black/20">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 bg-white/80 dark:bg-black/20 backdrop-blur-sm"
              onClick={downloadPdf}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Télécharger PDF</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 bg-white/80 dark:bg-black/20 backdrop-blur-sm"
              onClick={() => navigate(`/clients/${client.id}/modifier`)}
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline">Modifier</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/80 dark:bg-black/20 backdrop-blur-sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate(`/devis/nouveau?client=${client.id}`)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Nouveau devis
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/ordres/nouveau?client=${client.id}`)}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Nouvel ordre
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/factures/nouvelle?client=${client.id}`)}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Nouvelle facture
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {onEmail && (
                  <DropdownMenuItem onClick={onEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer un email
                  </DropdownMenuItem>
                )}
                {client.telephone && (
                  <DropdownMenuItem onClick={() => window.open(`https://wa.me/${client.telephone.replace(/[^0-9]/g, '')}`, '_blank')}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {}}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter relevé
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                  <History className="h-4 w-4 mr-2" />
                  Historique complet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Générer QR Code
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Main content - Avatar + Info */}
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <ClientAvatar name={client.nom} size="xl" className="shadow-lg ring-4 ring-white dark:ring-gray-800" />
          
          {/* Client Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{client.nom}</h1>
              <ClientHealthBadge solde={solde} showLabel />
            </div>
            
            {/* Contact line */}
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{client.email}</span>
                </a>
              )}
              {client.telephone && (
                <a href={`tel:${client.telephone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{client.telephone}</span>
                </a>
              )}
              {(client.ville || client.pays) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">
                    {[client.ville, client.pays].filter(Boolean).join(', ')}
                  </span>
                </span>
              )}
            </div>
            
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {clientAge && (
                <Badge variant="secondary" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  Client depuis {clientAge}
                </Badge>
              )}
              {client.type && (
                <Badge variant="outline">{client.type}</Badge>
              )}
              {client.limite_credit && Number(client.limite_credit) > 0 && (
                <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400">
                  Plafond: {new Intl.NumberFormat('fr-FR').format(Number(client.limite_credit))} FCFA
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick actions for mobile */}
        <div className="flex gap-2 mt-6 sm:hidden">
          <Button 
            size="sm" 
            className="flex-1 gap-2"
            onClick={() => navigate(`/devis/nouveau?client=${client.id}`)}
          >
            <FileText className="h-4 w-4" />
            Devis
          </Button>
          <Button 
            size="sm" 
            variant="secondary"
            className="flex-1 gap-2"
            onClick={() => navigate(`/factures/nouvelle?client=${client.id}`)}
          >
            <Receipt className="h-4 w-4" />
            Facture
          </Button>
          {client.telephone && (
            <Button 
              size="sm" 
              variant="outline"
              className="gap-2"
              onClick={() => window.open(`https://wa.me/${client.telephone.replace(/[^0-9]/g, '')}`, '_blank')}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
