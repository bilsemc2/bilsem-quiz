import type { AdminGamePlaySummary, AdminUserSummary } from '@/shared/types/domain';

import { listAdminGamePlays, listAdminUsers } from '@/server/services/admin.service';

export type AdminReportType = 'users' | 'game-plays';
export type AdminReportFormat = 'csv' | 'pdf';

export interface GenerateAdminReportInput {
  reportType: AdminReportType;
  format: AdminReportFormat;
  limit?: number;
}

export interface GeneratedAdminReportFile {
  filename: string;
  mimeType: string;
  content: Buffer;
  rowCount: number;
  generatedAt: string;
}

const DEFAULT_REPORT_LIMIT = 200;
const MAX_REPORT_LIMIT = 500;
const MAX_PDF_ROWS = 32;
const PDF_LINE_CHAR_LIMIT = 110;

function clampLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_REPORT_LIMIT;
  }

  return Math.min(MAX_REPORT_LIMIT, Math.max(1, Math.floor(limit ?? DEFAULT_REPORT_LIMIT)));
}

function encodeUtf8(value: string): Buffer {
  return Buffer.from(value, 'utf8');
}

function toCsvCell(value: string | number | boolean | null): string {
  const normalized = value === null ? '' : String(value);

  if (!/[",\n]/.test(normalized)) {
    return normalized;
  }

  return `"${normalized.replaceAll('"', '""')}"`;
}

function toCsvLine(values: Array<string | number | boolean | null>): string {
  return values.map(toCsvCell).join(',');
}

function toAsciiSafe(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateForPdf(value: string, maxChars = PDF_LINE_CHAR_LIMIT): string {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, maxChars - 3)}...`;
}

function buildCsvReportForUsers(users: AdminUserSummary[]): string {
  const lines = [
    toCsvLine([
      'id',
      'full_name',
      'email',
      'role',
      'experience',
      'is_active',
      'created_at',
      'game_play_count',
      'best_score',
      'last_play_at',
    ]),
    ...users.map((user) =>
      toCsvLine([
        user.id,
        user.fullName,
        user.email,
        user.role,
        user.experience,
        user.isActive,
        user.createdAt,
        user.gamePlayCount,
        user.bestScore,
        user.lastPlayAt,
      ]),
    ),
  ];

  // UTF-8 BOM helps spreadsheet apps keep Turkish characters intact.
  return `\uFEFF${lines.join('\n')}`;
}

function buildCsvReportForGamePlays(rows: AdminGamePlaySummary[]): string {
  const lines = [
    toCsvLine([
      'id',
      'user_id',
      'user_name',
      'user_email',
      'game_id',
      'score_achieved',
      'duration_seconds',
      'lives_remaining',
      'workshop_type',
      'intelligence_type',
      'created_at',
    ]),
    ...rows.map((row) =>
      toCsvLine([
        row.id,
        row.userId,
        row.userName,
        row.userEmail,
        row.gameId,
        row.scoreAchieved,
        row.durationSeconds,
        row.livesRemaining,
        row.workshopType,
        row.intelligenceType,
        row.createdAt,
      ]),
    ),
  ];

  return `\uFEFF${lines.join('\n')}`;
}

function buildPdfLinesForUsers(users: AdminUserSummary[], generatedAt: string, requestedLimit: number): string[] {
  const lines = [
    'Bilsem Quiz - Admin Users Report',
    `Generated At: ${generatedAt}`,
    `Rows Returned: ${users.length} (requested limit: ${requestedLimit})`,
    '',
  ];

  if (users.length === 0) {
    lines.push('No rows found.');
    return lines;
  }

  const visibleRows = users.slice(0, MAX_PDF_ROWS);

  lines.push(...visibleRows.map((user, index) =>
    truncateForPdf(
      `${index + 1}. ${toAsciiSafe(user.fullName)} | ${toAsciiSafe(user.email)} | role=${toAsciiSafe(user.role)} | plays=${user.gamePlayCount} | best=${user.bestScore}`,
    ),
  ));

  if (users.length > visibleRows.length) {
    lines.push(`... ${users.length - visibleRows.length} more row(s). Download CSV for full output.`);
  }

  return lines;
}

function buildPdfLinesForGamePlays(
  rows: AdminGamePlaySummary[],
  generatedAt: string,
  requestedLimit: number,
): string[] {
  const lines = [
    'Bilsem Quiz - Admin Game Plays Report',
    `Generated At: ${generatedAt}`,
    `Rows Returned: ${rows.length} (requested limit: ${requestedLimit})`,
    '',
  ];

  if (rows.length === 0) {
    lines.push('No rows found.');
    return lines;
  }

  const visibleRows = rows.slice(0, MAX_PDF_ROWS);

  lines.push(
    ...visibleRows.map((row, index) => {
      const userLabel = row.userName ?? row.userEmail ?? row.userId ?? 'anonymous';
      return truncateForPdf(
        `${index + 1}. game=${toAsciiSafe(row.gameId)} | score=${row.scoreAchieved} | sec=${row.durationSeconds} | user=${toAsciiSafe(userLabel)} | at=${row.createdAt}`,
      );
    }),
  );

  if (rows.length > visibleRows.length) {
    lines.push(`... ${rows.length - visibleRows.length} more row(s). Download CSV for full output.`);
  }

  return lines;
}

function escapePdfText(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function buildSimplePdf(lines: string[]): Buffer {
  const normalizedLines = lines.length > 0 ? lines : ['No content'];
  const asciiLines = normalizedLines.map((line) => toAsciiSafe(line));

  const textOperations: string[] = [];

  asciiLines.forEach((line, index) => {
    if (index > 0) {
      textOperations.push('T*');
    }
    textOperations.push(`(${escapePdfText(line)}) Tj`);
  });

  const contentStream = ['BT', '/F1 11 Tf', '40 800 Td', '14 TL', ...textOperations, 'ET'].join('\n');
  const contentLength = Buffer.byteLength(contentStream, 'ascii');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj',
    `4 0 obj\n<< /Length ${contentLength} >>\nstream\n${contentStream}\nendstream\nendobj`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (const offset of offsets.slice(1)) {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

function makeTimestampSuffix(isoDate: string): string {
  return isoDate.replaceAll(':', '-').replaceAll('.', '-');
}

export async function generateAdminReportFile(
  input: GenerateAdminReportInput,
): Promise<GeneratedAdminReportFile> {
  const limit = clampLimit(input.limit);
  const generatedAt = new Date().toISOString();
  const timestampSuffix = makeTimestampSuffix(generatedAt);

  if (input.reportType === 'users') {
    const users = await listAdminUsers(limit);

    if (input.format === 'csv') {
      const content = buildCsvReportForUsers(users);
      return {
        filename: `admin-users-report-${timestampSuffix}.csv`,
        mimeType: 'text/csv; charset=utf-8',
        content: encodeUtf8(content),
        rowCount: users.length,
        generatedAt,
      };
    }

    const lines = buildPdfLinesForUsers(users, generatedAt, limit);
    return {
      filename: `admin-users-report-${timestampSuffix}.pdf`,
      mimeType: 'application/pdf',
      content: buildSimplePdf(lines),
      rowCount: users.length,
      generatedAt,
    };
  }

  const rows = await listAdminGamePlays(limit);

  if (input.format === 'csv') {
    const content = buildCsvReportForGamePlays(rows);
    return {
      filename: `admin-game-plays-report-${timestampSuffix}.csv`,
      mimeType: 'text/csv; charset=utf-8',
      content: encodeUtf8(content),
      rowCount: rows.length,
      generatedAt,
    };
  }

  const lines = buildPdfLinesForGamePlays(rows, generatedAt, limit);
  return {
    filename: `admin-game-plays-report-${timestampSuffix}.pdf`,
    mimeType: 'application/pdf',
    content: buildSimplePdf(lines),
    rowCount: rows.length,
    generatedAt,
  };
}
