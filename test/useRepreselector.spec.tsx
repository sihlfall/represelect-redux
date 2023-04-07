import React from 'react';
import assert from 'assert';
import { render } from '@testing-library/react';
import { act } from '@testing-library/react-hooks/dom';
import { afterEach, beforeEach } from 'mocha';
import { TestComponent } from './testComponent';

describe("useRepreselector", function () {

  it("does something", function () {
    const { container } = render(<TestComponent />);
    assert.deepStrictEqual(container?.textContent, "This is my test components.");
  });
});