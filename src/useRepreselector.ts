import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useStore } from 'react-redux';
import { BUSY, ERROR, INACTIVE, Representative, SUCCESS } from 'represelect';
import { Disclosure } from './represelect_stuff';
import { BehaviorSubject, from, map, OperatorFunction, switchMap, Observable } from 'rxjs';

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

export function useObservable<V>(
    observable$: Observable<V>
): V | null;
export function useObservable<V,W = V>(
    observable$: Observable<V>,
    makeInitial: () => W
): V | W;
export function useObservable<V>(
    observable$: Observable<V>,
    makeInitial: () => any = () => null
) {
    const [ holder ] = useState<{ r: unknown }>(() => ({ r: makeInitial() }));

    const subscribe = useCallback((notify: () => void) => {
        const subscription = observable$.subscribe((r: unknown) => {
            holder.r = r;
            notify();
        });
        return () => subscription.unsubscribe();
    }, [holder, observable$]);

    const getSnapshot = useCallback(() => holder.r, [holder]);

    const ret = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    return ret;
}


export function useRepreselector<TState, Value>(
    represelector: (state: TState) => Representative<Value>
): Disclosure<Value>;
export function useRepreselector<TState, Value, R1>(
    represelector: (state: TState) => Representative<Value>,
    operatorFunction: OperatorFunction<Disclosure<Value>,R1>
): R1 | null;
export function useRepreselector<TState, Value, R1, R2 = R1>(
    represelector: (state: TState) => Representative<Value>,
    operatorFunction: OperatorFunction<Disclosure<Value>,R1>,
    makeInitial: (first: Disclosure<Value>) => R2
): R1 | R2;
export function useRepreselector<TState, Value>(
    represelector: (state: TState) => Representative<Value>,
    operatorFunction?: OperatorFunction<Disclosure<Value>,unknown>,
    makeInitial?: (first: Disclosure<Value>) => unknown
) {
    const store$ = useStoreSubject<TState>();

    const possiblyLastDisclosure = useMemo(() => {
        let last: Disclosure<Value> | null = null;
        return (d: Disclosure<Value>) => {
            const ret = (last !== null) &&
                ((last.status === INACTIVE && d.status === INACTIVE) ||
                (last.status === BUSY && d.status === BUSY) ||
                (last.status === SUCCESS && d.status === SUCCESS && last.value === d.value) ||
                (last.status === ERROR && d.status === ERROR && last.reason === d.reason)) ?
                    last 
                :
                    d;
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
            operatorFunction ?? ( (x$: Observable<Disclosure<Value>>) => x$ )
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
