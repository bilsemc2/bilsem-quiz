import Link from 'next/link';

import { AdminGamePlaysTable } from '@/features/admin/components/AdminGamePlaysTable';
import { AdminReportExports } from '@/features/admin/components/AdminReportExports';
import { Card } from '@/shared/ui/Card';
import { listAdminGamePlays } from '@/server/services/admin.service';

export default async function AdminGamePlaysPage() {
  const gamePlays = await listAdminGamePlays(120);

  return (
    <div className="stack">
      <h1>Admin - Oyun Oturumlari</h1>
      <p className="muted">`public.game_plays` tablosundan son oturumlar.</p>

      <Card title="Oturum Gecmisi">
        <AdminGamePlaysTable rows={gamePlays} />
      </Card>

      <Card title="Rapor Disa Aktar">
        <AdminReportExports defaultLimit={300} showUsers={false} />
      </Card>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link className="btn btn-ghost" href="/admin">
          Admin panele don
        </Link>
        <Link className="btn btn-ghost" href="/dashboard">
          Dashboarda don
        </Link>
      </div>
    </div>
  );
}
