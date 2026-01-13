import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StickyNote } from "lucide-react";

interface OrdreNotesCardProps {
  notes: string | null | undefined;
}

export function OrdreNotesCard({ notes }: OrdreNotesCardProps) {
  if (!notes) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-amber-600" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-muted-foreground whitespace-pre-wrap">{notes}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
