import type { Observable } from 'redux';

export type Transformation<T0,T1,TI=T0> = Record<string,never> |
  { 
    transformValue: (v: T0) => T1,
    transformStream?: undefined
  } | {
    transformValue?: undefined,
    transformStream: (stream: Observable<T0>) => Observable<T1>
  } | {
    transformValue: (v: T0) => TI,
    transformStream: (stream: Observable<TI>) => Observable<T1>
  };
