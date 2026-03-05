/**
 * Browser Console'da çalıştırılacak R2 Image Kontrol Scripti
 * 
 * Kullanım: 
 * 1. Tarayıcıda herhangi bir sayfayı aç
 * 2. F12 → Console
 * 3. Bu scripti yapıştır ve Enter
 * 4. Sonuçlar console'da görünecek
 */

(async () => {
    const R2_BASE = 'https://pub-b3e7ea8c224a4800a9357cea8e40926e.r2.dev/idioms';
    const SUPABASE_URL = 'https://biltdannugeaosqgjryo.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpbHRkYW5udWdlYW9zcWdqcnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1NzIwNjgsImV4cCI6MjA0OTE0ODA2OH0.-KXgbwXpB0KD6dpmQEhmzfg7v-6XdRzrGz7DOnKMflM';

    console.log('📚 Deyimler yükleniyor...');

    // Tüm deyimleri çek (child_safe=true)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/deyimler?child_safe=eq.true&select=id,deyim,image_filename&order=id`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const deyimler = await res.json();
    console.log(`✅ ${deyimler.length} child_safe deyim bulundu.`);
    console.log('🔍 Resimler kontrol ediliyor...');

    const found = [];
    const missing = [];
    const BATCH = 10;

    for (let i = 0; i < deyimler.length; i += BATCH) {
        const batch = deyimler.slice(i, i + BATCH);
        await Promise.all(batch.map(async (d) => {
            const filename = d.image_filename || d.deyim.toLowerCase().replace(/ /g, '_') + '.png';
            try {
                const r = await fetch(`${R2_BASE}/${encodeURIComponent(filename)}`, { method: 'HEAD' });
                if (r.ok) found.push(d);
                else missing.push({ ...d, filename });
            } catch {
                missing.push({ ...d, filename });
            }
        }));
        console.log(`  ${Math.min(i + BATCH, deyimler.length)}/${deyimler.length}...`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log(`📊 SONUÇ: ✅ ${found.length} bulundu, ❌ ${missing.length} eksik`);
    console.log('═══════════════════════════════════════');

    if (missing.length > 0) {
        console.table(missing.map(m => ({ id: m.id, deyim: m.deyim, dosya: m.filename })));
    }
})();
