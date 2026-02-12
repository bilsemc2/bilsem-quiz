import Link from 'next/link';

import type { AdminGamePlaySummary } from '@/shared/types/domain';

interface AdminGamePlaysTableProps {
  rows: AdminGamePlaySummary[];
  showUser?: boolean;
}

export function AdminGamePlaysTable({ rows, showUser = true }: AdminGamePlaysTableProps) {
  if (rows.length === 0) {
    return <p className="muted">Game play kaydi bulunamadi.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {showUser ? (
              <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                Kullanici
              </th>
            ) : null}
            <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
              Oyun
            </th>
            <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
              Skor
            </th>
            <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
              Sure
            </th>
            <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
              Workshop
            </th>
            <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
              Tarih
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {showUser ? (
                <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                  {row.userId ? (
                    <Link href={`/admin/users/${row.userId}`}>
                      {row.userName ?? row.userEmail ?? row.userId}
                    </Link>
                  ) : (
                    <span className="muted">Anonim</span>
                  )}
                </td>
              ) : null}
              <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>{row.gameId}</td>
              <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                {row.scoreAchieved}
              </td>
              <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                {row.durationSeconds} sn
              </td>
              <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                {row.workshopType ?? '-'}
              </td>
              <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                {new Date(row.createdAt).toLocaleString('tr-TR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
