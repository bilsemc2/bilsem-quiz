import { Card } from '@/shared/ui/Card';
import type { StorySummary } from '@/shared/types/domain';

interface StoryCardProps {
  story: StorySummary;
}

export function StoryCard({ story }: StoryCardProps) {
  return (
    <Card title={story.title}>
      <p className="muted">Yas grubu: {story.ageBand}</p>
      {story.theme ? <p className="muted">Tema: {story.theme}</p> : null}
    </Card>
  );
}
