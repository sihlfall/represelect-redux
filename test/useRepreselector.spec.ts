import { legacy_createStore as createStore } from 'redux';

import { act } from '@testing-library/react-hooks';
import assert from 'assert';

import { TypedUseRepreselectorHook, useRepreselector } from '../src/useRepreselector';
import { Disclosure, createRepreselector } from 'represelect';
import * as RepreselectAssert from '@sihlfall/represelect-assert';


import { INCREMENT_ACTION, RootState, reducer } from './testCoreRedux';
import { renderHookWithProvider } from './reduxUtil';

const represelectPlusOneHundred = createRepreselector(
  (state: RootState) => state.n, (x: number) => x + 100
);

const useAppRepreselector: TypedUseRepreselectorHook<RootState> = useRepreselector;

describe("useRepreselector", function () {
  it("initially uses the initial value", function () {
    const { result, unmount } = renderHookWithProvider(
      () => useAppRepreselector(represelectPlusOneHundred), createStore(reducer)
    );

    RepreselectAssert.Disclosure.successWith(result.current, 201);
    unmount();
  });


  it("delivers the correct value on the first emission on the stream", function () {
    const { store, result, unmount } = renderHookWithProvider(
      () => useAppRepreselector(represelectPlusOneHundred), createStore(reducer)
    );
    act( () => void store.dispatch({ type: INCREMENT_ACTION }) );
    RepreselectAssert.Disclosure.successWith(result.current, 202);
    unmount();
  });

  it("delivers the correct value on the second emission on the stream", function () {
    const { store, result, unmount } = renderHookWithProvider(
      () => useAppRepreselector(represelectPlusOneHundred), createStore(reducer)
    );
    act( () => void store.dispatch({ type: INCREMENT_ACTION }) );
    act( () => void store.dispatch({ type: INCREMENT_ACTION }) );
    RepreselectAssert.Disclosure.successWith(result.current, 203);
    unmount();
  });

  it("applies value transformation to initial value", function () {
    const valueTransformation = d => (Disclosure.isSuccess(d) ? [d.value] : []);
    const { result, unmount } = renderHookWithProvider(
      () => useAppRepreselector(represelectPlusOneHundred, { valueTransformation }), createStore(reducer)
    );
    assert.deepStrictEqual(result.current, [ 201 ]);
    unmount();
  });

  it("applies value transformation for the first emission on the stream", function () {
    const valueTransformation = d => (Disclosure.isSuccess(d) ? [d.value] : []);
    const { store, result, unmount } = renderHookWithProvider(
      () => useAppRepreselector(represelectPlusOneHundred, { valueTransformation }), createStore(reducer)
    );
    act( () => void store.dispatch({ type: INCREMENT_ACTION }) );
    assert.deepStrictEqual(result.current, [ 202 ]);
    unmount();
  });

  it("applies value transformation for the second emission on the stream", function () {
    const valueTransformation = d => (Disclosure.isSuccess(d) ? [d.value] : []);
    const { store, result, unmount } = renderHookWithProvider(
      () => useAppRepreselector(represelectPlusOneHundred, { valueTransformation }), createStore(reducer)
    );
    act( () => void store.dispatch({ type: INCREMENT_ACTION }) );
    act( () => void store.dispatch({ type: INCREMENT_ACTION }) );
    assert.deepStrictEqual(result.current, [ 203 ]);
    unmount();
  })

});