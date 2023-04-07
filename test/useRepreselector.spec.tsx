import React from 'react';
import { createStore } from 'redux';
import { TestComponent } from './testComponent';
import { renderWithProviders } from './reduxUtil';
import { INCREMENT_ACTION, reducer } from './testCoreRedux';
import { act } from '@testing-library/react';
import assert from 'assert';

describe("useRepreselector", function () {
  it("does something", function () {
    const store = createStore(reducer);
    const { container } = renderWithProviders(<TestComponent />, store);
    assert.deepStrictEqual(container?.textContent, "This is my test component. 101");
    act( () => { store.dispatch({ type: INCREMENT_ACTION }) });
    console.log(store.getState());
    assert.deepStrictEqual(container?.textContent, "This is my test component. 102");
  });
});