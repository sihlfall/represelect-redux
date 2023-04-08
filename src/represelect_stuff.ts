
export const INACTIVE = 0 as const;
export const BUSY = 1 as const;
export const SUCCESS = 2 as const;
export const ERROR = 4 as const;

  export type InactiveDisclosure<Value, Err> = {
    readonly status: typeof INACTIVE
  };
  export type BusyDisclosure<Value, Err = unknown> = {
    readonly status: typeof BUSY
  };
  export type SuccessDisclosure<Value> = {
    readonly status: typeof SUCCESS
    readonly value: Value
  };
  export type ErrorDisclosure<Err = unknown> = {
    readonly status: typeof ERROR
    readonly reason: Err
  };
  export type CompletedDisclosure<Value, Err = unknown> = 
    SuccessDisclosure<Value>
    | ErrorDisclosure<Err>;
  export type Disclosure<Value, Err = unknown> =
    InactiveDisclosure<Value, Err>
    | BusyDisclosure<Value, Err>
    | SuccessDisclosure<Value>
    | ErrorDisclosure<Err>;
  
  export function makeInactiveDisclosure<Value, Err> (
  ): InactiveDisclosure<Value, Err> {
    return { status: INACTIVE };
  }
  export function makeBusyDisclosure<Value, Err> (
  ): BusyDisclosure<Value, Err> {
    return { status: BUSY };
  }
  export function makeSuccessDisclosure<Value> (
    value: Value
  ): SuccessDisclosure<Value> {
    return { status: SUCCESS, value };
  }
  export function makeErrorDisclosure<Err> (
    reason: Err
  ): ErrorDisclosure<Err> {
    return { status: ERROR, reason };
  }