'use client';

import { useReportWebVitals } from 'next/web-vitals';

type AllowedMetricName = 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
type MetricRating = 'good' | 'needs-improvement' | 'poor';

interface ClientWebVitalMetric {
  id: string;
  name: string;
  value: number;
  delta: number;
  rating: MetricRating;
  navigationType?: string;
}

const ALLOWED_METRICS = new Set<AllowedMetricName>(['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB']);

function isAllowedMetricName(name: string): name is AllowedMetricName {
  return ALLOWED_METRICS.has(name as AllowedMetricName);
}

function sendMetric(metric: ClientWebVitalMetric): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!isAllowedMetricName(metric.name)) {
    return;
  }

  const payload = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    navigationType: metric.navigationType ?? null,
    path: window.location.pathname,
    href: window.location.href,
    userAgent: window.navigator.userAgent,
    recordedAt: new Date().toISOString(),
  });

  if (window.navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    window.navigator.sendBeacon('/api/web-vitals', blob);
    return;
  }

  void fetch('/api/web-vitals', {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
    },
    body: payload,
  }).catch(() => {
    // Ignore errors to avoid impacting user navigation.
  });
}

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    sendMetric(metric as ClientWebVitalMetric);
  });

  return null;
}
