import { useEffect, useRef } from "react";

/**
 * Émet le payload courant vers le parent quand les dépendances changent,
 * sans déclencher d'émission lors du mount initial si `skipInitial` est vrai.
 */
export function useEmitFormData<T>(
  payload: T,
  onChange: (data: T) => void,
  deps: ReadonlyArray<unknown>,
  options: { skipInitial?: boolean } = {},
) {
  const skipped = useRef(!options.skipInitial ? false : true);

  useEffect(() => {
    if (skipped.current) {
      skipped.current = false;
      return;
    }
    onChange(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
