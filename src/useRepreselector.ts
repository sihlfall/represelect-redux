import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useStore } from 'react-redux';
import { Observable } from 'redux';
import { Disclosure, Representative } from 'represelect';
import { BehaviorSubject, concat, from, map, of, OperatorFunction, switchMap, tap, Observable as RxJsObservable, ObservableInput } from 'rxjs';

/* eslint-disable  @typescript-eslint/no-explicit-any */

export function useStoreSubject<TState>() {
    const store = useStore<TState>();

    const [ storeSubject ] = useState(() => new BehaviorSubject(store.getState()));

    useEffect(() => {
        const subscription = from(store).subscribe(state => storeSubject.next(state));
        return () => subscription.unsubscribe();
    }, [store, storeSubject]);

    return storeSubject;
}


export function switchDisclose<T>(): OperatorFunction<Representative<T>, Disclosure.Unspecified<T>> {
    return switchMap(
        (r: Representative<T>) => {
            r.value$.subscribe();
            return r.disclose$;
        }
    );
}

export type BehaviorStream<T> = ObservableInput<T> & { getValue: () => T };

export function useBehaviorStream<V>(behaviorStream: BehaviorStream<V>): V {
    const { subscribe, getSnapshot } = useMemo(() => {
        //console.log(Symbol_observable);
        const obs = (behaviorStream as any)[Symbol.observable]();

        return {
            subscribe: (notify: () => void) => {
                const subscription = obs.subscribe(notify);
                return () => subscription.unsubscribe();
            },
            getSnapshot: () => behaviorStream.getValue()
        };
    }, [behaviorStream]);

    const ret = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    return ret;
}

interface Observer<T> {
    next: (value: T) => void;
    error: (err: any) => void;
    complete: () => void;
}

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

export function createStabilizer<T>(equality: (t1: T, t2: T) => boolean) {
    let last: T | null = null;
    return (t: T) => {
        const ret = (last !== null) && equality(last, t) ? last : t;
        last = ret;
        return ret;
    };
}

type Transformation<T0,T1,TI=T0> = Record<string,never> |
  { 
    transformValue: (v: T0) => T1,
    transformStream?: undefined
  } | {
    transformValue?: undefined,
    transformStream: (stream: Observable<T0>) => Observable<T1>
  } | {
    transformValue: (v: T0) => TI,
    transformStream: (stream: Observable<TI>) => Observable<T1>
  };


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
            const subscription = (out as RxJsObservable<unknown>).subscribe(notify);
            return () => subscription.unsubscribe();
        };
    }, [holder, represelector, transformStream, transformValue, stream]);

    const getSnapshot = useCallback( () => holder.transformed, [holder] );

    const ret = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    return ret;
}


function getStoreValue <TState, TStore extends { getState: () => TState}> (s: TStore) {
    return s.getState();
}

export type TypedUseRepreselectorHook<TState> = {
    <R0> (represelector: (state: TState) => Representative<R0>): Disclosure.Unspecified<R0>;
    <R0, R1> (
        represelector: (state: TState) => Representative<R0>,
        transform: Transformation<Disclosure.Unspecified<R0>,R1>
    ): R1 | null;
};

export function useRepreselector<TState, R0>(
    represelector: (state: TState) => Representative<R0>
): Disclosure.Unspecified<R0>;
export function useRepreselector<TState, R0, R1>(
    represelector: (state: TState) => Representative<R0>,
    transform: Transformation<Disclosure.Unspecified<R0>,R1>
): R1 | null;
export function useRepreselector<TState, R0>(
    represelector: (state: TState) => Representative<R0>,
    transform?: Transformation<Disclosure.Unspecified<R0>,unknown> 
) {
    const store = useStore<TState>();
    // @ts-ignore
    const ret = useWithRepreselector(store, getStoreValue, represelector, transform);
    return ret;
}
