import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone, MapPin, Building2 } from "lucide-react";

interface Client {
  nom?: string;
  raison_sociale?: string;
  nom_complet?: string;
  type?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
}

interface FactureClientCardProps {
  client: Client | null | undefined;
}

export function FactureClientCard({ client }: FactureClientCardProps) {
  if (!client) return null;

  const clientName = client.raison_sociale || client.nom_complet || client.nom || 'Client';
  const clientInitials = clientName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const clientType = client.type || 'Client';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
    >
      <Card className="h-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            Client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client identity */}
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-md">
              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-bold text-lg">
                {clientInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">{clientName}</h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                {clientType}
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="space-y-2.5 pt-2 border-t">
            {client.email && (
              <motion.div 
                className="flex items-center gap-3 text-sm group"
                whileHover={{ x: 2 }}
              >
                <div className="p-1.5 rounded-md bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Mail className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <span className="truncate">{client.email}</span>
              </motion.div>
            )}
            {client.telephone && (
              <motion.div 
                className="flex items-center gap-3 text-sm group"
                whileHover={{ x: 2 }}
              >
                <div className="p-1.5 rounded-md bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                  <Phone className="h-3.5 w-3.5 text-green-600" />
                </div>
                <span>{client.telephone}</span>
              </motion.div>
            )}
            {(client.adresse || client.ville) && (
              <motion.div 
                className="flex items-start gap-3 text-sm group"
                whileHover={{ x: 2 }}
              >
                <div className="p-1.5 rounded-md bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <span className="text-muted-foreground leading-relaxed">
                  {[client.adresse, client.ville].filter(Boolean).join(', ')}
                </span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
