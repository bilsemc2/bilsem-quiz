import { LoginForm } from '@/features/auth/components/LoginForm';
import { normalizeNextPath } from '@/server/auth/redirect-utils';

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error, message } = await searchParams;

  const nextPath = normalizeNextPath(next, '/dashboard');
  const errorMessage = error?.trim() ? error : null;
  const infoMessage = message?.trim() ? message : null;

  return (
    <div className="stack" style={{ maxWidth: 460 }}>
      <h1>Kimlik Dogrulama</h1>
      <p className="muted">Supabase Auth email/sifre girisi aktif.</p>
      <LoginForm nextPath={nextPath} errorMessage={errorMessage} infoMessage={infoMessage} />
    </div>
  );
}
