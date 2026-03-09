import { NextResponse } from 'next/server';
import { z } from 'zod';

import { trackWebVitalMetric } from '@/server/services/web-vitals.service';

const webVitalPayloadSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.enum(['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB']),
  value: z.number().finite(),
  delta: z.number().finite(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
  navigationType: z.string().max(40).optional().nullable(),
  path: z.string().min(1).max(180),
  href: z.string().max(2000).optional().nullable(),
  userAgent: z.string().max(420).optional().nullable(),
  recordedAt: z.string().datetime().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = webVitalPayloadSchema.parse(body);
    const result = await trackWebVitalMetric(payload);

    return NextResponse.json(
      {
        accepted: true,
        persisted: result.persisted,
      },
      { status: 202 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          accepted: false,
          message: 'Gecersiz web vitals payload',
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        accepted: false,
        message: 'Web vitals payload islenemedi',
        detail: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 500 },
    );
  }
}
