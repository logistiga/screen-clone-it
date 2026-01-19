import { Calendar, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientCombobox } from "@/components/shared/ClientCombobox";

interface Client {
  id: string | number;
  nom: string;
  email?: string;
  telephone?: string;
}

interface ClientInfoCardProps {
  clientId: string;
  setClientId: (id: string) => void;
  dateValidite: string;
  setDateValidite: (date: string) => void;
  clients: Client[];
  isLoading?: boolean;
}

export default function ClientInfoCard({
  clientId,
  setClientId,
  dateValidite,
  setDateValidite,
  clients,
  isLoading,
}: ClientInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-primary" />
          Client
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom du client *</Label>
            <ClientCombobox
              clients={clients}
              value={clientId}
              onChange={setClientId}
              placeholder="Sélectionner un client"
              isLoading={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date de validité
            </Label>
            <Input
              type="date"
              value={dateValidite}
              onChange={(e) => setDateValidite(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
