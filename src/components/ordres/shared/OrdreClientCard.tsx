import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin } from "lucide-react";

interface Client {
  nom?: string;
  type?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
}

interface OrdreClientCardProps {
  client: Client | null | undefined;
}

export function OrdreClientCard({ client }: OrdreClientCardProps) {
  if (!client) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg group">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">{client.nom}</p>
              <p className="text-sm text-muted-foreground">{client.type}</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
            )}
            {client.telephone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{client.telephone}</span>
              </div>
            )}
            {(client.adresse || client.ville) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{[client.adresse, client.ville].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
