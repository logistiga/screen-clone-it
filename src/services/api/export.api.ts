import api from '@/lib/api';

/**
 * Téléchargement d'un export CSV/Excel/PDF en blob.
 * Centralise tous les exports binaires côté serveur.
 */
export async function downloadExportBlob(
  endpoint: string,
  params: Record<string, string | number | boolean>,
): Promise<Blob> {
  const response = await api.get(endpoint, {
    params,
    responseType: 'blob',
  });
  // axios renvoie déjà response.data sous forme de Blob avec responseType: 'blob'
  return response.data as Blob;
}

/** Helper : déclenche le téléchargement d'un Blob dans le navigateur. */
export function triggerBlobDownload(blob: Blob, filename: string, mimeType?: string): void {
  const finalBlob = mimeType ? new Blob([blob], { type: mimeType }) : blob;
  const url = window.URL.createObjectURL(finalBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
