'use server';

import { redirect } from 'next/navigation';

import { buildPathWithQuery } from '@/server/auth/redirect-utils';
import { createSupabaseServerClient, hasSupabaseConfig } from '@/server/auth/supabase-server';

function buildResetPasswordRedirect(params: { error?: string }): string {
  return buildPathWithQuery('/reset-password', {
    error: params.error,
  });
}

function buildLoginRedirect(message: string): string {
  return buildPathWithQuery('/login', {
    message,
  });
}

export async function updatePasswordAction(formData: FormData) {
  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!newPassword || !confirmPassword) {
    redirect(buildResetPasswordRedirect({ error: 'Yeni sifre ve tekrar alani zorunludur.' }));
  }

  if (newPassword !== confirmPassword) {
    redirect(buildResetPasswordRedirect({ error: 'Sifreler eslesmiyor.' }));
  }

  if (newPassword.length < 6) {
    redirect(buildResetPasswordRedirect({ error: 'Sifre en az 6 karakter olmali.' }));
  }

  if (!hasSupabaseConfig()) {
    redirect(
      buildResetPasswordRedirect({
        error: 'Supabase ayarlari eksik. .env.local dosyasini kontrol edin.',
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(
      buildPathWithQuery('/login', {
        error: 'Sifre yenileme oturumu gecersiz. Yeniden sifirlama istegi gonderin.',
      }),
    );
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    redirect(buildResetPasswordRedirect({ error: updateError.message }));
  }

  await supabase.auth.signOut();

  redirect(buildLoginRedirect('Sifre guncellendi. Yeni sifrenizle giris yapabilirsiniz.'));
}
