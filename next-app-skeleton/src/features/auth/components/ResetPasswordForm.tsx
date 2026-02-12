import Link from 'next/link';

import { updatePasswordAction } from '@/server/actions/auth/update-password';
import { Card } from '@/shared/ui/Card';

interface ResetPasswordFormProps {
  errorMessage?: string | null;
  infoMessage?: string | null;
}

export function ResetPasswordForm({ errorMessage, infoMessage }: ResetPasswordFormProps) {
  return (
    <Card title="Yeni Sifre Belirle">
      <p className="muted" style={{ marginTop: 0 }}>
        E-postadaki sifre yenileme baglantisindan geldiysen yeni sifreni asagidan belirleyebilirsin.
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

      <form className="stack" action={updatePasswordAction}>
        <label className="stack-sm">
          <span>Yeni Sifre</span>
          <input
            className="input"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>

        <label className="stack-sm">
          <span>Yeni Sifre Tekrar</span>
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
          Sifreyi Guncelle
        </button>
      </form>

      <p className="muted" style={{ marginBottom: 0 }}>
        Oturum sorunu yasiyorsan <Link href="/forgot-password">yeniden sifirlama maili iste</Link>.
      </p>
    </Card>
  );
}
