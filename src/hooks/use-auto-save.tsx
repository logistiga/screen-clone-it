import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface AutoSaveOptions {
  key: string;
  debounceMs?: number;
  onRestore?: (data: any) => void;
}

interface AutoSaveResult<T> {
  save: (data: T) => void;
  clear: () => void;
  restore: () => T | null;
  hasDraft: boolean;
  lastSaved: Date | null;
  isSaving: boolean;
}

export function useAutoSave<T>({ key, debounceMs = 2000, onRestore }: AutoSaveOptions): AutoSaveResult<T> {
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `lovable_draft_${key}`;

  // Check for existing draft on mount
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setHasDraft(true);
        if (parsed.savedAt) {
          setLastSaved(new Date(parsed.savedAt));
        }
      } catch (e) {
        localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey]);

  const save = useCallback((data: T) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSaving(true);

    // Debounce the save
    timeoutRef.current = setTimeout(() => {
      try {
        const saveData = {
          data,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(saveData));
        setHasDraft(true);
        setLastSaved(new Date());
        setIsSaving(false);
      } catch (e) {
        console.error('Failed to save draft:', e);
        setIsSaving(false);
      }
    }, debounceMs);
  }, [storageKey, debounceMs]);

  const clear = useCallback(() => {
    localStorage.removeItem(storageKey);
    setHasDraft(false);
    setLastSaved(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [storageKey]);

  const restore = useCallback((): T | null => {
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (onRestore) {
          onRestore(parsed.data);
        }
        return parsed.data;
      }
    } catch (e) {
      console.error('Failed to restore draft:', e);
    }
    return null;
  }, [storageKey, onRestore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    save,
    clear,
    restore,
    hasDraft,
    lastSaved,
    isSaving,
  };
}
