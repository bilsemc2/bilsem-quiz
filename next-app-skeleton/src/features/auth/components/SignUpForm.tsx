import Link from 'next/link';

import { signUpWithPasswordAction } from '@/server/actions/auth/sign-up';
import { Card } from '@/shared/ui/Card';

interface SignUpFormProps {
  nextPath: string;
  errorMessage?: string | null;
  infoMessage?: string | null;
}

const GRADE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function SignUpForm({ nextPath, errorMessage, infoMessage }: SignUpFormProps) {
  return (
    <Card title="Kayit Ol">
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

      <form className="stack" action={signUpWithPasswordAction}>
        <input name="next" type="hidden" value={nextPath} />

        <label className="stack-sm">
          <span>Ad Soyad</span>
          <input className="input" name="fullName" type="text" autoComplete="name" required />
        </label>

        <label className="stack-sm">
          <span>E-posta</span>
          <input className="input" name="email" type="email" autoComplete="email" required />
        </label>

        <label className="stack-sm">
          <span>Okul (Opsiyonel)</span>
          <input className="input" name="school" type="text" autoComplete="organization" />
        </label>

        <label className="stack-sm">
          <span>Sinif</span>
          <select className="input" name="grade" defaultValue="4">
            {GRADE_OPTIONS.map((grade) => (
              <option key={grade} value={grade}>
                {grade}. Sinif
              </option>
            ))}
          </select>
        </label>

        <label className="stack-sm">
          <span>Sifre</span>
          <input
            className="input"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>

        <label className="stack-sm">
          <span>Sifre Tekrar</span>
          <input
            className="input"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>

        <button className="btn btn-primary" type="submit">
          Hesap Olustur
        </button>
      </form>

      <p className="muted" style={{ marginBottom: 0 }}>
        Zaten hesabin var mi? <Link href="/login">Giris Yap</Link>
      </p>
    </Card>
  );
}
