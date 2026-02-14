import { supabase } from '../../../lib/supabase';

export async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    // Get auth session for Edge Function call
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      // Use secure Edge Function proxy
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ url }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Proxy HTTP ${response.status}`);
        }

        const blob = await response.blob();

        if (blob.size === 0) {
          throw new Error('Boş yanıt');
        }

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (proxyError) {
        clearTimeout(timeoutId);
        throw proxyError;
      }
    }

    // Fallback: try direct fetch (same-origin or CORS-enabled URLs)
    const directResponse = await fetch(url, {
      headers: { 'Accept': 'image/*' },
    });

    if (!directResponse.ok) {
      throw new Error(`Direct fetch failed: HTTP ${directResponse.status}`);
    }

    const blob = await directResponse.blob();
    if (blob.size === 0 || !blob.type.startsWith('image/')) {
      throw new Error('Geçersiz resim');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Resim yükleme zaman aşımına uğradı');
    }
    throw error;
  }
}