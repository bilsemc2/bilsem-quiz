import { WorkshopCard } from '@/features/workshops/components/WorkshopCard';
import { listWorkshops } from '@/server/services/workshop.service';

export default async function WorkshopsPage() {
  const workshops = await listWorkshops();

  return (
    <div className="stack">
      <h1>Atolyeler</h1>
      <p className="muted">
        Legacy workshop modulleri feature-bazli katalog yapisina tasindi. Her atolye kendi detail sayfasindan
        modul bazinda takip edilebilir.
      </p>

      <div className="grid-2">
        {workshops.map((workshop) => (
          <WorkshopCard key={workshop.id} workshop={workshop} />
        ))}
      </div>
    </div>
  );
}
