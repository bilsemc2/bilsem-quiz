export interface AppError {
    message: string;
    cause?: unknown;
}

export type Result<T, E = AppError> =
    | { ok: true; data: T }
    | { ok: false; error: E };

export const ok = <T>(data: T): Result<T> => ({
    ok: true,
    data
});

export const err = <E>(error: E): Result<never, E> => ({
    ok: false,
    error
});
