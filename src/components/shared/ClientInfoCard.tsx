import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Building2 } from "lucide-react";

interface Client {
  id: string;
  nom: string;
  code?: string;
}

interface Transitaire {
  id: string;
  nom: string;
}

interface Representant {
  id: string;
  nom: string;
  prenom?: string;
}

interface ClientInfoCardProps {
  clientId: string;
  onClientChange: (value: string) => void;
  clients: Client[];
  transitaireId?: string;
  onTransitaireChange?: (value: string) => void;
  transitaires?: Transitaire[];
  representantId?: string;
  onRepresentantChange?: (value: string) => void;
  representants?: Representant[];
  validiteDate?: string;
  onValiditeDateChange?: (value: string) => void;
  showValidite?: boolean;
}

export function ClientInfoCard({
  clientId,
  onClientChange,
  clients,
  transitaireId,
  onTransitaireChange,
  transitaires = [],
  representantId,
  onRepresentantChange,
  representants = [],
  validiteDate,
  onValiditeDateChange,
  showValidite = false,
}: ClientInfoCardProps) {
  const selectedClient = clients.find((c) => c.id === clientId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Informations client
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select value={clientId} onValueChange={onClientChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nom} {client.code ? `(${client.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClient && (
            <div className="space-y-2">
              <Label>Code client</Label>
              <Input value={selectedClient.code || "-"} disabled />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {onTransitaireChange && (
            <div className="space-y-2">
              <Label htmlFor="transitaire">Transitaire</Label>
              <Select value={transitaireId || "none"} onValueChange={(val) => onTransitaireChange(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un transitaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {transitaires.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {onRepresentantChange && (
            <div className="space-y-2">
              <Label htmlFor="representant">Représentant</Label>
              <Select value={representantId || "none"} onValueChange={(val) => onRepresentantChange(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un représentant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {representants.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.prenom} {r.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {showValidite && onValiditeDateChange && (
          <div className="space-y-2">
            <Label htmlFor="validite">Date de validité</Label>
            <Input
              type="date"
              value={validiteDate || ""}
              onChange={(e) => onValiditeDateChange(e.target.value)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
