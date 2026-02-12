import Link from 'next/link';

import type { AdminUserSummary } from '@/shared/types/domain';

interface AdminUsersTableProps {
  users: AdminUserSummary[];
}

export function AdminUsersTable({ users }: AdminUsersTableProps) {
  if (users.length === 0) {
    return <p className="muted">Kullanici kaydi bulunamadi.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
              Kullanici
            </th>
            <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
              Rol
            </th>
            <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
              Oyun
            </th>
            <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
              En Iyi Skor
            </th>
            <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
              Son Oynama
            </th>
            <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
              Detay
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                <strong>{user.fullName}</strong>
                <div className="muted">{user.email}</div>
              </td>
              <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>{user.role}</td>
              <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                {user.gamePlayCount}
              </td>
              <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>{user.bestScore}</td>
              <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                {user.lastPlayAt ? new Date(user.lastPlayAt).toLocaleString('tr-TR') : '-'}
              </td>
              <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                <Link className="btn btn-ghost" href={`/admin/users/${user.id}`}>
                  Ac
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
