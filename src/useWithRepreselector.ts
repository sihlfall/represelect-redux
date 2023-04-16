import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import type { Disclosure, Representative } from 'represelect';
import { concat, from, map, of, tap, Observable, ObservableInput, OperatorFunction, switchMap } from 'rxjs';
import type { Transformation } from './types';

function switchDisclose<T>(): OperatorFunction<Representative<T>, Disclosure.Unspecified<T>> {
  return switchMap(
      (r: Representative<T>) => {
          r.value$.subscribe();
          return r.disclose$;
      }
  );
}

export function useWithRepreselector<T, Stream extends ObservableInput<T>, R0> (
  stream: Stream,
  initialize: (stream: Stream) => T,
  represelector: (state: T) => Representative<R0>
): Disclosure.Unspecified<R0>;
export function useWithRepreselector<T, Stream extends ObservableInput<T>, R0, R1> (
  stream: Stream,
  initialize: (stream: Stream) => T,
  represelector: (state: T) => Representative<R0>,
  transform: Transformation<Disclosure.Unspecified<R0>,R1>
): R1;
export function useWithRepreselector<T, Stream extends ObservableInput<T>, R0> (
  stream: Stream,
  initialize: (stream: Stream) => T,
  represelector: (t: T) => Representative<R0>,
  transform?: Transformation<Disclosure.Unspecified<R0>,unknown> 
) {
  const { transformValue = undefined, transformStream = undefined } = transform ?? {};

  const [ holder ]  = useState(() => {
      const representative = represelector(initialize(stream));
      const untransformed = representative.disclose();
      return {
          representative,
          transformed: transformValue ? transformValue(untransformed) : untransformed
      };
  });

  const subscribe = useMemo(() => {
      let out: any = concat(
          of(holder.representative),
          from(stream).pipe(map(represelector))
      ).pipe(
          tap(r => holder.representative = r),
          switchDisclose()
      );
      if (transformValue) out = out.pipe(map(transformValue));
      if (transformStream) out = out.pipe(transformStream);
      out = out.pipe(
          tap(t => holder.transformed = t)
      );
      
      return (notify: () => void) => {
          const subscription = (out as Observable<unknown>).subscribe(notify);
          return () => subscription.unsubscribe();
      };
  }, [holder, represelector, transformStream, transformValue, stream]);

  const getSnapshot = useCallback( () => holder.transformed, [holder] );

  const ret = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return ret;
}
