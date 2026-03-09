import { describe, expect, it } from 'vitest';

import { generateAdminReportFile } from '@/server/services/admin-report.service';

describe('admin-report.service', () => {
  it('generates users csv report content', async () => {
    const file = await generateAdminReportFile({
      reportType: 'users',
      format: 'csv',
      limit: 5,
    });

    const text = new TextDecoder().decode(file.content);

    expect(file.filename.endsWith('.csv')).toBe(true);
    expect(file.mimeType).toContain('text/csv');
    expect(text).toContain('id,full_name,email,role');
  });

  it('generates game plays pdf report content', async () => {
    const file = await generateAdminReportFile({
      reportType: 'game-plays',
      format: 'pdf',
      limit: 5,
    });

    const header = new TextDecoder('ascii').decode(file.content.slice(0, 8));

    expect(file.filename.endsWith('.pdf')).toBe(true);
    expect(file.mimeType).toBe('application/pdf');
    expect(header).toBe('%PDF-1.4');
  });
});
