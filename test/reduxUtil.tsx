import React, { PropsWithChildren } from 'react';
//import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { renderHook } from '@testing-library/react-hooks';

// adapted from https://redux.js.org/usage/writing-tests
/*
export function renderWithProviders<TState>(
  ui: React.ReactElement,
  store: Store<TState>,
  renderOptions: Omit<RenderOptions, 'queries'> = {}
) {
  function Wrapper({ children }: PropsWithChildren<object>): JSX.Element {
    return <Provider store={store}>{children}</Provider>;
  }

  // Return an object with the store and all of RTL's query functions
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
*/

// adapted from https://react-hooks-testing-library.com/usage/advanced-hooks

export function renderHookWithProvider<TSelectorResult, TState>(
  callback: () => TSelectorResult,
  store: Store<TState>
) {
  const wrapper = ({ children }: { children: JSX.Element }) => <Provider store={store}>{children}</Provider>;
  return { store, ...renderHook(callback, { wrapper }) };
  
}
