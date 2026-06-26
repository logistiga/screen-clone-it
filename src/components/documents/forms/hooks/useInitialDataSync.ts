import { useEffect, useRef } from "react";

/**
 * Synchronise un `initialData` externe vers un état local via un setter,
 * avec garde anti-boucle basée sur une clé sérialisable.
 *
 * Évite que la mise à jour de `initialData` (souvent reconstruit à chaque
 * render parent) ne re-déclenche en boucle un `setState` identique.
 */
export function useInitialDataSync<T>(
  initialData: T | null | undefined,
  buildKey: (data: T) => string,
  apply: (data: T) => void,
) {
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (!initialData) return;
    const key = buildKey(initialData);
    if (key === lastKey.current) return;
    lastKey.current = key;
    apply(initialData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);
}
