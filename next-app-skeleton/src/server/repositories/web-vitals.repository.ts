import type { QueryResultRow } from 'pg';

import { db } from '@/server/db/client';

export type WebVitalMetricName = 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
export type WebVitalMetricRating = 'good' | 'needs-improvement' | 'poor';

export interface CreateWebVitalMetricInput {
  metricId: string;
  metricName: WebVitalMetricName;
  metricValue: number;
  metricDelta: number;
  metricRating: WebVitalMetricRating;
  navigationType: string | null;
  path: string;
  userAgent: string | null;
  metadata?: Record<string, unknown>;
}

export interface WebVitalMetricRow extends QueryResultRow {
  metric_name: WebVitalMetricName;
  metric_value: number;
  metric_delta: number;
  metric_rating: WebVitalMetricRating;
  navigation_type: string | null;
  path: string;
  created_at: string;
}

export interface WebVitalsSummaryRow extends QueryResultRow {
  total_samples: number;
  good_samples: number;
  needs_improvement_samples: number;
  poor_samples: number;
  latest_at: string | null;
}

let tableEnsured = false;
let ensurePromise: Promise<void> | null = null;

export async function ensureWebVitalsMetricsTable(): Promise<void> {
  if (tableEnsured) {
    return;
  }

  if (!ensurePromise) {
    ensurePromise = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS public.web_vitals_metrics (
          id BIGSERIAL PRIMARY KEY,
          metric_id TEXT NOT NULL,
          metric_name TEXT NOT NULL,
          metric_value DOUBLE PRECISION NOT NULL,
          metric_delta DOUBLE PRECISION NOT NULL,
          metric_rating TEXT NOT NULL,
          navigation_type TEXT NULL,
          path TEXT NOT NULL,
          user_agent TEXT NULL,
          metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      await db.query(
        'CREATE INDEX IF NOT EXISTS idx_web_vitals_metrics_created_at ON public.web_vitals_metrics (created_at DESC)',
      );

      await db.query(
        'CREATE INDEX IF NOT EXISTS idx_web_vitals_metrics_name_rating ON public.web_vitals_metrics (metric_name, metric_rating)',
      );

      tableEnsured = true;
    })().finally(() => {
      ensurePromise = null;
    });
  }

  await ensurePromise;
}

export async function createWebVitalMetric(input: CreateWebVitalMetricInput): Promise<void> {
  await ensureWebVitalsMetricsTable();

  await db.query(
    `
      INSERT INTO public.web_vitals_metrics (
        metric_id,
        metric_name,
        metric_value,
        metric_delta,
        metric_rating,
        navigation_type,
        path,
        user_agent,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
    `,
    [
      input.metricId,
      input.metricName,
      input.metricValue,
      input.metricDelta,
      input.metricRating,
      input.navigationType,
      input.path,
      input.userAgent,
      JSON.stringify(input.metadata ?? {}),
    ],
  );
}

export async function listRecentWebVitalMetrics(limit = 12): Promise<WebVitalMetricRow[]> {
  await ensureWebVitalsMetricsTable();

  return db.query<WebVitalMetricRow>(
    `
      SELECT
        metric_name,
        metric_value::float8 AS metric_value,
        metric_delta::float8 AS metric_delta,
        metric_rating,
        navigation_type,
        path,
        created_at::text
      FROM public.web_vitals_metrics
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [limit],
  );
}

export async function getWebVitalsSummary(hours = 24): Promise<WebVitalsSummaryRow> {
  await ensureWebVitalsMetricsTable();

  const rows = await db.query<WebVitalsSummaryRow>(
    `
      SELECT
        COUNT(*)::int AS total_samples,
        COUNT(*) FILTER (WHERE metric_rating = 'good')::int AS good_samples,
        COUNT(*) FILTER (WHERE metric_rating = 'needs-improvement')::int AS needs_improvement_samples,
        COUNT(*) FILTER (WHERE metric_rating = 'poor')::int AS poor_samples,
        MAX(created_at)::text AS latest_at
      FROM public.web_vitals_metrics
      WHERE created_at >= NOW() - make_interval(hours => $1)
    `,
    [hours],
  );

  return (
    rows[0] ?? {
      total_samples: 0,
      good_samples: 0,
      needs_improvement_samples: 0,
      poor_samples: 0,
      latest_at: null,
    }
  );
}
