import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from "recharts";
import {
  FileText, TrendingUp, TrendingDown, Users, FileCheck,
  Receipt, Wallet, CreditCard, Calendar, BarChart3,
  PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { DocumentStatCard, DocumentStatCardSkeleton } from "@/components/shared/documents/DocumentStatCard";
import { DocumentEmptyState } from "@/components/shared/documents/DocumentEmptyState";

const COLORS = ["#E63946", "#4A4A4A", "#F4A261", "#2A9D8F", "#264653", "#8338EC", "#FF006E"];

const formatMontant = (montant: number | null | undefined): string => {
  const value = Number(montant);
  if (isNaN(value) || montant === null || montant === undefined) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value)) + ' FCFA';
};

// === CA Tab ===
interface CATabProps { loadingCA: boolean; evolutionMensuelle: any[]; chiffreAffaires: any; annee: number; }

export function ChiffreAffairesTab({ loadingCA, evolutionMensuelle, chiffreAffaires, annee }: CATabProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2 rounded-xl border shadow-sm overflow-hidden">
        <CardHeader className="pb-2 border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold"><Receipt className="h-4 w-4 text-primary" />Évolution mensuelle du CA</CardTitle>
          <CardDescription className="text-xs">Chiffre d'affaires TTC par mois en {annee}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {loadingCA ? <Skeleton className="h-[300px] w-full" /> : evolutionMensuelle.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center"><DocumentEmptyState icon={Receipt} title="Aucune donnée" description="Pas de données de chiffre d'affaires pour cette année" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={evolutionMensuelle}>
                <defs><linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="mois" className="text-xs" /><YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} className="text-xs" />
                <Tooltip formatter={(value: number) => formatMontant(value)} labelStyle={{ color: 'hsl(var(--foreground))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Area type="monotone" dataKey="ca" stroke="hsl(var(--primary))" fill="url(#colorCA)" name="CA TTC" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
      <Card className="rounded-xl border shadow-sm overflow-hidden">
        <CardHeader className="pb-2 border-b bg-muted/20"><CardTitle className="text-sm font-semibold">Récapitulatif Annuel</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-4">
          {loadingCA ? <Skeleton className="h-32 w-full" /> : (
            <>
              {[
                { label: "Total HT", value: chiffreAffaires?.total_annuel?.total_ht },
                { label: "TVA", value: chiffreAffaires?.total_annuel?.total_tva },
                { label: "CSS", value: chiffreAffaires?.total_annuel?.total_css },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-bold">{formatMontant(value || 0)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 bg-primary/10 rounded-lg px-3">
                <span className="font-semibold">Total TTC</span>
                <span className="font-bold text-primary">{formatMontant(chiffreAffaires?.total_annuel?.total_ttc || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-muted-foreground">Nombre de factures</span>
                <Badge variant="secondary">{chiffreAffaires?.total_annuel?.nb_factures || 0}</Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// === Créances Tab ===
interface CreancesTabProps { loadingCreances: boolean; dataCreancesParTranche: any[]; topDebiteurs: any[]; creances: any; }

export function CreancesTab({ loadingCreances, dataCreancesParTranche, topDebiteurs, creances }: CreancesTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <DocumentStatCard title="Total Créances" value={formatMontant(creances?.total_creances || 0)} icon={TrendingDown} variant="danger" delay={0} />
        <DocumentStatCard title="Factures Impayées" value={creances?.nb_factures_impayees || 0} icon={FileCheck} variant="warning" delay={0.1} />
        <DocumentStatCard title="Âge Moyen" value={`${creances?.age_moyen || 0} jours`} icon={Calendar} variant="info" delay={0.2} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-xl border shadow-sm overflow-hidden">
          <CardHeader className="pb-2 border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold"><PieChartIcon className="h-4 w-4 text-destructive" />Créances par ancienneté</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loadingCreances ? <Skeleton className="h-[300px] w-full" /> : dataCreancesParTranche.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center"><DocumentEmptyState icon={TrendingDown} title="Aucune créance" description="Félicitations !" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart><Pie data={dataCreancesParTranche} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>{dataCreancesParTranche.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => formatMontant(v)} /></PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-xl border shadow-sm overflow-hidden">
          <CardHeader className="pb-2 border-b bg-muted/20">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-destructive" />Top 10 Débiteurs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingCreances ? <div className="p-6"><Skeleton className="h-[300px] w-full" /></div> : topDebiteurs.length === 0 ? (
              <div className="py-12"><DocumentEmptyState icon={Users} title="Aucun débiteur" description="Tous vos clients sont à jour" /></div>
            ) : (
              <Table><TableHeader><TableRow className="bg-muted/50"><TableHead>Client</TableHead><TableHead className="text-right">Montant dû</TableHead><TableHead className="text-center">Factures</TableHead></TableRow></TableHeader>
                <TableBody>{topDebiteurs.slice(0, 10).map((c: any, i: number) => (
                  <TableRow key={i} className="hover:bg-muted/50"><TableCell className="font-medium">{c.client_nom}</TableCell><TableCell className="text-right text-red-600 dark:text-red-400 font-semibold">{formatMontant(c.montant_du)}</TableCell><TableCell className="text-center"><Badge variant="outline">{c.nb_factures}</Badge></TableCell></TableRow>
                ))}</TableBody></Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// === Rentabilité Tab ===
interface RentabiliteTabProps { loading: boolean; rentabilite: any; rentabiliteMensuelle: any[]; }

export function RentabiliteTab({ loading, rentabilite, rentabiliteMensuelle }: RentabiliteTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DocumentStatCard title="Chiffre d'Affaires" value={formatMontant(rentabilite?.chiffre_affaires || 0)} icon={Receipt} variant="primary" delay={0} />
        <DocumentStatCard title="Charges" value={formatMontant((rentabilite?.charges_exploitation || 0) + (rentabilite?.charges_financieres || 0))} icon={TrendingDown} variant="warning" delay={0.1} />
        <DocumentStatCard title="Résultat Net" value={formatMontant(rentabilite?.resultat_net || 0)} icon={TrendingUp} variant={(rentabilite?.resultat_net || 0) >= 0 ? "success" : "danger"} delay={0.2} />
        <DocumentStatCard title="Taux de Marge" value={`${rentabilite?.taux_marge || 0}%`} icon={BarChart3} variant="info" delay={0.3} />
      </div>
      <Card className="rounded-xl border shadow-sm overflow-hidden">
        <CardHeader className="pb-2 border-b bg-muted/20"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4 text-emerald-600" />Évolution de la Rentabilité</CardTitle></CardHeader>
        <CardContent className="pt-4">
          {loading ? <Skeleton className="h-[300px] w-full" /> : rentabiliteMensuelle.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center"><DocumentEmptyState icon={TrendingUp} title="Aucune donnée" description="Pas de données de rentabilité" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rentabiliteMensuelle}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="mois" className="text-xs" /><YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} className="text-xs" /><Tooltip formatter={(v: number) => formatMontant(v)} /><Legend /><Bar dataKey="ca" name="CA" fill="hsl(var(--primary))" /><Bar dataKey="charges" name="Charges" fill="#F4A261" /><Bar dataKey="marge" name="Marge" fill="#2A9D8F" /></BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// === Trésorerie Tab ===
interface TresorerieTabProps {
  loading: boolean; tresorerie: any; tresorerieQuotidienne: any[];
  dateDebut: string; dateFin: string;
  onDateDebutChange: (v: string) => void; onDateFinChange: (v: string) => void;
}

export function TresorerieTab({ loading, tresorerie, tresorerieQuotidienne, dateDebut, dateFin, onDateDebutChange, onDateFinChange }: TresorerieTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DocumentStatCard title="Solde Initial" value={formatMontant(tresorerie?.solde_initial || 0)} icon={Wallet} variant="info" delay={0} />
        <DocumentStatCard title="Total Entrées" value={formatMontant(tresorerie?.total_entrees || 0)} icon={ArrowUpRight} variant="success" delay={0.1} />
        <DocumentStatCard title="Total Sorties" value={formatMontant(tresorerie?.total_sorties || 0)} icon={ArrowDownRight} variant="danger" delay={0.2} />
        <DocumentStatCard title="Solde Final" value={formatMontant(tresorerie?.solde_final || 0)} icon={CreditCard} variant={(tresorerie?.solde_final || 0) >= 0 ? "primary" : "danger"} delay={0.3} />
      </div>
      <Card className="rounded-xl border shadow-sm overflow-hidden">
        <CardHeader className="pb-2 border-b bg-muted/20">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Wallet className="h-4 w-4 text-blue-600" />Flux de Trésorerie</CardTitle><CardDescription className="text-xs">Entrées et sorties de fonds</CardDescription></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Label className="text-sm">Du</Label><Input type="date" value={dateDebut} onChange={e => onDateDebutChange(e.target.value)} className="w-auto" /></div>
              <div className="flex items-center gap-2"><Label className="text-sm">Au</Label><Input type="date" value={dateFin} onChange={e => onDateFinChange(e.target.value)} className="w-auto" /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? <Skeleton className="h-[300px] w-full" /> : tresorerieQuotidienne.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center"><DocumentEmptyState icon={Wallet} title="Aucun mouvement" description="Pas de mouvements sur cette période" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tresorerieQuotidienne}><CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="date" className="text-xs" /><YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} className="text-xs" /><Tooltip formatter={(v: number) => formatMontant(v)} /><Legend /><Line type="monotone" dataKey="entrees" name="Entrées" stroke="#2A9D8F" strokeWidth={2} /><Line type="monotone" dataKey="sorties" name="Sorties" stroke="#E63946" strokeWidth={2} /><Line type="monotone" dataKey="solde" name="Solde" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} /></LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// === Comparatif Tab ===
interface ComparatifTabProps { loading: boolean; comparatif: any; }

export function ComparatifTab({ loading, comparatif }: ComparatifTabProps) {
  const items = [
    { label: "Chiffre d'Affaires", icon: Receipt, value2: comparatif?.ca_annee2, value1: comparatif?.ca_annee1, variation: comparatif?.variation_ca, isMontant: true },
    { label: "Nombre de Factures", icon: FileCheck, value2: comparatif?.nb_factures_annee2, value1: comparatif?.nb_factures_annee1, variation: comparatif?.variation_factures, isMontant: false },
    { label: "Clients Actifs", icon: Users, value2: comparatif?.nb_clients_annee2, value1: comparatif?.nb_clients_annee1, variation: comparatif?.variation_clients, isMontant: false },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map(({ label, icon: Icon, value2, value1, variation, isMontant }) => (
        <Card key={label} className="rounded-xl border shadow-sm overflow-hidden">
          <CardHeader className="pb-2 border-b bg-muted/20">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2"><Icon className="h-3.5 w-3.5" />{label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? <Skeleton className="h-16 w-full" /> : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{isMontant ? formatMontant(value2 || 0) : (value2 || 0)}</span>
                  <Badge className={`gap-1 ${(variation || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                    {(variation || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {variation || 0}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">vs {isMontant ? formatMontant(value1 || 0) : (value1 || 0)} en {comparatif?.annee1}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
