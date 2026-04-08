import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Line, Area, AreaChart } from 'recharts';
import {
  Building2, Calendar, TrendingUp, CheckCircle, Clock, AlertTriangle,
  BarChart3, PieChart, ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight, Wallet, Eye, TrendingDown, Ban, Trash2
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatMontant, formatMontantCompact } from "./useCreditsData";
import { getStatutBadge, getEcheanceStatutBadge } from "./constants";

interface CreditsDashboardTabProps {
  stats: any; dashboard: any; evolutionChartData: any[]; pieData: any[];
  selectedAnnee: number; navigate: (path: string) => void;
}

export function CreditsDashboardTab({ stats, dashboard, evolutionChartData, pieData, selectedAnnee, navigate }: CreditsDashboardTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Évolution mensuelle {selectedAnnee}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={evolutionChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mois_nom" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => formatMontantCompact(v)} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatMontant(value)} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="emprunte" name="Emprunté" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rembourse" name="Remboursé" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><PieChart className="h-4 w-4 text-primary" />Répartition par banque</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RechartsPie>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {pieData.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip formatter={(value: number) => formatMontant(value)} />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />Prochaines échéances</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="bg-muted/30"><TableHead>Date</TableHead><TableHead>Crédit</TableHead><TableHead className="text-right">Montant</TableHead></TableRow></TableHeader>
              <TableBody>
                {(stats?.prochaines_echeances || []).slice(0, 5).map((e: any) => (
                  <TableRow key={e.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{e.date_echeance ? format(new Date(e.date_echeance), 'dd MMM', { locale: fr }) : '-'}</TableCell>
                    <TableCell><div className="text-sm">{e.credit_numero}</div><div className="text-xs text-muted-foreground">{e.banque}</div></TableCell>
                    <TableCell className="text-right font-semibold">{formatMontantCompact(e.montant)}</TableCell>
                  </TableRow>
                ))}
                {(!stats?.prochaines_echeances || stats.prochaines_echeances.length === 0) && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Aucune échéance à venir</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className={`shadow-sm ${(stats?.echeances_retard?.length || 0) > 0 ? 'border-destructive/50' : ''}`}>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className={`h-4 w-4 ${(stats?.echeances_retard?.length || 0) > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />Échéances en retard</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="bg-muted/30"><TableHead>Date</TableHead><TableHead>Crédit</TableHead><TableHead>Retard</TableHead><TableHead className="text-right">Montant</TableHead></TableRow></TableHeader>
              <TableBody>
                {(stats?.echeances_retard || []).slice(0, 5).map((e: any) => (
                  <TableRow key={e.id} className="hover:bg-destructive/5">
                    <TableCell className="font-medium text-destructive">{e.date_echeance ? format(new Date(e.date_echeance), 'dd/MM', { locale: fr }) : '-'}</TableCell>
                    <TableCell><div className="text-sm">{e.credit_numero}</div><div className="text-xs text-muted-foreground">{e.banque}</div></TableCell>
                    <TableCell><Badge variant="destructive" className="text-xs">{e.jours_retard}j</Badge></TableCell>
                    <TableCell className="text-right font-semibold text-destructive">{formatMontantCompact(e.montant)}</TableCell>
                  </TableRow>
                ))}
                {(!stats?.echeances_retard || stats.echeances_retard.length === 0) && <TableRow><TableCell colSpan={4} className="text-center text-emerald-600 py-8"><CheckCircle className="h-5 w-5 mx-auto mb-2" />Aucune échéance en retard</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {dashboard?.top_credits && dashboard.top_credits.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Top crédits actifs</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="bg-muted/30"><TableHead>Crédit</TableHead><TableHead>Banque</TableHead><TableHead className="text-right">Montant total</TableHead><TableHead className="text-right">Remboursé</TableHead><TableHead>Progression</TableHead><TableHead>Fin</TableHead></TableRow></TableHeader>
              <TableBody>
                {dashboard.top_credits.map((c: any) => (
                  <TableRow key={c.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`/credits/${c.id}`)}>
                    <TableCell><div className="font-medium">{c.numero}</div><div className="text-xs text-muted-foreground truncate max-w-[150px]">{c.objet}</div></TableCell>
                    <TableCell>{c.banque}</TableCell>
                    <TableCell className="text-right font-semibold">{formatMontantCompact(c.montant_total)}</TableCell>
                    <TableCell className="text-right text-emerald-600">{formatMontantCompact(c.rembourse)}</TableCell>
                    <TableCell><div className="w-20"><Progress value={c.taux_remboursement} className="h-2" /><span className="text-xs text-muted-foreground">{c.taux_remboursement}%</span></div></TableCell>
                    <TableCell className="text-sm">{c.date_fin ? format(new Date(c.date_fin), 'MMM yyyy', { locale: fr }) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface CreditsComparaisonTabProps {
  comparaison: any; comparaisonChartData: any[]; selectedAnnee: number;
}

export function CreditsComparaisonTab({ comparaison, comparaisonChartData, selectedAnnee }: CreditsComparaisonTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5"><CardContent className="pt-4"><p className="text-xs text-primary uppercase tracking-wide">Emprunté {selectedAnnee}</p><p className="text-xl font-bold text-primary">{formatMontantCompact(comparaison?.totaux?.emprunte || 0)}</p></CardContent></Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5"><CardContent className="pt-4"><p className="text-xs text-emerald-600 uppercase tracking-wide">Remboursé {selectedAnnee}</p><p className="text-xl font-bold text-emerald-600">{formatMontantCompact(comparaison?.totaux?.rembourse || 0)}</p></CardContent></Card>
        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5"><CardContent className="pt-4"><p className="text-xs text-violet-600 uppercase tracking-wide">Intérêts {selectedAnnee}</p><p className="text-xl font-bold text-violet-600">{formatMontantCompact(comparaison?.totaux?.interets || 0)}</p></CardContent></Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5"><CardContent className="pt-4"><p className="text-xs text-amber-600 uppercase tracking-wide">Reste global</p><p className="text-xl font-bold text-amber-600">{formatMontantCompact(comparaison?.totaux?.reste || 0)}</p></CardContent></Card>
      </div>
      <Card className="shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base">Évolution emprunts vs remboursements {selectedAnnee}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={comparaisonChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mois_nom" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatMontantCompact(v)} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => formatMontant(value)} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Legend />
              <Area type="monotone" dataKey="emprunte" name="Emprunté" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              <Area type="monotone" dataKey="rembourse" name="Remboursé" stroke="hsl(142 71% 45%)" fill="hsl(142 71% 45%)" fillOpacity={0.3} />
              <Line type="monotone" dataKey="solde_restant" name="Solde restant" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader className="pb-3"><CardTitle className="text-base">Détail mensuel</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow className="bg-muted/30"><TableHead>Mois</TableHead><TableHead className="text-right">Emprunté</TableHead><TableHead className="text-right">Intérêts</TableHead><TableHead className="text-right">Remboursé</TableHead><TableHead className="text-right">Solde restant</TableHead><TableHead>Évolution</TableHead></TableRow></TableHeader>
            <TableBody>
              {comparaisonChartData.map((mois: any) => {
                const diff = mois.emprunte - mois.rembourse;
                return (
                  <TableRow key={mois.mois} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{mois.mois_nom}</TableCell>
                    <TableCell className="text-right text-primary">{formatMontantCompact(mois.emprunte)}</TableCell>
                    <TableCell className="text-right text-violet-600">{formatMontantCompact(mois.interets)}</TableCell>
                    <TableCell className="text-right text-emerald-600">{formatMontantCompact(mois.rembourse)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatMontantCompact(mois.solde_restant)}</TableCell>
                    <TableCell>{diff > 0 ? <span className="flex items-center text-destructive text-sm"><ArrowUpRight className="h-4 w-4" />+{formatMontantCompact(diff)}</span> : diff < 0 ? <span className="flex items-center text-emerald-600 text-sm"><ArrowDownRight className="h-4 w-4" />{formatMontantCompact(Math.abs(diff))}</span> : <span className="text-muted-foreground text-sm">-</span>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

interface CreditsBanqueTabProps {
  stats: any; credits: any[]; expandedBanques: number[];
  toggleBanque: (id: number) => void; handleRemboursement: (c: any) => void;
  navigate: (path: string) => void;
}

export function CreditsBanqueTab({ stats, credits, expandedBanques, toggleBanque, handleRemboursement, navigate }: CreditsBanqueTabProps) {
  return (
    <div className="space-y-4">
      {stats?.par_banque?.map((banque: any) => {
        const isExpanded = expandedBanques.includes(banque.banque_id);
        const creditsOfBanque = credits.filter((c: any) => c.banque?.id === banque.banque_id);
        const tauxRemboursement = banque.total > 0 ? (banque.rembourse / banque.total) * 100 : 0;
        return (
          <Collapsible key={banque.banque_id} open={isExpanded} onOpenChange={() => toggleBanque(banque.banque_id)}>
            <Card className="shadow-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div><div><CardTitle className="text-base">{banque.banque_nom}</CardTitle><CardDescription>{banque.nombre} crédit(s) actif(s)</CardDescription></div></div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right"><p className="text-sm text-muted-foreground">Total emprunté</p><p className="font-bold text-lg">{formatMontantCompact(banque.total)}</p></div>
                      <div className="text-right"><p className="text-sm text-muted-foreground">Remboursé</p><p className="font-bold text-lg text-emerald-600">{formatMontantCompact(banque.rembourse)}</p></div>
                      <div className="w-32"><div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Progression</span><span className="font-medium">{tauxRemboursement.toFixed(0)}%</span></div><Progress value={tauxRemboursement} className="h-2" /></div>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/30"><TableHead>Numéro</TableHead><TableHead>Objet</TableHead><TableHead className="text-right">Montant</TableHead><TableHead className="text-right">Remboursé</TableHead><TableHead>Progression</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {creditsOfBanque.map((credit: any) => {
                        const rembourse = credit.montant_rembourse || 0;
                        const progression = credit.montant_total > 0 ? (rembourse / credit.montant_total) * 100 : 0;
                        return (
                          <TableRow key={credit.id} className="hover:bg-muted/20">
                            <TableCell className="font-medium">{credit.numero}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{credit.objet}</TableCell>
                            <TableCell className="text-right">{formatMontantCompact(credit.montant_total)}</TableCell>
                            <TableCell className="text-right text-emerald-600">{formatMontantCompact(rembourse)}</TableCell>
                            <TableCell><div className="w-20"><Progress value={progression} className="h-1.5" /><span className="text-xs text-muted-foreground">{progression.toFixed(0)}%</span></div></TableCell>
                            <TableCell>{getStatutBadge(credit.statut)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/credits/${credit.id}`)}><Eye className="h-4 w-4" /></Button>
                                {credit.statut?.toLowerCase() === 'actif' && <Button variant="ghost" size="icon" className="text-emerald-600" onClick={() => handleRemboursement(credit)}><TrendingDown className="h-4 w-4" /></Button>}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}

interface CreditsEcheancierTabProps {
  stats: any; dashboard: any; handlePayerEcheance: (e: any) => void;
}

export function CreditsEcheancierTab({ stats, dashboard, handlePayerEcheance }: CreditsEcheancierTabProps) {
  return (
    <div className="space-y-6">
      {dashboard?.calendrier_echeances && dashboard.calendrier_echeances.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {dashboard.calendrier_echeances.slice(0, 8).map((mois: any) => (
            <Card key={mois.mois} className={`shadow-sm ${mois.en_retard > 0 ? 'border-destructive/50' : ''}`}>
              <CardContent className="pt-4">
                <p className="text-sm font-medium">{mois.mois_nom}</p>
                <p className="text-xl font-bold mt-1">{formatMontantCompact(mois.montant_total)}</p>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-emerald-600">{mois.payees} payée(s)</span>
                  <span className="text-amber-600">{mois.a_payer} à payer</span>
                  {mois.en_retard > 0 && <span className="text-destructive">{mois.en_retard} retard</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" />À venir</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="bg-muted/30"><TableHead>Date</TableHead><TableHead>Crédit / Banque</TableHead><TableHead className="text-right">Montant</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {(stats?.prochaines_echeances || []).map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.date_echeance ? format(new Date(e.date_echeance), 'dd/MM/yyyy', { locale: fr }) : '-'}</TableCell>
                    <TableCell><div className="text-sm font-medium">{e.credit_numero}</div><div className="text-xs text-muted-foreground">{e.banque}</div></TableCell>
                    <TableCell className="text-right font-semibold">{formatMontantCompact(e.montant)}</TableCell>
                    <TableCell>{getEcheanceStatutBadge(e.statut)}</TableCell>
                    <TableCell className="text-right"><Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handlePayerEcheance(e)}><Wallet className="h-3 w-3 mr-1" />Payer</Button></TableCell>
                  </TableRow>
                ))}
                {(!stats?.prochaines_echeances || stats.prochaines_echeances.length === 0) && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucune échéance à venir</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className={`shadow-sm ${(stats?.echeances_retard?.length || 0) > 0 ? 'border-destructive/50 bg-destructive/5' : ''}`}>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />En retard ({stats?.echeances_retard?.length || 0})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="bg-muted/30"><TableHead>Date</TableHead><TableHead>Crédit / Banque</TableHead><TableHead className="text-right">Montant</TableHead><TableHead>Retard</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {(stats?.echeances_retard || []).map((e: any) => (
                  <TableRow key={e.id} className="bg-destructive/5">
                    <TableCell className="font-medium text-destructive">{e.date_echeance ? format(new Date(e.date_echeance), 'dd/MM/yyyy', { locale: fr }) : '-'}</TableCell>
                    <TableCell><div className="text-sm font-medium">{e.credit_numero}</div><div className="text-xs text-muted-foreground">{e.banque}</div></TableCell>
                    <TableCell className="text-right font-semibold text-destructive">{formatMontantCompact(e.montant)}</TableCell>
                    <TableCell><Badge variant="destructive">{e.jours_retard}j</Badge></TableCell>
                    <TableCell className="text-right"><Button variant="destructive" size="sm" onClick={() => handlePayerEcheance(e)}><Wallet className="h-3 w-3 mr-1" />Régulariser</Button></TableCell>
                  </TableRow>
                ))}
                {(!stats?.echeances_retard || stats.echeances_retard.length === 0) && <TableRow><TableCell colSpan={5} className="text-center py-8"><CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" /><p className="text-emerald-600 font-medium">Aucune échéance en retard</p></TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface CreditsListeTabProps {
  creditsFiltres: any[];
  navigate: (path: string) => void;
  handleRemboursement: (c: any) => void;
  setCreditToAnnuler: (c: any) => void;
  setCreditToSupprimer: (c: any) => void;
}

export function CreditsListeTab({ creditsFiltres, navigate, handleRemboursement, setCreditToAnnuler, setCreditToSupprimer }: CreditsListeTabProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-base">Tous les crédits ({creditsFiltres.length})</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Numéro</TableHead><TableHead>Banque</TableHead><TableHead>Objet</TableHead>
              <TableHead className="text-right">Montant total</TableHead><TableHead className="text-right">Remboursé</TableHead>
              <TableHead>Progression</TableHead><TableHead>Période</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creditsFiltres.map((credit: any) => {
              const rembourse = credit.montant_rembourse || 0;
              const progression = credit.montant_total > 0 ? (rembourse / credit.montant_total) * 100 : 0;
              return (
                <TableRow key={credit.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">{credit.numero}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />{credit.banque?.nom || '-'}</div></TableCell>
                  <TableCell className="max-w-[200px] truncate">{credit.objet}</TableCell>
                  <TableCell className="text-right font-semibold">{formatMontantCompact(credit.montant_total)}</TableCell>
                  <TableCell className="text-right text-emerald-600">{formatMontantCompact(rembourse)}</TableCell>
                  <TableCell><div className="w-24"><Progress value={progression} className="h-2" /><p className="text-xs text-muted-foreground mt-1">{progression.toFixed(0)}%</p></div></TableCell>
                  <TableCell className="text-sm"><div>{credit.date_debut ? format(new Date(credit.date_debut), 'MMM yyyy', { locale: fr }) : '-'}</div><div className="text-xs text-muted-foreground">→ {credit.date_fin ? format(new Date(credit.date_fin), 'MMM yyyy', { locale: fr }) : '-'}</div></TableCell>
                  <TableCell>{getStatutBadge(credit.statut)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/credits/${credit.id}`)}><Eye className="h-4 w-4" /></Button>
                      {credit.statut?.toLowerCase() === 'actif' && (<>
                        <Button variant="ghost" size="icon" className="text-emerald-600" onClick={() => handleRemboursement(credit)}><TrendingDown className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-amber-600" onClick={() => setCreditToAnnuler(credit)} title="Annuler"><Ban className="h-4 w-4" /></Button>
                      </>)}
                      {(!credit.montant_rembourse || credit.montant_rembourse === 0) && <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setCreditToSupprimer(credit)} title="Supprimer"><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {creditsFiltres.length === 0 && <TableRow><TableCell colSpan={9} className="h-24 text-center text-muted-foreground">Aucun crédit trouvé</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
