import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useStore } from 'react-redux';
import type { Representative } from 'represelect';
import { Disclosure, makeInactiveDisclosure } from './represelect_stuff';
import { BehaviorSubject, from, OperatorFunction, switchMap } from 'rxjs';

/* eslint-disable  @typescript-eslint/no-explicit-any */

export function useStoreSubject<TState>() {
    const store = useStore<TState>();

    const [ store$ ] = useState(() => new BehaviorSubject(store.getState()));

    useEffect(() => {
        const subscription = from(store).subscribe(state => store$.next(state));
        return () => subscription.unsubscribe();
    }, [store, store$]);

    return store$;
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
