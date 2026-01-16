import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Unlock, Shield, AlertTriangle, Clock, Globe, Mail, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  getLockedAccounts,
  getLockoutStats,
  getLoginAttempts,
  unlockAccount,
  cleanupLockoutData,
  LockoutInfo,
  LoginAttempt,
  LockoutStats,
  AttemptStats,
} from '@/lib/lockout';

export function LockoutManager() {
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  // Requêtes
  const { data: lockedAccounts, isLoading: loadingAccounts } = useQuery({
    queryKey: ['locked-accounts'],
    queryFn: getLockedAccounts,
    refetchInterval: 30000, // Rafraîchir toutes les 30s
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['lockout-stats'],
    queryFn: getLockoutStats,
  });

  const { data: attemptsData, isLoading: loadingAttempts } = useQuery({
    queryKey: ['login-attempts', selectedEmail],
    queryFn: () => (selectedEmail ? getLoginAttempts(selectedEmail) : null),
    enabled: !!selectedEmail,
  });

  // Mutations
  const unlockMutation = useMutation({
    mutationFn: unlockAccount,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['locked-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['lockout-stats'] });
    },
    onError: () => {
      toast.error('Erreur lors du déblocage');
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: () => cleanupLockoutData(30),
    onSuccess: (data) => {
      toast.success(`${data.deleted_attempts} tentatives supprimées`);
      queryClient.invalidateQueries({ queryKey: ['lockout-stats'] });
    },
    onError: () => {
      toast.error('Erreur lors du nettoyage');
    },
  });

  const handleSearch = () => {
    if (searchEmail.includes('@')) {
      setSelectedEmail(searchEmail);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Comptes verrouillés"
          value={stats?.currently_locked ?? 0}
          icon={Lock}
          color="text-red-500"
          loading={loadingStats}
        />
        <StatsCard
          title="Tentatives aujourd'hui"
          value={stats?.today.total_attempts ?? 0}
          subtitle={`${stats?.today.failed_attempts ?? 0} échecs`}
          icon={Shield}
          color="text-blue-500"
          loading={loadingStats}
        />
        <StatsCard
          title="Taux de succès (jour)"
          value={`${stats?.today.success_rate ?? 100}%`}
          icon={AlertTriangle}
          color={
            (stats?.today.success_rate ?? 100) < 80
              ? 'text-red-500'
              : (stats?.today.success_rate ?? 100) < 95
                ? 'text-yellow-500'
                : 'text-green-500'
          }
          loading={loadingStats}
        />
        <StatsCard
          title="Cette semaine"
          value={stats?.this_week.total_attempts ?? 0}
          subtitle={`${stats?.this_week.failed_attempts ?? 0} échecs`}
          icon={Clock}
          color="text-purple-500"
          loading={loadingStats}
        />
      </div>

      <Tabs defaultValue="locked" className="space-y-4">
        <TabsList>
          <TabsTrigger value="locked">Comptes verrouillés</TabsTrigger>
          <TabsTrigger value="search">Recherche</TabsTrigger>
          <TabsTrigger value="top">Top échecs</TabsTrigger>
        </TabsList>

        {/* Comptes verrouillés */}
        <TabsContent value="locked">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Comptes actuellement verrouillés</CardTitle>
                <CardDescription>
                  {lockedAccounts?.total ?? 0} compte(s) bloqué(s)
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['locked-accounts'] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </CardHeader>
            <CardContent>
              {loadingAccounts ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : lockedAccounts?.lockouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun compte verrouillé
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <AnimatePresence>
                    {lockedAccounts?.lockouts.map((lockout) => (
                      <LockoutRow
                        key={lockout.id}
                        lockout={lockout}
                        onUnlock={() => unlockMutation.mutate(lockout.email)}
                        unlocking={unlockMutation.isPending}
                      />
                    ))}
                  </AnimatePresence>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recherche par email */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Rechercher un compte</CardTitle>
              <CardDescription>
                Voir l'historique des tentatives de connexion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="email@exemple.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>Rechercher</Button>
              </div>

              {selectedEmail && (
                <div className="space-y-4">
                  {loadingAttempts ? (
                    <div className="text-center py-8 text-muted-foreground">Chargement...</div>
                  ) : attemptsData ? (
                    <>
                      {/* Stats du compte */}
                      <div className="grid gap-2 md:grid-cols-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">Tentatives récentes</div>
                          <div className="text-xl font-bold">{attemptsData.stats.recent_attempts}</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">Échecs récents</div>
                          <div className="text-xl font-bold text-red-500">
                            {attemptsData.stats.recent_failures}
                          </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">Total échecs</div>
                          <div className="text-xl font-bold">{attemptsData.stats.total_failed_attempts}</div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">Statut</div>
                          <Badge variant={attemptsData.stats.is_locked ? 'destructive' : 'default'}>
                            {attemptsData.stats.is_locked ? 'Verrouillé' : 'Actif'}
                          </Badge>
                        </div>
                      </div>

                      {/* Liste des tentatives */}
                      <ScrollArea className="h-[300px] border rounded-lg">
                        <div className="p-2 space-y-1">
                          {attemptsData.attempts.map((attempt) => (
                            <AttemptRow key={attempt.id} attempt={attempt} />
                          ))}
                        </div>
                      </ScrollArea>
                    </>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top échecs */}
        <TabsContent value="top">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Top IPs (échecs)
                </CardTitle>
                <CardDescription>Cette semaine</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.top_failed_ips.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">Aucune donnée</div>
                ) : (
                  <div className="space-y-2">
                    {stats?.top_failed_ips.map((item, index) => (
                      <div
                        key={item.ip_address}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <span className="font-mono text-sm">{item.ip_address}</span>
                        <Badge variant="destructive">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Top Emails (échecs)
                </CardTitle>
                <CardDescription>Cette semaine</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.top_failed_emails.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">Aucune donnée</div>
                ) : (
                  <div className="space-y-2">
                    {stats?.top_failed_emails.map((item) => (
                      <div
                        key={item.email}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <span className="text-sm truncate max-w-[200px]">{item.email}</span>
                        <Badge variant="destructive">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action de nettoyage */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Maintenance</CardTitle>
              <CardDescription>Nettoyer les anciennes données de tentatives</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => cleanupMutation.mutate()}
                disabled={cleanupMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Nettoyer (+ de 30 jours)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  loading,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full bg-muted ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{loading ? '...' : value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LockoutRow({
  lockout,
  onUnlock,
  unlocking,
}: {
  lockout: LockoutInfo;
  onUnlock: () => void;
  unlocking: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center justify-between p-3 border-b last:border-0"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
          <Lock className="h-4 w-4 text-red-500" />
        </div>
        <div>
          <p className="font-medium">{lockout.email}</p>
          <p className="text-sm text-muted-foreground">
            {lockout.failed_attempts} tentatives • Expire dans {lockout.remaining_formatted}
          </p>
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={onUnlock} disabled={unlocking}>
        <Unlock className="h-4 w-4 mr-1" />
        Débloquer
      </Button>
    </motion.div>
  );
}

function AttemptRow({ attempt }: { attempt: LoginAttempt }) {
  const date = new Date(attempt.attempted_at);
  return (
    <div
      className={`flex items-center justify-between p-2 rounded text-sm ${
        attempt.successful ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
      }`}
    >
      <div className="flex items-center gap-2">
        <Badge variant={attempt.successful ? 'default' : 'destructive'} className="text-xs">
          {attempt.successful ? 'OK' : 'FAIL'}
        </Badge>
        <span className="font-mono text-xs">{attempt.ip_address}</span>
      </div>
      <span className="text-muted-foreground text-xs">
        {date.toLocaleDateString()} {date.toLocaleTimeString()}
      </span>
    </div>
  );
}
