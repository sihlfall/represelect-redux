import { useStore } from 'react-redux';
import type { Disclosure, Representative } from 'represelect';
import type { Transformation } from './types';
import { useWithRepreselector } from './useWithRepreselector';

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
