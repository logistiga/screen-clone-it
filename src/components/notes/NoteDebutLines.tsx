import type { NoteDebut } from "@/lib/api/notes-debut";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function NoteDebutLines({ note }: { note: NoteDebut }) {
  if (!note.lignes?.length) return null;
  const divers = note.type.toLowerCase() === "divers";
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{divers ? "Désignation" : "Conteneur"}</TableHead>
            <TableHead>{divers ? "N° reçu / référence" : "Description"}</TableHead>
            <TableHead className="text-right">Montant (FCFA)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {note.lignes.map((ligne, index) => (
            <TableRow key={ligne.id ?? index}>
              <TableCell className="whitespace-pre-wrap break-words">
                {divers ? ligne.designation || ligne.observations || "-" : ligne.conteneur_numero || "-"}
              </TableCell>
              <TableCell className="whitespace-pre-wrap break-words">
                {divers ? ligne.reference_justificatif || ligne.conteneur_numero || "-" : ligne.designation || ligne.observations || "-"}
              </TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(ligne.montant_ht ?? 0)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}