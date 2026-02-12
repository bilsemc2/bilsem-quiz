import Link from 'next/link';

import { signInWithPasswordAction } from '@/server/actions/auth/sign-in';
import { Card } from '@/shared/ui/Card';

interface LoginFormProps {
  nextPath: string;
  errorMessage?: string | null;
  infoMessage?: string | null;
}

export function LoginForm({ nextPath, errorMessage, infoMessage }: LoginFormProps) {
  return (
    <Card title="Giris Yap">
      {errorMessage ? (
        <p
          style={{
            border: '1px solid #fecaca',
            background: '#fef2f2',
            color: '#b91c1c',
            padding: '0.65rem 0.75rem',
            borderRadius: 10,
            marginTop: 0,
          }}
        >
          {errorMessage}
        </p>
      ) : null}

      {infoMessage ? (
        <p
          style={{
            border: '1px solid #86efac',
            background: '#f0fdf4',
            color: '#166534',
            padding: '0.65rem 0.75rem',
            borderRadius: 10,
            marginTop: 0,
          }}
        >
          {infoMessage}
        </p>
      ) : null}

      <form className="stack" action={signInWithPasswordAction}>
        <input name="next" type="hidden" value={nextPath} />

        <label className="stack-sm">
          <span>E-posta</span>
          <input className="input" name="email" type="email" autoComplete="email" required />
        </label>

        <label className="stack-sm">
          <span>Sifre</span>
          <input
            className="input"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        <button className="btn btn-primary" type="submit">
          Devam Et
        </button>
      </form>

      <p className="muted" style={{ marginBottom: 0 }}>
        Hesabin yok mu? <Link href="/signup">Kayit Ol</Link>
      </p>
      <p className="muted" style={{ marginTop: 0.2, marginBottom: 0 }}>
        Sifreni mi unuttun? <Link href="/forgot-password">Sifirla</Link>
      </p>
    </Card>
  );
}
