import { MainLayout } from "@/components/layout/MainLayout";
import { NoteDebutForm } from "@/components/notes/NoteDebutForm";

export default function NouvelleNoteOuverturePort() {
  return (
    <MainLayout title="Nouvelle note - Ouverture de port">
      <NoteDebutForm
        noteType="ouverture_port"
        title="Nouvelle note - Ouverture de port"
        subtitle="Créez une note d'ouverture de port avec plusieurs OT et conteneurs"
      />
    </MainLayout>
  );
}
