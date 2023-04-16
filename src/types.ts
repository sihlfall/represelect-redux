import type { Observable } from 'redux';

export type Transformation<T0,T1,TI=T0> = Record<string,never> |
  { 
    valueTransformation: (v: T0) => T1,
    streamTransformation?: undefined
  } | {
    valueTransformation?: undefined,
    streamTransformation: (stream: Observable<T0>) => Observable<T1>
  } | {
    valueTransformation: (v: T0) => TI,
    streamTransformation: (stream: Observable<TI>) => Observable<T1>
  };
