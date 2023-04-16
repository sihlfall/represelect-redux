import type { ObservableInput } from "rxjs";
import { from } from "rxjs";
import { useCallback, useState, useSyncExternalStore } from "react";

export function useObservable<T>(
  observable: ObservableInput<T>
): T | null;
export function useObservable<T,I=T>(
  observable: ObservableInput<T>,
  getInitial: () => I
): T | I;
export function useObservable<T>(
  observable: ObservableInput<T>,
  getInitial: () => unknown = () => null
) {
  const [ holder ] = useState<{ t: unknown }>(() => ({ t: getInitial() }));

  const subscribe = useCallback((notify: () => void) => {
      const subscription = from(observable).subscribe({
          next: (t: unknown) => {
              holder.t = t; notify();
          }
      });
      return () => subscription.unsubscribe();
  }, [holder, observable]);

  const getSnapshot = useCallback(() => holder.t, [holder]);

  const ret = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return ret;
}
