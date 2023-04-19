import { Observable, Subject } from 'rxjs';

import { act, renderHook } from '@testing-library/react-hooks';
import assert from 'assert';

import { useWithRepreselector } from '../src/useWithRepreselector';
import { Disclosure, createRepreselector } from 'represelect';
import * as RepreselectAssert from 'represelect-assert';

const represelectPlusOneHundred = createRepreselector( (x: number) => x, (x: number) => x + 100);

describe("useWithRepreselector", function () {
  it("initially uses the initial value", function () {
    const subj = new Subject<number> ();
    const { result, unmount } = renderHook(
      () => useWithRepreselector(subj, () => 5, represelectPlusOneHundred)
    );
    RepreselectAssert.Disclosure.successWith(result.current, 105);
    unmount();
  });

  it("delivers the correct value on the first emission on the stream", function () {
    const subj = new Subject<number> ();
    const { result, unmount } = renderHook(
      () => useWithRepreselector(subj, () => 5, represelectPlusOneHundred)
    );
    act( () => subj.next(10) );
    RepreselectAssert.Disclosure.successWith(result.current, 110);
    unmount();
  });

  it("delivers the correct value on the second emission on the stream", function () {
    const subj = new Subject<number> ();
    const { result, unmount } = renderHook(
      () => useWithRepreselector(subj, () => 5, represelectPlusOneHundred)
    );
    act( () => subj.next(10) );
    act( () => subj.next(15) );
    RepreselectAssert.Disclosure.successWith(result.current, 115);
    unmount();
  });

  it("applies value transformation to initial value", function () {
    const subj = new Subject<number> ();
    const valueTransformation = d => (Disclosure.isSuccess(d) ? [d.value] : []);
    const { result, unmount } = renderHook(
      () => useWithRepreselector(
        subj,
        () => 5,
        represelectPlusOneHundred,
        { valueTransformation }
      )
    );
    assert.deepStrictEqual(result.current, [ 105 ]);
    unmount();
  });

  it("applies value transformation for the first emission on the stream", function () {
    const subj = new Subject<number> ();
    const valueTransformation = d => (Disclosure.isSuccess(d) ? [d.value] : []);
    const { result, unmount } = renderHook(
      () => useWithRepreselector(
        subj,
        () => 5,
        represelectPlusOneHundred,
        { valueTransformation })
    );
    act( () => subj.next(10) );
    assert.deepStrictEqual(result.current, [ 110 ]);
    unmount();
  });

  it("applies value transformation for the second emission on the stream", function () {
    const subj = new Subject<number> ();
    const valueTransformation = d => (Disclosure.isSuccess(d) ? [d.value] : []);
    const { result, unmount } = renderHook(
      () => useWithRepreselector(
        subj,
        () => 5,
        represelectPlusOneHundred,
        { valueTransformation })
    );
    act( () => subj.next(10) );
    act( () => subj.next(15) );
    assert.deepStrictEqual(result.current, [ 115 ]);
    unmount();
  });

  it("unsubscribes from the stream on unmounting", function () {
    let nSubscriptions = 0;
    const countSubscriptions = <T> (stream: Observable<T>) => new Observable<T>(subscribe => {
      ++nSubscriptions;
      const subscription = stream.subscribe(subscribe);
      return () => { --nSubscriptions; subscription.unsubscribe(); }
    });
    
    const subj = new Subject<number> ();
    const { unmount } = renderHook(
      () => useWithRepreselector(subj.pipe(countSubscriptions), () => 5, represelectPlusOneHundred)
    );
    assert.strictEqual(nSubscriptions, 1);
    act( () => subj.next(10) );
    act( () => subj.next(15) );
    unmount();
    assert.strictEqual(nSubscriptions, 0);
  });
});  
