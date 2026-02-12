import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="stack">
      <h1>Sayfa Bulunamadi</h1>
      <p className="muted">Aradiginiz rota bu iskelette tanimli degil.</p>
      <Link href="/home">Ana sayfaya don</Link>
    </div>
  );
}
