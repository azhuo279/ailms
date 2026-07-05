/**
 * Trailing-edge debounce — replaces `lodash.debounce` to keep the core
 * dependency-free. Returns the wrapped fn plus a `.flush()` to force-run any
 * pending call (used to persist immediately before unload).
 */
export interface Debounced<A extends unknown[]> {
  (...args: A): void;
  flush(): void;
  cancel(): void;
}

export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: A | null = null;

  const run = () => {
    timer = null;
    if (lastArgs) {
      const args = lastArgs;
      lastArgs = null;
      fn(...args);
    }
  };

  const debounced = ((...args: A) => {
    lastArgs = args;
    if (timer != null) clearTimeout(timer);
    timer = setTimeout(run, wait);
  }) as Debounced<A>;

  debounced.flush = () => {
    if (timer != null) {
      clearTimeout(timer);
      run();
    }
  };

  debounced.cancel = () => {
    if (timer != null) clearTimeout(timer);
    timer = null;
    lastArgs = null;
  };

  return debounced;
}
