'use server';

import { redirect } from 'next/navigation';

import { buildPathWithQuery, getAppOrigin, normalizeNextPath } from '@/server/auth/redirect-utils';
import { createSupabaseServerClient, hasSupabaseConfig } from '@/server/auth/supabase-server';

const DEFAULT_AFTER_SIGNUP = '/dashboard';

function buildSignUpRedirect(params: { error?: string; message?: string; nextPath: string }): string {
  return buildPathWithQuery('/signup', {
    error: params.error,
    message: params.message,
    next: params.nextPath !== DEFAULT_AFTER_SIGNUP ? params.nextPath : null,
  });
}

function buildLoginRedirectAfterSignup(nextPath: string): string {
  return buildPathWithQuery('/login', {
    message: 'Kayit olusturuldu. E-posta dogrulamasi icin gelen kutunuzu kontrol edin.',
    next: nextPath !== DEFAULT_AFTER_SIGNUP ? nextPath : null,
  });
}

export async function signUpWithPasswordAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');
  const fullName = String(formData.get('fullName') ?? '').trim();
  const school = String(formData.get('school') ?? '').trim();
  const gradeRaw = String(formData.get('grade') ?? '').trim();
  const nextPath = normalizeNextPath(String(formData.get('next') ?? DEFAULT_AFTER_SIGNUP));

  if (!email || !password || !confirmPassword || !fullName) {
    redirect(buildSignUpRedirect({ error: 'Ad soyad, e-posta ve sifre zorunludur.', nextPath }));
  }

  if (password !== confirmPassword) {
    redirect(buildSignUpRedirect({ error: 'Sifreler eslesmiyor.', nextPath }));
  }

  if (password.length < 6) {
    redirect(buildSignUpRedirect({ error: 'Sifre en az 6 karakter olmali.', nextPath }));
  }

  if (!hasSupabaseConfig()) {
    redirect(
      buildSignUpRedirect({
        error: 'Supabase ayarlari eksik. .env.local dosyasini kontrol edin.',
        nextPath,
      }),
    );
  }

  const supabase = await createSupabaseServerClient();
  const grade = Number.parseInt(gradeRaw, 10);

  const callbackUrl = new URL('/auth/callback', getAppOrigin());
  callbackUrl.searchParams.set('next', nextPath);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      data: {
        full_name: fullName,
        school: school || null,
        grade: Number.isNaN(grade) ? null : grade,
      },
    },
  });

  if (error) {
    redirect(buildSignUpRedirect({ error: error.message, nextPath }));
  }

  if (data.session) {
    redirect(nextPath);
  }

  redirect(buildLoginRedirectAfterSignup(nextPath));
}
