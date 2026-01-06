import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatMontant } from "@/data/mockData";

const dataCA = [
  { mois: "Jan", montant: 4500000 },
  { mois: "Fév", montant: 3800000 },
  { mois: "Mar", montant: 5200000 },
  { mois: "Avr", montant: 4100000 },
  { mois: "Mai", montant: 6300000 },
  { mois: "Juin", montant: 5800000 },
];

const dataTypes = [
  { name: "Conteneurs", value: 35 },
  { name: "Transport", value: 25 },
  { name: "Manutention", value: 20 },
  { name: "Stockage", value: 15 },
  { name: "Location", value: 5 },
];

const COLORS = ["#E63946", "#4A4A4A", "#F4A261", "#2A9D8F", "#264653"];

export default function ReportingPage() {
  return (
    <MainLayout title="Reporting">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">CA Mensuel</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatMontant(5800000)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">CA Annuel</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatMontant(29700000)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Impayés</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{formatMontant(2380000)}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Taux Recouvrement</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">78%</div></CardContent></Card>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card><CardHeader><CardTitle>Chiffre d'affaires mensuel</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><BarChart data={dataCA}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mois" /><YAxis /><Tooltip formatter={(v) => formatMontant(v as number)} /><Bar dataKey="montant" fill="#E63946" /></BarChart></ResponsiveContainer></CardContent></Card>
          <Card><CardHeader><CardTitle>Répartition par type</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><PieChart><Pie data={dataTypes} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{dataTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card>
        </div>
      </div>
    </MainLayout>
  );
}
