import { legacy_createStore as createStore } from 'redux';
import { map } from 'rxjs';
import { renderHookWithProvider } from './reduxUtil';
import { INCREMENT_ACTION, RootState, reducer } from './testCoreRedux';
import { act } from '@testing-library/react-hooks';
import assert from 'assert';

import { useStoreSubject } from '../src/useRepreselector';
import { Subscription } from 'rxjs';

function usingSubscription(subscription: Subscription, action: () => void) {
  try { action(); } finally { subscription.unsubscribe(); }
}

describe("useStoreSubject returns an observable that", function () {
  it("emits the current state on subscription, before any dispatch", function () {
    const { result } = renderHookWithProvider(
      () => useStoreSubject<RootState>(), createStore(reducer)
    );

    let observed = [] as number[];

    usingSubscription(
      result.current.pipe(
        map(state => state.n)
      ).subscribe({ next(n) { observed.push(n); }})
    , () => {
      assert.deepStrictEqual(observed, [101]);
    });
  });

  it("emits the current state on subscription, after first dispatch", function () {
    const { store, result } = renderHookWithProvider(
      () => useStoreSubject<RootState>(), createStore(reducer)
    );

    let observed = [] as number[];

    act( () => { store.dispatch({ type: INCREMENT_ACTION }) } );

    usingSubscription(
      result.current.pipe(
        map(state => state.n)
      ).subscribe({ next(n) { observed.push(n); }})
    , () => {
      assert.deepStrictEqual(observed, [102]);
    });
  });

  it("emits the current state on subscription, after second dispatch", function () {
    const { store, result } = renderHookWithProvider(
      () => useStoreSubject<RootState>(), createStore(reducer)
    );

    let observed = [] as number[];

    act( () => { store.dispatch({ type: INCREMENT_ACTION }) } );
    act( () => { store.dispatch({ type: INCREMENT_ACTION }) } );

    usingSubscription(
      result.current.pipe(
        map(state => state.n)
      ).subscribe({ next(n) { observed.push(n); }})
    , () => {
      assert.deepStrictEqual(observed, [103]);
    });
  });

  it("continues emitting the state", function () {
    const { store, result } = renderHookWithProvider(
      () => useStoreSubject<RootState>(), createStore(reducer)
    );

    let observed = [] as number[];

    usingSubscription(
      result.current.pipe(
        map(state => state.n)
      ).subscribe({ next(n) { observed.push(n); }})
    , () => {
      act( () => { store.dispatch({ type: INCREMENT_ACTION }) } );
      act( () => { store.dispatch({ type: INCREMENT_ACTION }) } );  
      assert.deepStrictEqual(observed, [101, 102, 103]);
    });
  });

  it("unsubscribes from the store on unmounting", function () {
    const { store, result, unmount } = renderHookWithProvider(
      () => useStoreSubject<RootState>(), createStore(reducer)
    );

    let observed = [] as number[];

    usingSubscription(
      result.current.pipe(
        map(state => state.n)
      ).subscribe({ next(n) { observed.push(n); }})
    , () => {
      act( () => { store.dispatch({ type: INCREMENT_ACTION }) } );
      assert.deepStrictEqual(observed, [101, 102]);
      unmount();
      act( () => { store.dispatch({ type: INCREMENT_ACTION }) } );  
      assert.deepStrictEqual(observed, [101, 102]);
    });
  });

});