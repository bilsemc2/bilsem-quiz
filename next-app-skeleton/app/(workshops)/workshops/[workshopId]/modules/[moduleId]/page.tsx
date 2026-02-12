import Link from 'next/link';
import { notFound } from 'next/navigation';

import { MusicRhythmModuleClient } from '@/features/workshops/modules/components/MusicRhythmModuleClient';
import { TabletSpeedModuleClient } from '@/features/workshops/modules/components/TabletSpeedModuleClient';
import { VisualPerceptionModuleClient } from '@/features/workshops/modules/components/VisualPerceptionModuleClient';
import { getWorkshopDetail, getWorkshopModule } from '@/server/services/workshop.service';

interface WorkshopModulePageProps {
  params: Promise<{ workshopId: string; moduleId: string }>;
}

export default async function WorkshopModulePage({ params }: WorkshopModulePageProps) {
  const { workshopId, moduleId } = await params;

  const [workshop, module] = await Promise.all([
    getWorkshopDetail(workshopId),
    getWorkshopModule(workshopId, moduleId),
  ]);

  if (!workshop || !module) {
    notFound();
  }

  if (workshopId === 'tablet-degerlendirme' && moduleId === 'tablet-algisal-hiz') {
    return <TabletSpeedModuleClient workshopId={workshopId} moduleId={moduleId} moduleTitle={module.title} />;
  }

  if (workshopId === 'muzik-atolyesi' && moduleId === 'muzik-ritim') {
    return <MusicRhythmModuleClient workshopId={workshopId} moduleId={moduleId} moduleTitle={module.title} />;
  }

  if (workshopId === 'resim-atolyesi' && moduleId === 'resim-gorsel-algi') {
    return <VisualPerceptionModuleClient workshopId={workshopId} moduleId={moduleId} moduleTitle={module.title} />;
  }

  const currentRoute = `/workshops/${workshopId}/modules/${moduleId}`;
  const showLegacyButton = module.route !== currentRoute;

  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <h1>{module.title}</h1>
      <p className="muted">Atolye: {workshop.title}</p>
      <p>{module.description}</p>
      <ul className="muted">
        <li>Zorluk: {module.difficulty}</li>
        <li>Tahmini sure: {module.estimatedMinutes} dk</li>
        <li>Durum: {module.migrated ? 'Route acik, client tamamlanmadi' : 'Legacy route'}</li>
      </ul>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {showLegacyButton ? (
          <Link className="btn btn-primary" href={module.route}>
            Legacy modulu ac
          </Link>
        ) : null}
        <Link className="btn btn-ghost" href={`/workshops/${workshopId}`}>
          Atolye detayina don
        </Link>
      </div>
    </div>
  );
}
