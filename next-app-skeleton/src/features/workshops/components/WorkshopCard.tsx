import Link from 'next/link';

import { Card } from '@/shared/ui/Card';
import type { WorkshopSummary } from '@/shared/types/domain';

interface WorkshopCardProps {
  workshop: WorkshopSummary;
}

export function WorkshopCard({ workshop }: WorkshopCardProps) {
  return (
    <Card title={workshop.title}>
      <p>{workshop.description}</p>
      <p className="muted">Zorluk: {workshop.difficulty}</p>
      {workshop.audience ? <p className="muted">Hedef: {workshop.audience}</p> : null}
      {typeof workshop.moduleCount === 'number' ? (
        <p className="muted">Modul: {workshop.moduleCount}</p>
      ) : null}
      <p className="muted">Durum: {workshop.migrated ? 'Hazir' : 'Tasiniyor'}</p>

      <div style={{ marginTop: '0.75rem' }}>
        <Link className="btn btn-secondary" href={`/workshops/${workshop.id}`}>
          Atolyeyi Ac
        </Link>
      </div>
    </Card>
  );
}
