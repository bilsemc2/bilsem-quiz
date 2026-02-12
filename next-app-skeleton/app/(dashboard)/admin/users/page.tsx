import Link from 'next/link';

import { AdminUsersTable } from '@/features/admin/components/AdminUsersTable';
import { Card } from '@/shared/ui/Card';
import { listAdminUsers } from '@/server/services/admin.service';

export default async function AdminUsersPage() {
  const users = await listAdminUsers(100);

  return (
    <div className="stack">
      <h1>Admin - Kullanicilar</h1>
      <p className="muted">Profil tablosu ve oyun istatistikleri birlesik gorunum.</p>

      <Card title="Kullanici Listesi">
        <AdminUsersTable users={users} />
      </Card>

      <div>
        <Link className="btn btn-ghost" href="/admin">
          Admin panele don
        </Link>
      </div>
    </div>
  );
}
