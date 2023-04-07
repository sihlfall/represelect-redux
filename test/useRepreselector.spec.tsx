import React from 'react';
import assert from 'assert';
import { render } from '@testing-library/react';
import { act } from '@testing-library/react-hooks/dom';
import { afterEach, beforeEach } from 'mocha';
import { TestComponent } from './testComponent';
import { createStore } from 'redux';
import { renderWithProviders } from './reduxUtil';
import { reducer } from './testCoreRedux';

describe("useRepreselector", function () {
  it("does something", function () {
    const store = createStore(reducer);
    const { container } = renderWithProviders(<TestComponent />, store);
    assert.deepStrictEqual(container?.textContent, "This is my test components.");
  });
});