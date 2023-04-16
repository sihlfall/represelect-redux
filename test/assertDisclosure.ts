import assert, { AssertionError } from "assert";
import { Disclosure } from "represelect";

/* eslint-disable  @typescript-eslint/no-explicit-any */

// from https://github.com/browserify/commonjs-assert/blob/master/assert.js
function innerFail(obj: any) {
  if (obj.message instanceof Error) throw obj.message;

  throw new assert.AssertionError(obj);
}

const statusCodeKeyMap: { [code: number]: keyof typeof Disclosure.Status | undefined } = (function () {
  let obj: any = {};
  for (let [ key, code ] of Object.entries(Disclosure.Status)) obj[code] = key;
  return obj;
}) ();

function innerAssertStatus<
  D extends Disclosure.Unspecified<unknown>,
  S
> (
  stackStartFn: (...args: any) => any, d: D, expectedStatus: S & Disclosure.Status, message?: string | Error
):
asserts d is D & { status: S } {
  if (d.status !== expectedStatus) {

    const details = message ? `: ${message}` : '.';

    const actual = `${statusCodeKeyMap[d.status] ?? "[unknown code]"} (${d.status})`;
    const expected = `${statusCodeKeyMap[expectedStatus] ?? "[unknown code]"} (${expectedStatus})`;

    innerFail({
      actual: actual,
      expected: expected,
      message: `Expected status ${expected}, but actual status is ${actual}${details}`,
      operator: stackStartFn.name,
      stackStartFn
    });
  }
}

export function assertStatus<
  D extends Disclosure.Unspecified<unknown>,
  S
> (
  d: D, expectedStatus: S & Disclosure.Status, message?: string | Error
):
asserts d is D & { status: S } {
  innerAssertStatus(assertStatus, d, expectedStatus, message);
}




export function assertSuccess<Value>(
  d: Disclosure.Unspecified<Value>,
  expectedValue: Value
): asserts d is Disclosure.Success<Value> {
  innerAssertStatus(assertSuccess, d, Disclosure.Status.SUCCESS);
  try {
    assert.deepStrictEqual(d.value, expectedValue);
  } catch (e) {
    if (e instanceof assert.AssertionError) {
      throw new AssertionError({
        message: "Success disclosure carries an unexpected value. " + e.message,
        actual: e.actual,
        expected: e.expected,
        operator: e.operator,
        stackStartFn: assertSuccess
      });
    } else {
      throw e;
    }
  }
}
