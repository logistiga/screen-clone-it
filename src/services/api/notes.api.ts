import api from '@/lib/api';

/**
 * Téléchargement du PDF d'une note de débit en tant que blob axios complet.
 * Retourne l'AxiosResponse pour permettre la lecture des headers (content-type).
 */
export async function downloadNoteDebitPdf(noteId: string | number) {
  return api.get(`/notes-debit/${noteId}/pdf`, { responseType: 'blob' });
}
