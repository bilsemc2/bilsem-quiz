export const DEFAULT_POST_LOGIN_PATH = '/bilsem';

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null;
};

const isSafeInternalPath = (value: string) => value.startsWith('/');

export const resolvePostLoginPath = (
    state: unknown,
    fallbackPath = DEFAULT_POST_LOGIN_PATH
): string => {
    if (!isRecord(state) || !('from' in state)) {
        return fallbackPath;
    }

    const from = state.from;

    if (typeof from === 'string') {
        return isSafeInternalPath(from) ? from : fallbackPath;
    }

    if (!isRecord(from)) {
        return fallbackPath;
    }

    const pathname = typeof from.pathname === 'string' ? from.pathname : '';

    if (!isSafeInternalPath(pathname)) {
        return fallbackPath;
    }

    const search = typeof from.search === 'string' ? from.search : '';
    const hash = typeof from.hash === 'string' ? from.hash : '';

    return `${pathname}${search}${hash}`;
};
