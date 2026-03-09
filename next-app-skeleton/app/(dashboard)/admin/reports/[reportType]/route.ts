import { NextResponse } from 'next/server';
import { z } from 'zod';

import { generateAdminReportFile } from '@/server/services/admin-report.service';

const routeParamsSchema = z.object({
  reportType: z.enum(['users', 'game-plays']),
});

const routeQuerySchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv'),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  context: {
    params: Promise<{ reportType: string }>;
  },
) {
  const parsedParams = routeParamsSchema.safeParse(await context.params);
  const url = new URL(request.url);

  const parsedQuery = routeQuerySchema.safeParse({
    format: url.searchParams.get('format') ?? 'csv',
    limit: url.searchParams.get('limit') ?? '200',
  });

  if (!parsedParams.success || !parsedQuery.success) {
    return NextResponse.json(
      {
        message: 'Gecersiz report istegi',
      },
      { status: 400 },
    );
  }

  try {
    const report = await generateAdminReportFile({
      reportType: parsedParams.data.reportType,
      format: parsedQuery.data.format,
      limit: parsedQuery.data.limit,
    });

    const responseBody = Uint8Array.from(report.content);

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': report.mimeType,
        'Content-Disposition': `attachment; filename="${report.filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: 'Report olusturulamadi',
        detail: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 500 },
    );
  }
}
