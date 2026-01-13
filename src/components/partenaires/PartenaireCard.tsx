import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PartenaireAvatar } from "./PartenaireAvatar";
import { Eye, Edit, Trash2, Mail, Phone, MapPin, Banknote } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface PartenaireCardProps {
  id: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  actif: boolean;
  primesAPayer?: number;
  type: "transitaire" | "representant" | "armateur";
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PartenaireCard({
  nom,
  prenom,
  email,
  telephone,
  adresse,
  actif,
  primesAPayer = 0,
  type,
  onView,
  onEdit,
  onDelete,
}: PartenaireCardProps) {
  const displayName = prenom ? `${prenom} ${nom}` : nom;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg hover:border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <PartenaireAvatar nom={nom} prenom={prenom} size="lg" />
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 
                  className="font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                  onClick={onView}
                >
                  {displayName}
                </h3>
                <Badge 
                  variant={actif ? "default" : "secondary"} 
                  className={cn(
                    "mt-1 text-xs",
                    actif && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                  )}
                >
                  {actif ? "Actif" : "Inactif"}
                </Badge>
              </div>
              
              {primesAPayer > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Banknote className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    {formatMontant(primesAPayer)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              {email && (
                <div className="flex items-center gap-2 truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>
              )}
              {telephone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{telephone}</span>
                </div>
              )}
              {adresse && (
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{adresse}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
          {onView && (
            <Button variant="ghost" size="sm" onClick={onView} className="gap-1.5">
              <Eye className="h-4 w-4" />
              Voir
            </Button>
          )}
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1.5">
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive gap-1.5">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
