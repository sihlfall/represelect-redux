import React, { PropsWithChildren } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Store } from 'redux';

// adapted from https://redux.js.org/usage/writing-tests

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