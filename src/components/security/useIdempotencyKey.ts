'use client';

import { useCallback, useRef } from 'react';

export const IDEMPOTENCY_HEADER = 'idempotency-key';

/**
 * One key per deliberate action, reused while that action is being retried.
 *
 * `current(payload)` hands out the same key until `settle(response)` sees a
 * definite answer from the server. A dropped connection or a 5xx keeps the
 * key, so the retry is recognised as the same request; anything else rotates
 * it. A changed payload also rotates it, because a retry with different input
 * is a different action and must not be answered with the old response.
 */
export function useIdempotencyKey() {
  const key = useRef<{ value: string; payload: string } | null>(null);

  const current = useCallback((payload: string): string => {
    if (!key.current || key.current.payload !== payload) {
      key.current = { value: crypto.randomUUID(), payload };
    }
    return key.current.value;
  }, []);

  const settle = useCallback((response: Response) => {
    const inProgress = response.status === 409 && response.headers.has('retry-after');
    if (response.status < 500 && !inProgress) key.current = null;
  }, []);

  return { current, settle };
}
