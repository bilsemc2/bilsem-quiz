import Link from 'next/link';
import { notFound } from 'next/navigation';

import { WorkshopDetailSummary } from '@/features/workshops/components/WorkshopDetailSummary';
import { WorkshopModuleList } from '@/features/workshops/components/WorkshopModuleList';
import { getWorkshopDetail } from '@/server/services/workshop.service';

interface WorkshopDetailPageProps {
  params: Promise<{ workshopId: string }>;
}

export default async function WorkshopDetailPage({ params }: WorkshopDetailPageProps) {
  const { workshopId } = await params;
  const workshop = await getWorkshopDetail(workshopId);

  if (!workshop) {
    notFound();
  }

  return (
    <div className="stack">
      <div className="stack-sm">
        <h1>{workshop.title}</h1>
        <p className="muted">Workshop Id: {workshop.id}</p>
      </div>

      <WorkshopDetailSummary workshop={workshop} />

      <section className="stack">
        <h2>Moduller</h2>
        <WorkshopModuleList modules={workshop.modules} />
      </section>

      <div>
        <Link className="btn btn-ghost" href="/workshops">
          Atolye listesine don
        </Link>
      </div>
    </div>
  );
}
