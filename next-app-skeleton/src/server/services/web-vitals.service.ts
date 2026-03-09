import {
  createWebVitalMetric,
  getWebVitalsSummary,
  listRecentWebVitalMetrics,
  type CreateWebVitalMetricInput,
  type WebVitalMetricName,
  type WebVitalMetricRating,
} from '@/server/repositories/web-vitals.repository';

export interface WebVitalMetricPayload {
  id: string;
  name: WebVitalMetricName;
  value: number;
  delta: number;
  rating: WebVitalMetricRating;
  navigationType?: string | null;
  path: string;
  href?: string | null;
  userAgent?: string | null;
  recordedAt?: string | null;
}

export interface WebVitalSample {
  name: WebVitalMetricName;
  value: number;
  delta: number;
  rating: WebVitalMetricRating;
  navigationType: string | null;
  path: string;
  createdAt: string;
}

export interface WebVitalsSnapshot {
  totalSamples24h: number;
  goodRatio24h: number;
  poorSamples24h: number;
  latestAt: string | null;
  recent: WebVitalSample[];
}

function normalizePath(path: string): string {
  const trimmed = path.trim();

  if (!trimmed) {
    return '/';
  }

  if (!trimmed.startsWith('/')) {
    return `/${trimmed}`;
  }

  return trimmed.slice(0, 180);
}

export function normalizeWebVitalPayload(payload: WebVitalMetricPayload): CreateWebVitalMetricInput {
  return {
    metricId: payload.id.trim().slice(0, 120),
    metricName: payload.name,
    metricValue: Number(payload.value),
    metricDelta: Number(payload.delta),
    metricRating: payload.rating,
    navigationType: payload.navigationType?.trim().slice(0, 40) ?? null,
    path: normalizePath(payload.path),
    userAgent: payload.userAgent?.trim().slice(0, 420) ?? null,
    metadata: {
      href: payload.href ?? null,
      recordedAt: payload.recordedAt ?? null,
    },
  };
}

export async function trackWebVitalMetric(payload: WebVitalMetricPayload): Promise<{ persisted: boolean }> {
  const normalized = normalizeWebVitalPayload(payload);

  try {
    await createWebVitalMetric(normalized);
    return { persisted: true };
  } catch (error) {
    console.warn('[web-vitals] metric persist failed', {
      metricName: normalized.metricName,
      path: normalized.path,
      detail: error instanceof Error ? error.message : 'unknown_error',
    });

    return { persisted: false };
  }
}

export async function getWebVitalsSnapshot(): Promise<WebVitalsSnapshot> {
  try {
    const [summary, recentRows] = await Promise.all([getWebVitalsSummary(24), listRecentWebVitalMetrics(10)]);

    const goodRatio =
      summary.total_samples > 0
        ? Number(((summary.good_samples / summary.total_samples) * 100).toFixed(1))
        : 0;

    return {
      totalSamples24h: summary.total_samples,
      goodRatio24h: goodRatio,
      poorSamples24h: summary.poor_samples,
      latestAt: summary.latest_at,
      recent: recentRows.map((row) => ({
        name: row.metric_name,
        value: Number(row.metric_value),
        delta: Number(row.metric_delta),
        rating: row.metric_rating,
        navigationType: row.navigation_type,
        path: row.path,
        createdAt: row.created_at,
      })),
    };
  } catch {
    return {
      totalSamples24h: 0,
      goodRatio24h: 0,
      poorSamples24h: 0,
      latestAt: null,
      recent: [],
    };
  }
}
