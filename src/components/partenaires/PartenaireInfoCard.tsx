import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PartenaireAvatar } from "./PartenaireAvatar";
import { Mail, Phone, MapPin, Calendar, Percent } from "lucide-react";
import { formatDate } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface PartenaireInfoCardProps {
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  actif: boolean;
  createdAt?: string;
  tauxCommission?: number;
  nif?: string;
  rccm?: string;
  contactPrincipal?: string;
  type: "transitaire" | "representant" | "armateur";
}

export function PartenaireInfoCard({
  nom,
  prenom,
  email,
  telephone,
  adresse,
  actif,
  createdAt,
  tauxCommission,
  nif,
  rccm,
  contactPrincipal,
  type,
}: PartenaireInfoCardProps) {
  const displayName = prenom ? `${prenom} ${nom}` : nom;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex items-start gap-5">
          <PartenaireAvatar nom={nom} prenom={prenom} size="lg" className="h-16 w-16 text-xl" />
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
              <Badge 
                className={cn(
                  "text-xs",
                  actif 
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                {actif ? "Actif" : "Inactif"}
              </Badge>
            </div>
            
            {createdAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Partenaire depuis le {formatDate(createdAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-6 pt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            {email && (
              <div className="flex items-center gap-3 text-sm group">
                <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <a href={`mailto:${email}`} className="text-foreground hover:text-primary transition-colors">
                  {email}
                </a>
              </div>
            )}
            
            {telephone && (
              <div className="flex items-center gap-3 text-sm group">
                <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <Phone className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <a href={`tel:${telephone}`} className="text-foreground hover:text-primary transition-colors">
                  {telephone}
                </a>
              </div>
            )}
            
            {adresse && (
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 rounded-lg bg-muted">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground">{adresse}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {type === "representant" && tauxCommission !== undefined && (
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Percent className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <span className="text-muted-foreground">Commission: </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{tauxCommission}%</span>
                </div>
              </div>
            )}

            {type === "transitaire" && contactPrincipal && (
              <div className="text-sm">
                <span className="text-muted-foreground">Contact principal: </span>
                <span className="font-medium">{contactPrincipal}</span>
              </div>
            )}

            {type === "transitaire" && (nif || rccm) && (
              <div className="flex flex-wrap gap-4 text-sm">
                {nif && (
                  <div>
                    <span className="text-muted-foreground">NIF: </span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{nif}</span>
                  </div>
                )}
                {rccm && (
                  <div>
                    <span className="text-muted-foreground">RCCM: </span>
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{rccm}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PartenaireInfoCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex items-start gap-5">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
      <CardContent className="p-6 pt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
