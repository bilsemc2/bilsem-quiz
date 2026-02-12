import { StoryCard } from '@/features/content/components/StoryCard';
import { Card } from '@/shared/ui/Card';
import { listStories } from '@/server/services/story.service';

export default async function HomePage() {
  const stories = await listStories(4);

  return (
    <div className="stack">
      <h1>Bilsem Quiz - Next.js Iskeleti</h1>
      <p className="muted">
        Bu iskelet; oyunlar, atolyeler, icerik ve panel katmanlarini feature bazli tasimak icin
        hazirlandi.
      </p>

      <div className="grid-2">
        <Card title="Mimari Ilkeleri">
          <ul>
            <li>App Router + route groups</li>
            <li>Server/Client boundary netligi</li>
            <li>Feature-first klasor yapisi</li>
            <li>Server actions + API route handlers</li>
          </ul>
        </Card>

        <Card title="Hikaye Modulu (DBden)">
          <div className="stack">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
