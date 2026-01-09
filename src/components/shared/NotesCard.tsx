import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface NotesCardProps {
  notes: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function NotesCard({
  notes,
  onChange,
  label = "Notes",
  placeholder = "Notes ou remarques...",
}: NotesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
        />
      </CardContent>
    </Card>
  );
}
