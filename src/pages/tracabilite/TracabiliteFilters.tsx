import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { getActionConfig, getModuleLabel } from "./constants";

interface TracabiliteFiltersProps {
  searchTerm: string; onSearchChange: (v: string) => void;
  actionFilter: string; onActionChange: (v: string) => void;
  moduleFilter: string; onModuleChange: (v: string) => void;
  userFilter: string; onUserChange: (v: string) => void;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
  actions?: string[]; modules?: string[]; users?: any[];
  totalItems: number;
  onResetPage: () => void;
}

export function TracabiliteFilters({
  searchTerm, onSearchChange, actionFilter, onActionChange,
  moduleFilter, onModuleChange, userFilter, onUserChange,
  dateRange, onDateRangeChange, actions, modules, users,
  totalItems, onResetPage,
}: TracabiliteFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher dans les logs..." value={searchTerm} onChange={e => { onSearchChange(e.target.value); onResetPage(); }} className="pl-9" />
          </div>
          <Select value={actionFilter} onValueChange={v => { onActionChange(v); onResetPage(); }}>
            <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              {actions?.map(action => (<SelectItem key={action} value={action}>{getActionConfig(action).label}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={moduleFilter} onValueChange={v => { onModuleChange(v); onResetPage(); }}>
            <SelectTrigger><SelectValue placeholder="Module" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les modules</SelectItem>
              {modules?.map(m => (<SelectItem key={m} value={m}>{getModuleLabel(m)}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={userFilter} onValueChange={v => { onUserChange(v); onResetPage(); }}>
            <SelectTrigger><SelectValue placeholder="Utilisateur" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les utilisateurs</SelectItem>
              {users?.map(user => (<SelectItem key={user.id} value={user.id.toString()}>{user.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarIcon className="h-4 w-4" />Période:</div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {format(dateRange.from, "dd/MM/yyyy", { locale: fr })}<span>→</span>{format(dateRange.to, "dd/MM/yyyy", { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" defaultMonth={dateRange.from} selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => { if (range?.from && range?.to) { onDateRangeChange({ from: range.from, to: range.to }); onResetPage(); } }}
                numberOfMonths={2} locale={fr} />
            </PopoverContent>
          </Popover>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => { onDateRangeChange({ from: subDays(new Date(), 7), to: new Date() }); onResetPage(); }}>7 jours</Button>
            <Button variant="ghost" size="sm" onClick={() => { onDateRangeChange({ from: subDays(new Date(), 30), to: new Date() }); onResetPage(); }}>30 jours</Button>
            <Button variant="ghost" size="sm" onClick={() => { onDateRangeChange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }); onResetPage(); }}>Ce mois</Button>
          </div>
          <div className="ml-auto text-sm text-muted-foreground">{totalItems.toLocaleString()} résultat{totalItems !== 1 ? 's' : ''}</div>
        </div>
      </CardContent>
    </Card>
  );
}
