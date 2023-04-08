import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useStore } from 'react-redux';
import type { Representative } from 'represelect';
import { Disclosure, makeInactiveDisclosure } from './represelect_stuff';
import { BehaviorSubject, from, OperatorFunction, switchMap, Observable } from 'rxjs';

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
export function useObservable<V,W>(
    observable$: Observable<V>,
    initializer: () => W
): V | W;
export function useObservable<V,R1,R2 = R1>(
    observable$: Observable<V>,
    initializer: () => R1,
    operatorFunction : OperatorFunction<V,R2>
): R1 | R2;
export function useObservable<V>(
    observable$: Observable<V>,
    initalizer: () => unknown = () => null,
    operatorFunction?: OperatorFunction<V,unknown>
) {
    const [ holder ] = useState<{ r: unknown }>(() => ({ r: initalizer() }));

    const subscribe = useCallback((notify: () => void) => {
        const subscription =
            ( operatorFunction != null ? operatorFunction(observable$) : observable$ )
                .subscribe((r: unknown) => { holder.r = r; notify(); });
        return () => subscription.unsubscribe();
    }, [holder, observable$, operatorFunction]);

    const getSnapshot = useCallback(() => holder.r, [holder]);

    const ret = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    return ret;
}



export function useRepreselector<TState, Selected>(
    represelector: (state: TState) => Representative<Selected>
): Disclosure<Selected>;
export function useRepreselector<TState, Selected,T1>(
    represelector: (state: TState) => Representative<Selected>,
    transformation: OperatorFunction<Disclosure<Selected>,T1>
): T1;
export function useRepreselector<TState, Selected>(
    represelector: (state: TState) => Representative<Selected>,
    transformation?: any
): any {
    const store$ = useStoreSubject<TState>();

    // FIXME: add initializer parameter
    const [ holder ] = useState<{ d: any }>(() => ({ d: makeInactiveDisclosure() }));

    const subscr = useCallback((listener: () => void) => {
        const x$ = store$.pipe(
            switchMap((state: TState) => {
                const r = represelector(state);
                r.value$.subscribe();
                return r.disclose$;
            })
        );
        const y$ = (transformation != null) ? transformation(x$) : x$;
        const subscription = y$.subscribe((d: any) => {
            holder.d = d;
            listener();
        });
        return () => subscription.unsubscribe();
    }, [holder, represelector, store$, transformation]);

    const getSnapshot = useCallback(() => holder.d, [holder]);

    const disclosure = useSyncExternalStore(subscr, getSnapshot, getSnapshot);

    return disclosure;
}
