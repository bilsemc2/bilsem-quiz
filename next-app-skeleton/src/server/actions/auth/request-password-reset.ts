'use server';

import { redirect } from 'next/navigation';

import { buildPathWithQuery, getAppOrigin } from '@/server/auth/redirect-utils';
import { createSupabaseServerClient, hasSupabaseConfig } from '@/server/auth/supabase-server';

function buildForgotPasswordRedirect(params: { error?: string; message?: string }): string {
  return buildPathWithQuery('/forgot-password', {
    error: params.error,
    message: params.message,
  });
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    redirect(buildForgotPasswordRedirect({ error: 'E-posta zorunludur.' }));
  }

  if (!hasSupabaseConfig()) {
    redirect(
      buildForgotPasswordRedirect({
        error: 'Supabase ayarlari eksik. .env.local dosyasini kontrol edin.',
      }),
    );
  }

  const supabase = await createSupabaseServerClient();

  const callbackUrl = new URL('/auth/callback', getAppOrigin());
  callbackUrl.searchParams.set('next', '/reset-password');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: callbackUrl.toString(),
  });

  if (error) {
    redirect(buildForgotPasswordRedirect({ error: error.message }));
  }

  redirect(
    buildForgotPasswordRedirect({
      message: 'Sifre sifirlama baglantisi gonderildi. E-posta kutunuzu kontrol edin.',
    }),
  );
}
