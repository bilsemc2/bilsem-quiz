import Link from 'next/link';

import { AdminStatsPanel } from '@/features/admin/components/AdminStatsPanel';
import { Card } from '@/shared/ui/Card';
import { getDashboardStats } from '@/server/services/dashboard.service';

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="stack">
      <h1>Dashboard</h1>
      <p className="muted">Middleware bu rotayi cookie/session yoksa login sayfasina yonlendirir.</p>

      <AdminStatsPanel
        userCount={stats.userCount}
        activeGames={stats.activeGames}
        todaysSessions={stats.todaysSessions}
      />

      <Card title="Teknik Notlar">
        <ul>
          <li>Veriler: `public.profiles` + `public.game_plays` tablolarindan okunur.</li>
          <li>DB baglantisi yoksa service katmani sifir fallback doner.</li>
          <li>Admin detay ekranlari: `/admin`, `/admin/users`, `/admin/game-plays`.</li>
        </ul>
        <p className="muted">Aktif kullanici: {stats.activeUserCount}</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link className="btn btn-secondary" href="/admin">
            Admin Detaylarini Ac
          </Link>
        </div>
      </Card>
    </div>
  );
}
