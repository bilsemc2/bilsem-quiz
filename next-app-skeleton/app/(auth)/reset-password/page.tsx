import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

interface ResetPasswordPageProps {
  searchParams: Promise<{ error?: string; message?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { error, message } = await searchParams;

  return (
    <div className="stack" style={{ maxWidth: 520 }}>
      <h1>Yeni Sifre Belirle</h1>
      <ResetPasswordForm
        errorMessage={error?.trim() ? error : null}
        infoMessage={message?.trim() ? message : null}
      />
    </div>
  );
}
