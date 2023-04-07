import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useStore } from 'react-redux'
import { Representative } from 'represelect'
import { Disclosure, makeInactiveDisclosure } from 'represelect/es/representative'
import { BehaviorSubject, from, OperatorFunction, switchMap } from 'rxjs'

function useStoreSubject<TState>() {
    const store = useStore<TState>();

    const [ store$ ] = useState(() => new BehaviorSubject(store.getState()));

    useEffect(() => {
        const subscription = from(store).subscribe(state => store$.next(state));
        return () => subscription.unsubscribe();
    }, [store]);

    return store$;
}

export function useRepreselector<TState, Selected extends unknown,T1>(
    represelector: (state: TState) => Representative<Selected>
): Disclosure<Selected>;
export function useRepreselector<TState, Selected extends unknown,T1>(
    represelector: (state: TState) => Representative<Selected>,
    transformation: OperatorFunction<Disclosure<Selected>,T1>
): T1;
export function useRepreselector<TState, Selected extends unknown>(
    represelector: (state: TState) => Representative<Selected>,
    transformation?: any
): any {
    const store$ = useStoreSubject<TState>();

    // FIXME: add initializer parameter
    const [ holder ] = useState<{ d: any }>(() => ({ d: makeInactiveDisclosure() }));

    const subscr = useMemo(() => (listener: () => void) => {
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
    }, []);

    const getSnapshot = useMemo(() => () => holder.d, []);

    const disclosure = useSyncExternalStore(subscr, getSnapshot, getSnapshot);

    return disclosure;
}
