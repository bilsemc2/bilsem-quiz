import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AdminGamePlaysTable } from '@/features/admin/components/AdminGamePlaysTable';
import { Card } from '@/shared/ui/Card';
import { getAdminUserDetail, listAdminGamePlaysByUser } from '@/server/services/admin.service';

interface AdminUserDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const { userId } = await params;

  const [user, gamePlays] = await Promise.all([
    getAdminUserDetail(userId),
    listAdminGamePlaysByUser(userId, 40),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="stack">
      <h1>Admin - Kullanici Detayi</h1>

      <Card title={user.fullName}>
        <p className="muted">E-posta: {user.email}</p>
        <p className="muted">Rol: {user.role}</p>
        <p className="muted">Deneyim: {user.experience}</p>
        <p className="muted">Durum: {user.isActive ? 'Aktif' : 'Pasif'}</p>
        <p className="muted">Olusturma: {new Date(user.createdAt).toLocaleString('tr-TR')}</p>
        <p className="muted">Toplam oyun: {user.gamePlayCount}</p>
        <p className="muted">En iyi skor: {user.bestScore}</p>
        <p className="muted">
          Son oynama: {user.lastPlayAt ? new Date(user.lastPlayAt).toLocaleString('tr-TR') : '-'}
        </p>
        <p className="muted">Son oyunlar: {user.recentGameIds.join(', ') || '-'}</p>
      </Card>

      <Card title="Kullanici Oyun Oturumlari">
        <AdminGamePlaysTable rows={gamePlays} showUser={false} />
      </Card>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link className="btn btn-ghost" href="/admin/users">
          Kullanicilara don
        </Link>
        <Link className="btn btn-ghost" href="/admin">
          Admin panele don
        </Link>
      </div>
    </div>
  );
}
