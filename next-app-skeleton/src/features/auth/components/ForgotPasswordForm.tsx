import Link from 'next/link';

import { requestPasswordResetAction } from '@/server/actions/auth/request-password-reset';
import { Card } from '@/shared/ui/Card';

interface ForgotPasswordFormProps {
  errorMessage?: string | null;
  infoMessage?: string | null;
}

export function ForgotPasswordForm({ errorMessage, infoMessage }: ForgotPasswordFormProps) {
  return (
    <Card title="Sifre Sifirlama">
      <p className="muted" style={{ marginTop: 0 }}>
        Hesabina ait e-posta adresini gir. Sifreni yenilemek icin bir baglanti gonderecegiz.
      </p>

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

      <form className="stack" action={requestPasswordResetAction}>
        <label className="stack-sm">
          <span>E-posta</span>
          <input className="input" name="email" type="email" autoComplete="email" required />
        </label>

        <button className="btn btn-primary" type="submit">
          Sifirlama Maili Gonder
        </button>
      </form>

      <p className="muted" style={{ marginBottom: 0 }}>
        <Link href="/login">Giris sayfasina don</Link>
      </p>
    </Card>
  );
}
