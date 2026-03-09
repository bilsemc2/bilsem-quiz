import Link from 'next/link';

import { AdminGamePlaysTable } from '@/features/admin/components/AdminGamePlaysTable';
import { AdminReportExports } from '@/features/admin/components/AdminReportExports';
import { AdminStatsPanel } from '@/features/admin/components/AdminStatsPanel';
import { AdminUsersTable } from '@/features/admin/components/AdminUsersTable';
import { AdminWebVitalsPanel } from '@/features/admin/components/AdminWebVitalsPanel';
import { Card } from '@/shared/ui/Card';
import { listAdminGamePlays, listAdminUsers } from '@/server/services/admin.service';
import { getDashboardStats } from '@/server/services/dashboard.service';
import { getWebVitalsSnapshot } from '@/server/services/web-vitals.service';

export default async function AdminPage() {
  const [stats, users, gamePlays, vitals] = await Promise.all([
    getDashboardStats(),
    listAdminUsers(8),
    listAdminGamePlays(12),
    getWebVitalsSnapshot(),
  ]);

  return (
    <div className="stack">
      <h1>Admin Panel</h1>
      <p className="muted">Route-level admin detay ekranlari migrationi tamamlandi.</p>

      <AdminStatsPanel
        userCount={stats.userCount}
        activeGames={stats.activeGames}
        todaysSessions={stats.todaysSessions}
      />

      <Card title="Hizli Gecis">
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link className="btn btn-secondary" href="/admin/users">
            Tum Kullanicilar
          </Link>
          <Link className="btn btn-secondary" href="/admin/game-plays">
            Tum Oyun Oturumlari
          </Link>
          <Link className="btn btn-ghost" href="/dashboard">
            Dashboarda Don
          </Link>
        </div>
      </Card>

      <Card title="Rapor Disa Aktar">
        <AdminReportExports defaultLimit={250} />
      </Card>

      <Card title="Web Vitals (Son 24 Saat)">
        <AdminWebVitalsPanel snapshot={vitals} />
      </Card>

      <Card title="Son Eklenen Kullanicilar">
        <AdminUsersTable users={users} />
      </Card>

      <Card title="Son Oyun Oturumlari">
        <AdminGamePlaysTable rows={gamePlays} />
      </Card>
    </div>
  );
}
