'use client';

import { Button } from '@/shared/ui/Button';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="stack">
      <h1>Beklenmeyen Hata</h1>
      <p className="muted">{error.message}</p>
      <Button onClick={reset}>Tekrar Dene</Button>
    </div>
  );
}
