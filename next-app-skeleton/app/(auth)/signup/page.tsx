import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { normalizeNextPath } from '@/server/auth/redirect-utils';

interface SignUpPageProps {
  searchParams: Promise<{ next?: string; error?: string; message?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { next, error, message } = await searchParams;

  const nextPath = normalizeNextPath(next, '/dashboard');
  const errorMessage = error?.trim() ? error : null;
  const infoMessage = message?.trim() ? message : null;

  return (
    <div className="stack" style={{ maxWidth: 560 }}>
      <h1>Yeni Hesap</h1>
      <p className="muted">Supabase Auth ile email/sifre kayit akisi aktif.</p>
      <SignUpForm nextPath={nextPath} errorMessage={errorMessage} infoMessage={infoMessage} />
    </div>
  );
}
