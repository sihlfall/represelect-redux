import { TypedUseSelectorHook, useSelector } from 'react-redux';
import type { AnyAction } from 'redux';

export type RootState = { n: number };

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const selectN = (state: RootState) => state.n;

export const INCREMENT_ACTION = "INCREMENT_ACTION";
export const initialState: RootState = { n: 101 };

export function reducer(state: RootState = initialState, action: AnyAction) {
  switch (action.type) {
    case INCREMENT_ACTION:
      return { ...state, n: state.n + 1 };
    default:
      return state;
  }
}
