import Link from 'next/link';

import { AboutContent } from '@/features/content/components/AboutContent';

export default function AboutPage() {
  return (
    <div className="stack">
      <h1>Hakkinda</h1>
      <p className="muted">Legacy `AboutPage` icerigi Next.js skeleton yapisina route-level olarak tasindi.</p>

      <AboutContent />

      <p className="muted" style={{ marginBottom: 0 }}>
        <Link href="/home">Ana sayfaya don</Link>
      </p>
    </div>
  );
}
