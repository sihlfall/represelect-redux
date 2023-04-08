import { BehaviorSubject } from 'rxjs';
import { act, renderHook } from '@testing-library/react-hooks';
import assert from 'assert';

import { useObservable } from '../src/useRepreselector';

describe("useObservable", function () {
  it("delivers the initial values, as well as the emitted values", function () {
    const subj = new BehaviorSubject(1000);

    const { result, unmount } = renderHook(
      () => useObservable<number>(subj)
    );

    act(() => subj.next(2000));

    act(() => subj.next(3000));

    assert.deepStrictEqual(result.all, [null, 1000, 2000, 3000]);

    unmount();
  });

});