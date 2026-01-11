import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesDebutApi, NoteDebut, NoteDebutParams } from '@/lib/api/notes-debut';
import { toast } from 'sonner';

export function useNotesDebut(params?: NoteDebutParams) {
  return useQuery({
    queryKey: ['notes-debut', params],
    queryFn: () => notesDebutApi.getAll(params),
  });
}

export function useNoteDebut(id: string | undefined) {
  return useQuery({
    queryKey: ['notes-debut', id],
    queryFn: () => notesDebutApi.getById(id!),
    enabled: !!id,
  });
}

export function useCreateNoteDebut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NoteDebut>) => notesDebutApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-debut'] });
      toast.success('Note créée avec succès');
    },
    onError: (error: any) => {
      const apiMessage = error.response?.data?.message;
      const apiError = error.response?.data?.error;
      const status = error.response?.status;

      // Helpful debug info (shows in browser console)
      console.error('Erreur création note de début', {
        status,
        data: error.response?.data,
        request: error.config,
      });

      toast.error(
        apiError
          ? `${apiMessage || 'Erreur lors de la création'}: ${apiError}`
          : apiMessage || 'Erreur lors de la création de la note'
      );
    },
  });
}

export function useUpdateNoteDebut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NoteDebut> }) => notesDebutApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-debut'] });
      toast.success('Note modifiée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification de la note');
    },
  });
}

export function useDeleteNoteDebut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notesDebutApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-debut'] });
      toast.success('Note supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la note');
    },
  });
}

export function useDuplicateNoteDebut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notesDebutApi.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes-debut'] });
      toast.success('Note dupliquée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la duplication de la note');
    },
  });
}

export function useNotesDebutStats(params?: { client_id?: string; type?: string; date_debut?: string; date_fin?: string }) {
  return useQuery({
    queryKey: ['notes-debut', 'stats', params],
    queryFn: () => notesDebutApi.getStats(params),
  });
}
