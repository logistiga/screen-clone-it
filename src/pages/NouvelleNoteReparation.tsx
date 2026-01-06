import { MainLayout } from "@/components/layout/MainLayout";
import { NoteDebutForm } from "@/components/notes/NoteDebutForm";

export default function NouvelleNoteReparation() {
  return (
    <MainLayout title="Nouvelle note - Réparation">
      <NoteDebutForm
        noteType="reparation"
        title="Nouvelle note - Réparation conteneur"
        subtitle="Créez une note de réparation avec plusieurs OT et conteneurs"
      />
    </MainLayout>
  );
}
