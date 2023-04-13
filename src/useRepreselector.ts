import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useStore } from 'react-redux';
import { Disclosure, Representative } from 'represelect';
import { BehaviorSubject, concat, from, map, of, OperatorFunction, switchMap, tap, Observable as RxJsObservable, ObservableInput } from 'rxjs';
import { observable as RxJS_Symbol_observable } from 'rxjs'

const Symbol_observable = (() => (typeof Symbol === 'function' && Symbol.observable) || '@@observable')();

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


export function switchDisclose<S, T>(
    represelector: (s: S) => Representative<T>
): OperatorFunction<S, Disclosure.Unspecified<T>> {
    return switchMap(
        (s: S) => {
            const r = represelector(s);
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

function createStabilizer<T>(equality: (t1: T, t2: T) => boolean) {
    let last: T | null = null;
    return (t: T) => {
        const ret = (last !== null) && equality(last, t) ? last : t;
        last = ret;
        return ret;
    };
}

const identity = <X> (x: X) => x;

export function useWithRepreselector<T, R0> (
    stream: ObservableInput<T>,
    initialize: () => T,
    represelector: (state: T) => Representative<R0>
): R0;
export function useWithRepreselector<T, R0, R1>(
    stream: ObservableInput<T>,
    initialize: () => T,
    represelector: (state: T) => Representative<R0>,
    transform: {
        transformValue: (d: Disclosure.Unspecified<R0>) => R1,
        transformStream?: OperatorFunction<Disclosure.Unspecified<R0>,R1>
    }
): R1;
export function useWithRepreselector<T, R0>(
    stream: ObservableInput<T>,
    initialize: (stream: unknown) => T,
    represelector: (t: T) => Representative<R0>,
    transform: {
        transformValue: (d: Disclosure.Unspecified<R0>) => unknown,
        transformStream?: OperatorFunction<Disclosure.Unspecified<R0>,unknown>
    } = { transformValue: identity }
) {
    const stabilize = useMemo( () => createStabilizer(Disclosure.equality), [] );

    const { transformValue } = transform;

    const [ holder ]  = useState(() => {
        const untransformed = stabilize(
            represelector(initialize(stream)).disclose()
        );
        return {
            untransformed,
            transformed: transformValue(untransformed)
        };
    });

    const subscribe = useMemo(() => {
        const transformStream = transform.transformStream ?? 
            (transformValue === identity) ? identity : map(transformValue);

        const out = concat(
            of(holder.untransformed),
            from(stream).pipe(
                switchDisclose(represelector),
                map(stabilize),
                tap(d => holder.untransformed = d)
            )
        ).pipe(
            transformStream,
            tap(t => holder.transformed = t)
        );
        
        return (notify: () => void) => {
            const subscription = out.subscribe();
            notify();
            return () => subscription.unsubscribe();
        };
    }, [holder, represelector, transform.transformStream, transformValue, stabilize, stream]);

    const getSnapshot = useCallback( () => holder.transformed, [holder] );

    const ret = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    return ret;
}




export function useRepreselector<TState, R0>(
    represelector: (state: TState) => Representative<R0>
): Disclosure.Unspecified<R0>;
export function useRepreselector<TState, R0, R1>(
    represelector: (state: TState) => Representative<R0>,
    operatorFunction: OperatorFunction<Disclosure.Unspecified<R0>,R1>
): R1 | null;
export function useRepreselector<TState, R0, R1, R2 = R1>(
    represelector: (state: TState) => Representative<R0>,
    operatorFunction: OperatorFunction<Disclosure.Unspecified<R0>,R1>,
    makeInitial: (first: Disclosure.Unspecified<R0>) => R2
): R1 | R2;
export function useRepreselector<TState, R0>(
    represelector: (state: TState) => Representative<R0>,
    operatorFunction?: OperatorFunction<Disclosure.Unspecified<R0>,unknown>,
    makeInitial?: (first: Disclosure.Unspecified<R0>) => unknown
) {
    const store$ = useStoreSubject<TState>();

    const possiblyLastDisclosure = useMemo(() => {
        let last: Disclosure.Unspecified<R0> | null = null;
        return (d: Disclosure.Unspecified<R0>) => {
            const ret = (last !== null) && Disclosure.equality(last, d) ? last : d;
            last = ret;
            return ret;
        };  
    }, []);

    const { stream$, init } = useMemo(() => {
        const stream$ = store$.pipe(
            switchMap((state: TState) => {
                const r = represelector(state);
                r.value$.subscribe();
                return r.disclose$;
            }),
            map(possiblyLastDisclosure),
            operatorFunction ?? ( (x$: RxJsObservable<Disclosure.Unspecified<R0>>) => x$ )
        );

        const init = 
            makeInitial != null ?
                () => makeInitial(possiblyLastDisclosure(represelector(store$.getValue()).disclose())) 
            : operatorFunction == null ?
                () => possiblyLastDisclosure(represelector(store$.getValue()).disclose())
            : ( () => null );

        return { stream$, init };
    }, [makeInitial, operatorFunction, represelector, store$, possiblyLastDisclosure]);

    const ret = useObservable(stream$, init);

    return ret;
}
