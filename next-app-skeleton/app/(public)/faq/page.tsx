import Link from 'next/link';

import { FaqContent } from '@/features/content/components/FaqContent';

export default function FaqPage() {
  return (
    <div className="stack">
      <h1>Sik Sorulan Sorular</h1>
      <p className="muted">Legacy `FAQPage` icerigi kategori bazli soru-cevap formatinda tasindi.</p>

      <FaqContent />

      <p className="muted" style={{ marginBottom: 0 }}>
        Yanit bulamadin mi? <Link href="/home">Ana sayfadan</Link> ilgili modullere gecis yapabilirsin.
      </p>
    </div>
  );
}
