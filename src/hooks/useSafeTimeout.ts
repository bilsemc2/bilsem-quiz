import { useCallback, useEffect, useRef } from 'react';

/**
 * A safe wrapper around setTimeout that automatically clears all pending
 * timeouts when the component unmounts. This prevents memory leaks and
 * state updates on unmounted components.
 *
 * Usage:
 *   const safeTimeout = useSafeTimeout();
 *   safeTimeout(() => { doSomething(); }, 1500);
 */
export function useSafeTimeout() {
    const ids = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

    useEffect(() => {
        return () => {
            ids.current.forEach(clearTimeout);
            ids.current.clear();
        };
    }, []);

    const safeTimeout = useCallback((fn: () => void, delay: number) => {
        const id = setTimeout(() => {
            ids.current.delete(id);
            fn();
        }, delay);
        ids.current.add(id);
        return id;
    }, []);

    return safeTimeout;
}
