import { Subject } from 'rxjs';

import { act, renderHook } from '@testing-library/react-hooks';
import assert from 'assert';

import { useWithRepreselector } from '../src/useRepreselector';
import { Disclosure, createRepreselector } from 'represelect';
import { assertSuccess } from './assertDisclosure';

const represelectPlusOneHundred = createRepreselector( (x: number) => x, (x: number) => x + 100);

describe("useWithRepreselector", function () {
  it("initially uses the initial value", function () {
    const subj = new Subject<number> ();
    const { result, unmount } = renderHook(
      () => useWithRepreselector(subj, () => 5, represelectPlusOneHundred)
    );
    assertSuccess(result.current, 105);
    unmount();
  });

  it("delivers the correct value on the first emission on the stream", function () {
    const subj = new Subject<number> ();
    const { result, unmount } = renderHook(
      () => useWithRepreselector(subj, () => 5, represelectPlusOneHundred)
    );
    act( () => subj.next(10) );
    assertSuccess(result.current, 110);
    unmount();
  });

  it("delivers the correct value on the second emission on the stream", function () {
    const subj = new Subject<number> ();
    const { result, unmount } = renderHook(
      () => useWithRepreselector(subj, () => 5, represelectPlusOneHundred)
    );
    act( () => subj.next(10) );
    act( () => subj.next(15) );
    assertSuccess(result.current, 115);
    unmount();
  });

  it("applies value transformation to initial value", function () {
    const subj = new Subject<number> ();
    const transformValue = d => (Disclosure.isSuccess(d) ? [d.value] : []);
    const { result, unmount } = renderHook(
      () => useWithRepreselector(
        subj,
        () => 5,
        represelectPlusOneHundred,
        { transformValue }
      )
    );
    assert.deepStrictEqual(result.current, [ 105 ]);
    unmount();
  });

  it("applies value transformation for the first emission on the stream", function () {
    const subj = new Subject<number> ();
    const transformValue = d => (Disclosure.isSuccess(d) ? [d.value] : []);
    const { result, unmount } = renderHook(
      () => useWithRepreselector(
        subj,
        () => 5,
        represelectPlusOneHundred,
        { transformValue })
    );
    act( () => subj.next(10) );
    assert.deepStrictEqual(result.current, [ 110 ]);
    unmount();
  });

  it("applies value transformation for the second emission on the stream", function () {
    const subj = new Subject<number> ();
    const transformValue = d => (Disclosure.isSuccess(d) ? [d.value] : []);
    const { result, unmount } = renderHook(
      () => useWithRepreselector(
        subj,
        () => 5,
        represelectPlusOneHundred,
        { transformValue })
    );
    act( () => subj.next(10) );
    act( () => subj.next(15) );
    assert.deepStrictEqual(result.current, [ 115 ]);
    unmount();
  })

});