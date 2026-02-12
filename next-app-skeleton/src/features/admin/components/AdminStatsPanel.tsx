import { Card } from '@/shared/ui/Card';

interface AdminStatsPanelProps {
  userCount: number;
  activeGames: number;
  todaysSessions: number;
}

export function AdminStatsPanel({ userCount, activeGames, todaysSessions }: AdminStatsPanelProps) {
  return (
    <div className="grid-3">
      <Card title="Toplam Kullanici">
        <p className="metric">{userCount}</p>
      </Card>
      <Card title="Aktif Oyun">
        <p className="metric">{activeGames}</p>
      </Card>
      <Card title="Bugunku Oturum">
        <p className="metric">{todaysSessions}</p>
      </Card>
    </div>
  );
}
