import type { WebVitalsSnapshot } from '@/server/services/web-vitals.service';

interface AdminWebVitalsPanelProps {
  snapshot: WebVitalsSnapshot;
}

function toMetricColor(rating: string): string {
  if (rating === 'good') {
    return '#166534';
  }

  if (rating === 'needs-improvement') {
    return '#92400e';
  }

  return '#b91c1c';
}

export function AdminWebVitalsPanel({ snapshot }: AdminWebVitalsPanelProps) {
  return (
    <div className="stack-sm">
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span className="muted">24s ornek: {snapshot.totalSamples24h}</span>
        <span className="muted">Good oran: %{snapshot.goodRatio24h}</span>
        <span className="muted">Poor: {snapshot.poorSamples24h}</span>
        <span className="muted">
          Son olcum: {snapshot.latestAt ? new Date(snapshot.latestAt).toLocaleString('tr-TR') : '-'}
        </span>
      </div>

      {snapshot.recent.length === 0 ? (
        <p className="muted" style={{ margin: 0 }}>
          Henuz Web Vitals ornegi yok.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                  Metric
                </th>
                <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                  Deger
                </th>
                <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                  Rating
                </th>
                <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                  Route
                </th>
                <th style={{ textAlign: 'left', padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                  Tarih
                </th>
              </tr>
            </thead>
            <tbody>
              {snapshot.recent.map((item) => (
                <tr key={`${item.name}-${item.createdAt}-${item.path}`}>
                  <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>{item.name}</td>
                  <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                    {item.value.toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: '0.55rem',
                      borderBottom: '1px solid var(--border)',
                      color: toMetricColor(item.rating),
                      fontWeight: 600,
                    }}
                  >
                    {item.rating}
                  </td>
                  <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>{item.path}</td>
                  <td style={{ padding: '0.55rem', borderBottom: '1px solid var(--border)' }}>
                    {new Date(item.createdAt).toLocaleString('tr-TR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
