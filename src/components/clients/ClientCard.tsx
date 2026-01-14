import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientAvatar } from "./ClientAvatar";
import { ClientHealthBadge } from "./ClientHealthBadge";
import { MapPin, Mail, Phone, Eye, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Client } from "@/lib/api/commercial";

interface ClientCardProps {
  client: Client;
  onEdit?: (id: number) => void;
  onDelete?: (client: Client) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' FCFA';
};

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const navigate = useNavigate();
  const solde = Number(client.solde) || 0;
  const avoirs = Number(client.solde_avoirs) || 0;
  
  return (
    <Card className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden">
      <CardContent className="p-4">
        {/* Header avec avatar */}
        <div className="flex items-start gap-3 mb-4">
          <ClientAvatar name={client.nom} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 
                className="font-semibold text-foreground truncate hover:text-primary transition-colors"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                {client.nom}
              </h3>
              <ClientHealthBadge solde={solde} />
            </div>
            {client.type && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {client.type}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Infos contact */}
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          {client.email && (
            <div className="flex items-center gap-2 truncate">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.telephone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{client.telephone}</span>
            </div>
          )}
          {client.ville && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{client.ville}{client.pays ? `, ${client.pays}` : ''}</span>
            </div>
          )}
        </div>
        
        {/* Stats financières */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Solde dû</p>
            <p className={`font-semibold ${solde > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {formatCurrency(solde)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avoirs</p>
            <p className="font-semibold text-blue-600 dark:text-blue-400">
              {formatCurrency(avoirs)}
            </p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => navigate(`/clients/${client.id}`)}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Voir
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit?.(client.id)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(client);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
