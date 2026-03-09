import { exportAdminReportAction } from '@/server/actions/admin/export-reports';

interface AdminReportExportsProps {
  defaultLimit?: number;
  showUsers?: boolean;
  showGamePlays?: boolean;
}

interface AdminReportButtonProps {
  reportType: 'users' | 'game-plays';
  format: 'csv' | 'pdf';
  label: string;
  limit: number;
}

function AdminReportButton({ reportType, format, label, limit }: AdminReportButtonProps) {
  return (
    <form action={exportAdminReportAction}>
      <input name="reportType" type="hidden" value={reportType} />
      <input name="format" type="hidden" value={format} />
      <input name="limit" type="hidden" value={String(limit)} />
      <button className="btn btn-secondary" type="submit">
        {label}
      </button>
    </form>
  );
}

export function AdminReportExports({
  defaultLimit = 200,
  showUsers = true,
  showGamePlays = true,
}: AdminReportExportsProps) {
  return (
    <div className="stack-sm">
      <p className="muted" style={{ marginTop: 0 }}>
        Server action ile uretim yapilip korumali `/admin/reports/*` route handler uzerinden dosya
        indirilir.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
        {showUsers ? (
          <>
            <AdminReportButton
              reportType="users"
              format="csv"
              label="Kullanicilar CSV"
              limit={defaultLimit}
            />
            <AdminReportButton
              reportType="users"
              format="pdf"
              label="Kullanicilar PDF"
              limit={defaultLimit}
            />
          </>
        ) : null}

        {showGamePlays ? (
          <>
            <AdminReportButton
              reportType="game-plays"
              format="csv"
              label="Oyun Oturumlari CSV"
              limit={defaultLimit}
            />
            <AdminReportButton
              reportType="game-plays"
              format="pdf"
              label="Oyun Oturumlari PDF"
              limit={defaultLimit}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
