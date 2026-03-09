'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

const exportAdminReportSchema = z.object({
  reportType: z.enum(['users', 'game-plays']),
  format: z.enum(['csv', 'pdf']),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

export async function exportAdminReportAction(formData: FormData): Promise<void> {
  const parsed = exportAdminReportSchema.safeParse({
    reportType: formData.get('reportType'),
    format: formData.get('format'),
    limit: formData.get('limit') ?? '200',
  });

  if (!parsed.success) {
    redirect('/admin?reportError=invalid_export_request');
  }

  const search = new URLSearchParams({
    format: parsed.data.format,
    limit: String(parsed.data.limit),
  });

  redirect(`/admin/reports/${parsed.data.reportType}?${search.toString()}`);
}
