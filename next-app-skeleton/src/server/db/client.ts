import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';

export interface DatabaseClient {
  query<TRow extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[],
  ): Promise<TRow[]>;
}

export interface DbRetryConfig {
  attempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface DbTelemetryConfig {
  enabled: boolean;
  slowQueryMs: number;
  logAllQueries: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __bilsemPgPool: Pool | undefined;
}

const RETRYABLE_PG_CODES = new Set([
  '40001',
  '40P01',
  '55P03',
  '53300',
  '57P01',
  '57P02',
  '57P03',
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
  '08P01',
]);

const RETRYABLE_NODE_CODES = new Set(['ECONNRESET', 'EPIPE', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND']);

function readIntEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];

  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();

  if (!raw) {
    return fallback;
  }

  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

const dbRetryConfig: DbRetryConfig = {
  attempts: readIntEnv('DB_RETRY_ATTEMPTS', 3, 1, 6),
  baseDelayMs: readIntEnv('DB_RETRY_BASE_DELAY_MS', 120, 20, 5_000),
  maxDelayMs: readIntEnv('DB_RETRY_MAX_DELAY_MS', 2_000, 100, 20_000),
};

const dbTelemetryConfig: DbTelemetryConfig = {
  enabled: readBooleanEnv('DB_TELEMETRY', process.env.NODE_ENV === 'development'),
  slowQueryMs: readIntEnv('DB_SLOW_QUERY_MS', 300, 20, 60_000),
  logAllQueries: readBooleanEnv('DB_LOG_ALL_QUERIES', false),
};

export function getDbRetryConfig(): DbRetryConfig {
  return { ...dbRetryConfig };
}

export function getDbTelemetryConfig(): DbTelemetryConfig {
  return { ...dbTelemetryConfig };
}

export function computeRetryDelayMs(attempt: number, config: DbRetryConfig = dbRetryConfig): number {
  const safeAttempt = Math.max(1, attempt);
  const exponentialDelay = config.baseDelayMs * 2 ** (safeAttempt - 1);
  return Math.min(config.maxDelayMs, exponentialDelay);
}

export function shouldRetryDatabaseError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as {
    code?: string;
    message?: string;
    severity?: string;
  };

  if (maybeError.code) {
    if (RETRYABLE_PG_CODES.has(maybeError.code)) {
      return true;
    }

    if (maybeError.code.startsWith('08')) {
      return true;
    }

    if (RETRYABLE_NODE_CODES.has(maybeError.code)) {
      return true;
    }
  }

  const message = maybeError.message?.toLowerCase() ?? '';

  if (
    message.includes('connection terminated') ||
    message.includes('terminating connection') ||
    message.includes('timeout') ||
    message.includes('deadlock detected')
  ) {
    return true;
  }

  return false;
}

function querySnippet(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim().slice(0, 140);
}

function queryOperation(sql: string): string {
  const token = sql.trim().split(/\s+/)[0] ?? 'QUERY';
  return token.toUpperCase();
}

function logQueryTelemetry(payload: {
  level: 'info' | 'warn';
  sql: string;
  durationMs: number;
  attempt: number;
  paramCount: number;
  rowCount?: number | null;
  errorCode?: string;
  errorMessage?: string;
  retrying?: boolean;
}) {
  if (!dbTelemetryConfig.enabled) {
    return;
  }

  const shouldLogInfo =
    payload.level === 'warn' ||
    dbTelemetryConfig.logAllQueries ||
    payload.durationMs >= dbTelemetryConfig.slowQueryMs ||
    payload.attempt > 1;

  if (!shouldLogInfo) {
    return;
  }

  const event = {
    scope: 'db.query',
    level: payload.level,
    operation: queryOperation(payload.sql),
    sql: querySnippet(payload.sql),
    durationMs: payload.durationMs,
    attempt: payload.attempt,
    paramCount: payload.paramCount,
    rowCount: payload.rowCount ?? undefined,
    errorCode: payload.errorCode,
    errorMessage: payload.errorMessage,
    retrying: payload.retrying,
  };

  if (payload.level === 'warn') {
    console.warn('[db]', event);
    return;
  }

  console.info('[db]', event);
}

function createPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return null;
  }

  return new Pool({
    connectionString,
    max: readIntEnv('DB_POOL_MAX', 10, 1, 100),
    idleTimeoutMillis: readIntEnv('DB_POOL_IDLE_TIMEOUT_MS', 30_000, 1_000, 300_000),
    connectionTimeoutMillis: readIntEnv('DB_POOL_CONNECTION_TIMEOUT_MS', 5_000, 200, 60_000),
    keepAlive: true,
    application_name: process.env.DB_APPLICATION_NAME ?? 'bilsem-quiz-next-skeleton',
  });
}

const pool = globalThis.__bilsemPgPool ?? createPool();

if (pool && process.env.NODE_ENV !== 'production') {
  globalThis.__bilsemPgPool = pool;
}

function assertPool(): Pool {
  if (!pool) {
    throw new Error(
      'DATABASE_URL tanimli degil. `.env.local` icine PostgreSQL baglanti adresi ekleyin.',
    );
  }

  return pool;
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function executeQueryWithRetry<TRow extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[],
): Promise<QueryResult<TRow>> {
  let attempt = 1;

  while (true) {
    const startedAt = Date.now();

    try {
      const result = await assertPool().query<TRow>(sql, params);

      logQueryTelemetry({
        level: 'info',
        sql,
        durationMs: Date.now() - startedAt,
        attempt,
        paramCount: params.length,
        rowCount: result.rowCount,
      });

      return result;
    } catch (error) {
      const retryable = shouldRetryDatabaseError(error);
      const canRetry = retryable && attempt < dbRetryConfig.attempts;
      const delayMs = canRetry ? computeRetryDelayMs(attempt, dbRetryConfig) : 0;

      logQueryTelemetry({
        level: 'warn',
        sql,
        durationMs: Date.now() - startedAt,
        attempt,
        paramCount: params.length,
        errorCode:
          error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
            ? error.code
            : undefined,
        errorMessage: error instanceof Error ? error.message : 'unknown_error',
        retrying: canRetry,
      });

      if (!canRetry) {
        throw error;
      }

      await wait(delayMs);
      attempt += 1;
    }
  }
}

export const db: DatabaseClient = {
  async query<TRow extends QueryResultRow = QueryResultRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<TRow[]> {
    const result = await executeQueryWithRetry<TRow>(sql, params);
    return result.rows;
  },
};

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await assertPool().connect();
  const startedAt = Date.now();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');

    if (dbTelemetryConfig.enabled) {
      console.info('[db]', {
        scope: 'db.transaction',
        level: 'info',
        durationMs: Date.now() - startedAt,
      });
    }

    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Rollback hatasi ana hatayi golgelemesin.
    }

    if (dbTelemetryConfig.enabled) {
      console.warn('[db]', {
        scope: 'db.transaction',
        level: 'warn',
        durationMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : 'unknown_error',
      });
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function pingDatabase(): Promise<boolean> {
  try {
    await db.query('SELECT 1 AS ok');
    return true;
  } catch {
    return false;
  }
}
