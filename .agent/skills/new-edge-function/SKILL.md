---
name: Supabase Edge Function Ekleme
description: Güvenli API proxy için yeni bir Supabase Edge Function oluşturur
---

# 🔧 Supabase Edge Function Ekleme Skill'i

## Gerekli Bilgiler

1. **Function Adı**: Örn. "gemini-proxy"
2. **Amaç**: API anahtarını gizleme, rate limiting, vb.
3. **HTTP Method**: GET, POST, vb.

---

## Adım 1: Klasör Oluştur

```bash
mkdir -p supabase/functions/[function-name]
```

---

## Adım 2: index.ts Oluştur

```typescript
// supabase/functions/[function-name]/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { data } = await req.json()
    
    // API anahtarını environment variable'dan al
    const apiKey = Deno.env.get('API_KEY')
    
    // İşlem yap
    const result = await fetch('https://api.example.com/endpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    const response = await result.json()
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
```

---

## Adım 3: Environment Variables

Supabase Dashboard > Edge Functions > Secrets:
```
API_KEY=your-secret-key
```

---

## Adım 4: Deploy

```bash
supabase functions deploy [function-name] --project-ref YOUR_PROJECT_REF
```

---

## Adım 5: Frontend Service

```typescript
// src/services/[serviceName].ts

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/[function-name]`;

export const callFunction = async (data: any) => {
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data }),
  });
  
  return response.json();
};
```

---

## Referans

- `supabase/functions/gemini-proxy/`
- `supabase/functions/xp-transaction/`
