import { NextResponse } from 'next/server';

import { buildPathWithQuery, normalizeNextPath } from '@/server/auth/redirect-utils';
import { createSupabaseServerClient, hasSupabaseConfig } from '@/server/auth/supabase-server';

function buildLoginPath(error: string): string {
  return buildPathWithQuery('/login', { error });
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const providerError = requestUrl.searchParams.get('error_description');
  const nextPath = normalizeNextPath(requestUrl.searchParams.get('next'), '/dashboard');

  if (providerError) {
    return NextResponse.redirect(new URL(buildLoginPath(providerError), requestUrl.origin));
  }

  if (!hasSupabaseConfig()) {
    return NextResponse.redirect(
      new URL(
        buildLoginPath('Supabase ayarlari eksik. .env.local dosyasini kontrol edin.'),
        requestUrl.origin,
      ),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(buildLoginPath('Gecersiz dogrulama baglantisi.'), requestUrl.origin),
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(buildLoginPath(error.message), requestUrl.origin));
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
