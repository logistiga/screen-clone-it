import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface NotesCardProps {
  notes: string;
  setNotes: (notes: string) => void;
}

export default function NotesCard({ notes, setNotes }: NotesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Conditions et notes</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ajouter des notes ou observations..."
          rows={5}
          className="min-h-[120px]"
        />
      </CardContent>
    </Card>
  );
}
