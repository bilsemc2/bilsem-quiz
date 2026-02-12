import Link from 'next/link';

import type { WorkshopModuleSummary } from '@/shared/types/domain';

interface WorkshopModuleListProps {
  modules: WorkshopModuleSummary[];
}

export function WorkshopModuleList({ modules }: WorkshopModuleListProps) {
  return (
    <div className="stack">
      {modules.map((module) => (
        <article key={module.id} className="card stack-sm">
          <h3 className="card-title">{module.title}</h3>
          <p className="muted">{module.description}</p>
          <p className="muted">Zorluk: {module.difficulty}</p>
          <p className="muted">Tahmini sure: {module.estimatedMinutes} dk</p>
          {module.tags?.length ? <p className="muted">Etiketler: {module.tags.join(', ')}</p> : null}
          <p className="muted">Durum: {module.migrated ? 'Migrate edildi' : 'Legacy route / tasiniyor'}</p>
          <div>
            <Link className="btn btn-ghost" href={module.route}>
              Modul Routeu
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
