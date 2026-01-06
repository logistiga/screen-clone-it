import { MainLayout } from "@/components/layout/MainLayout";
import { NoteDebutForm } from "@/components/notes/NoteDebutForm";

export default function NouvelleNoteDetention() {
  return (
    <MainLayout title="Nouvelle note - Détention">
      <NoteDebutForm
        noteType="detention"
        title="Nouvelle note - Détention"
        subtitle="Créez une note de détention avec plusieurs OT et conteneurs"
      />
    </MainLayout>
  );
}
