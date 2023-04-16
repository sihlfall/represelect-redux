import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import type { Disclosure, Representative } from 'represelect';
import { concat, from, map, of, tap, switchMap } from 'rxjs';
import type { Observable, ObservableInput, OperatorFunction } from 'rxjs';
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
  getInitialValue: (stream: Stream) => T,
  represelector: (state: T) => Representative<R0>
): Disclosure.Unspecified<R0>;
export function useWithRepreselector<T, Stream extends ObservableInput<T>, R0, R1> (
  stream: Stream,
  getInitialValue: (stream: Stream) => T,
  represelector: (state: T) => Representative<R0>,
  transform: Transformation<Disclosure.Unspecified<R0>,R1>
): R1;
export function useWithRepreselector<T, Stream extends ObservableInput<T>, R0> (
  stream: Stream,
  getInitialValue: (stream: Stream) => T,
  represelector: (t: T) => Representative<R0>,
  transform?: Transformation<Disclosure.Unspecified<R0>,unknown> 
) {
  const {
    valueTransformation = undefined,
    streamTransformation = undefined
  } = transform ?? {};

  const [ holder ]  = useState(() => {
      const representative = represelector(getInitialValue(stream));
      const disclosure = representative.disclose();
      return {
          representative,
          transformed: valueTransformation ? valueTransformation(disclosure) : disclosure
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
      if (valueTransformation) out = out.pipe(map(valueTransformation));
      if (streamTransformation) out = streamTransformation(out);
      out = out.pipe(
          tap(t => holder.transformed = t)
      );
      
      return (notify: () => void) => {
          const subscription = (out as Observable<unknown>).subscribe(notify);
          return () => subscription.unsubscribe();
      };
  }, [holder, represelector, streamTransformation, valueTransformation, stream]);

  const getSnapshot = useCallback( () => holder.transformed, [holder] );

  const ret = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return ret;
}
