'use server';

import { redirect } from 'next/navigation';

import { buildPathWithQuery, normalizeNextPath } from '@/server/auth/redirect-utils';
import { createSupabaseServerClient, hasSupabaseConfig } from '@/server/auth/supabase-server';

const DEFAULT_AFTER_LOGIN = '/dashboard';

function buildLoginRedirect(params: { error?: string; message?: string; nextPath: string }): string {
  return buildPathWithQuery('/login', {
    error: params.error,
    message: params.message,
    next: params.nextPath !== DEFAULT_AFTER_LOGIN ? params.nextPath : null,
  });
}

export async function signInWithPasswordAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const nextPath = normalizeNextPath(String(formData.get('next') ?? DEFAULT_AFTER_LOGIN));

  if (!email || !password) {
    redirect(buildLoginRedirect({ error: 'E-posta ve sifre zorunludur.', nextPath }));
  }

  if (!hasSupabaseConfig()) {
    redirect(
      buildLoginRedirect({
        error: 'Supabase ayarlari eksik. .env.local dosyasini kontrol edin.',
        nextPath,
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(buildLoginRedirect({ error: error.message, nextPath }));
  }

  redirect(nextPath);
}
