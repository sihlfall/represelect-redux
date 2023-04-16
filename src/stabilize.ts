export function createStabilizer<T>(equality: (t1: T, t2: T) => boolean) {
  let last: T | null = null;
  return (t: T) => {
      const ret = (last !== null) && equality(last, t) ? last : t;
      last = ret;
      return ret;
  };
}




