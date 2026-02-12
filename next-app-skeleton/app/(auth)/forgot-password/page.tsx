import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

interface ForgotPasswordPageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const { error, message } = await searchParams;

  return (
    <div className="stack" style={{ maxWidth: 520 }}>
      <h1>Sifre Sifirlama</h1>
      <ForgotPasswordForm
        errorMessage={error?.trim() ? error : null}
        infoMessage={message?.trim() ? message : null}
      />
    </div>
  );
}
