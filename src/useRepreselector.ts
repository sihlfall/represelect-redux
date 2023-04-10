import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useStore } from 'react-redux';
import { Disclosure, Representative } from 'represelect';
import { BehaviorSubject, from, map, OperatorFunction, switchMap, Observable as RxJsObservable, ObservableInput } from 'rxjs';
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

export type BehaviorStream<T> = InteropObservable<T> & { getValue: () => T };

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

interface Subscribable<T> {
    subscribe(observer: Partial<Observer<T>>): { unsubscribe: () => void };
}

export type InteropObservable<T> = object;

export function useObservable<T>(
    observable: InteropObservable<T>
): T | null;
export function useObservable<T,I=T>(
    observable: InteropObservable<T>,
    getInitial: () => I
): T | I;
export function useObservable<T>(
    observable: InteropObservable<T>,
    getInitial: () => unknown = () => null
) {
    const [ holder ] = useState<{ t: unknown }>(() => ({ t: getInitial() }));

    const subscribe = useCallback((notify: () => void) => {
        console.log("***************", Symbol_observable);
        console.log("***************", RxJS_Symbol_observable);
        console.log("***************", Symbol.observable);
        console.log((() => (typeof Symbol === 'function' && Symbol.observable) || '@@observable')())
        const obs = (observable as any)[Symbol_observable]() as Subscribable<T>;

        const subscription = obs.subscribe({
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

export function useWithRepreselector<T, R0> (
    behaviorStream: BehaviorStream<T>,
    represelector: (state: T) => Representative<R0>
): R0;
export function useWithRepreselector<T, R0, R1>(
    behaviorStream: BehaviorStream<T>,
    represelector: (state: T) => Representative<R0>,
    operatorFunction: OperatorFunction<Disclosure.Unspecified<R0>,R1>
): R1 | null;
export function useWithRepreselector<T, R0, R1, R2 = R1>(
    behaviorStream: BehaviorStream<T>,
    represelector: (state: T) => Representative<R0>,
    operatorFunction: OperatorFunction<Disclosure.Unspecified<R0>,R1>,
    makeInitial: (first: Disclosure.Unspecified<R0>) => R2
): R1 | R2;
export function useWithRepreselector<T, R0>(
    behaviorStream: BehaviorStream<T>,
    represelector: (state: T) => Representative<R0>,
    operatorFunction?: OperatorFunction<Disclosure.Unspecified<R0>,unknown>,
    makeInitial?: (first: Disclosure.Unspecified<R0>) => unknown
) {
    const possiblyLastDisclosure = useMemo(() => {
        let last: Disclosure.Unspecified<R0> | null = null;
        return (d: Disclosure.Unspecified<R0>) => {
            const ret = (last !== null) && Disclosure.equality(last, d) ? last : d;
            last = ret;
            return ret;
        };  
    }, []);

    const subj = useMemo(() => {
        const init = 
            makeInitial != null ?
                makeInitial(possiblyLastDisclosure(represelector(behaviorStream.getValue()).disclose())) 
            : operatorFunction == null ?
                possiblyLastDisclosure(represelector(behaviorStream.getValue()).disclose())
            : ( () => null );

        return new BehaviorSubject(init);
    }, [makeInitial, operatorFunction, represelector, behaviorStream, possiblyLastDisclosure]);

    useEffect(() => {
        const subscription = from(behaviorStream as unknown as ObservableInput<T>).pipe(
            switchMap((state: T) => {
                const r = represelector(state);
                r.value$.subscribe();
                return r.disclose$;
            }),
            map(possiblyLastDisclosure),
            operatorFunction ?? ( (x$: RxJsObservable<Disclosure.Unspecified<R0>>) => x$ )
        ).subscribe(subj);
        return () => subscription.unsubscribe();
    }, [behaviorStream, subj, operatorFunction, possiblyLastDisclosure, represelector]);

    const ret = useBehaviorStream(subj);

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
