
import { legacy_createStore as createStore } from 'redux';
import { map } from 'rxjs';
import { renderHookWithProvider } from './reduxUtil';
import { INCREMENT_ACTION, RootState, reducer, selectN, useAppSelector } from './testCoreRedux';
import { act } from '@testing-library/react-hooks';
import assert from 'assert';

import { useStoreSubject } from '../src/useRepreselector';

describe("useStoreSubject", function () {
  it("does something", function () {
    const store = createStore(reducer);
    const observed = [] as number[];
    const { result } = renderHookWithProvider(
      () => useStoreSubject<RootState>(),
      store
    );
    const subscription = result.current.pipe(
      map(state => state.n)
    ).subscribe({ next(n) { observed.push(n); }});
    act( () => { store.dispatch({ type: INCREMENT_ACTION }) });
    assert.deepStrictEqual(observed, [101, 102]);
    subscription.unsubscribe();
  });
});