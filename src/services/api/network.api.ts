import api from '@/lib/api';

/**
 * Ping léger du backend pour vérifier la connectivité.
 * Utilise HEAD pour éviter les préflights CORS.
 */
export async function pingBackend(options?: { signal?: AbortSignal; timeout?: number }): Promise<void> {
  await api.head('/ping', {
    signal: options?.signal,
    timeout: options?.timeout,
  });
}
