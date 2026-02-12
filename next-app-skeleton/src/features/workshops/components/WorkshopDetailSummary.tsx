import type { WorkshopDetail } from '@/shared/types/domain';

interface WorkshopDetailSummaryProps {
  workshop: WorkshopDetail;
}

export function WorkshopDetailSummary({ workshop }: WorkshopDetailSummaryProps) {
  const migratedCount = workshop.modules.filter((module) => module.migrated).length;

  return (
    <div className="grid-2">
      <section className="card stack-sm">
        <h2 className="card-title">Atolye Ozeti</h2>
        <p className="muted">{workshop.description}</p>
        <p className="muted">Zorluk: {workshop.difficulty}</p>
        {workshop.audience ? <p className="muted">Hedef: {workshop.audience}</p> : null}
        <p className="muted">Toplam modul: {workshop.modules.length}</p>
        <p className="muted">Migrate modul: {migratedCount}</p>
      </section>

      <section className="card stack-sm">
        <h2 className="card-title">Hedefler</h2>
        <ul>
          {workshop.goals.map((goal) => (
            <li key={goal}>{goal}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
