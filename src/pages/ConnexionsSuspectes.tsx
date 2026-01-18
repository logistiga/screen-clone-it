import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldX, 
  Smartphone, 
  Globe, 
  MapPin,
  Clock,
  User,
  RefreshCw,
  Filter
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getSuspiciousLogins, type SuspiciousLogin, type SuspiciousLoginStats } from "@/lib/suspicious-logins";

const StatusBadge = ({ status }: { status: SuspiciousLogin['status'] }) => {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          En attente
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Approuvée
        </Badge>
      );
    case 'blocked':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <ShieldX className="h-3 w-3 mr-1" />
          Bloquée
        </Badge>
      );
    default:
      return null;
  }
};

const ReasonBadge = ({ reason }: { reason: string }) => {
  const isMobile = reason.toLowerCase().includes('mobile');
  const isForeign = reason.toLowerCase().includes('hors gabon') || reason.toLowerCase().includes('étranger');
  const isNewIp = reason.toLowerCase().includes('nouvelle');

  if (isMobile) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Smartphone className="h-3 w-3 mr-1" />
        Mobile
      </Badge>
    );
  }
  if (isForeign) {
    return (
      <Badge variant="destructive" className="text-xs">
        <Globe className="h-3 w-3 mr-1" />
        Étranger
      </Badge>
    );
  }
  if (isNewIp) {
    return (
      <Badge variant="outline" className="text-xs">
        <MapPin className="h-3 w-3 mr-1" />
        Nouvelle IP
      </Badge>
    );
  }
  return <Badge variant="outline" className="text-xs">{reason}</Badge>;
};

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: number; 
  icon: React.ElementType; 
  color: string;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function ConnexionsSuspectes() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['suspicious-logins', statusFilter],
    queryFn: () => getSuspiciousLogins({ 
      status: statusFilter !== 'all' ? statusFilter : undefined 
    }),
  });

  const logins = data?.data || [];
  const stats: SuspiciousLoginStats = data?.stats || {
    total: 0,
    pending: 0,
    approved: 0,
    blocked: 0,
    last_24h: 0,
  };

  return (
    <MainLayout title="Connexions suspectes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
              Connexions suspectes
            </h1>
            <p className="text-muted-foreground">
              Historique des connexions nécessitant une validation
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            title="Total" 
            value={stats.total} 
            icon={Shield} 
            color="bg-slate-500" 
          />
          <StatCard 
            title="En attente" 
            value={stats.pending} 
            icon={Clock} 
            color="bg-yellow-500" 
          />
          <StatCard 
            title="Approuvées" 
            value={stats.approved} 
            icon={ShieldCheck} 
            color="bg-green-500" 
          />
          <StatCard 
            title="Bloquées" 
            value={stats.blocked} 
            icon={ShieldX} 
            color="bg-red-500" 
          />
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Filtres</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvées</SelectItem>
                    <SelectItem value="blocked">Bloquées</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historique</CardTitle>
            <CardDescription>
              {stats.last_24h > 0 && (
                <span className="text-yellow-600">
                  {stats.last_24h} connexion(s) suspecte(s) dans les dernières 24h
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                Erreur lors du chargement des données
              </div>
            ) : logins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune connexion suspecte enregistrée</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>IP / Localisation</TableHead>
                      <TableHead>Raisons</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logins.map((login) => (
                      <TableRow key={login.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm">
                            {format(new Date(login.created_at), "dd MMM yyyy", { locale: fr })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(login.created_at), "HH:mm", { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {login.user?.nom || 'Utilisateur inconnu'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {login.user?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-mono">{login.ip_address}</div>
                          <div className="text-xs text-muted-foreground">
                            {[login.city, login.country_name].filter(Boolean).join(', ') || 'Localisation inconnue'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {login.reasons?.map((reason, idx) => (
                              <ReasonBadge key={idx} reason={reason} />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={login.status} />
                          {login.reviewed_at && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {format(new Date(login.reviewed_at), "dd/MM HH:mm", { locale: fr })}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
