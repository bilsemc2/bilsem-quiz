/**
 * BİLSEM Data Import Script
 * 
 * Supabase'e BİLSEM verilerini yüklemek için tarayıcı konsolunda çalıştırılabilir.
 * 
 * KULLANIM:
 * 1. Supabase SQL Editor'da migration SQL'ini çalıştır
 * 2. Bu dosyayı browser'da import et veya console'a yapıştır
 */

// Türkçe karakterleri ASCII'ye çevir
function turkishToSlug(text) {
    const charMap = {
        'ç': 'c', 'Ç': 'c',
        'ğ': 'g', 'Ğ': 'g',
        'ı': 'i', 'İ': 'i',
        'ö': 'o', 'Ö': 'o',
        'ş': 's', 'Ş': 's',
        'ü': 'u', 'Ü': 'u',
    };

    let result = text.toLowerCase();
    for (const [tr, en] of Object.entries(charMap)) {
        result = result.replace(new RegExp(tr, 'g'), en);
    }

    return result
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// BİLSEM verileri (JSON dosyasından)
export const bilsemData = BILSEM_JSON_DATA_PLACEHOLDER;

// Verileri import et
export async function importBilsemData(supabase) {
    const slugCounts = {};

    const transformedData = bilsemData.map((record) => {
        let baseSlug = turkishToSlug(record.kurum_adi);

        if (slugCounts[baseSlug]) {
            slugCounts[baseSlug]++;
            baseSlug = `${baseSlug}-${slugCounts[baseSlug]}`;
        } else {
            slugCounts[baseSlug] = 1;
        }

        return {
            il_adi: record.il_adi,
            ilce_adi: record.ilce_adi,
            kurum_adi: record.kurum_adi,
            kurum_tur_adi: record.kurum_tur_adi,
            adres: record.adres,
            telefon_no: record.telefon_no || null,
            fax_no: record.fax_no || null,
            mernis_adres_kodu: record.mernis_adres_kodu,
            web_adres: record.web_adres || null,
            slug: baseSlug,
        };
    });

    console.log(`📊 ${transformedData.length} BİLSEM kaydı hazırlandı`);

    // Batch insert
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize);

        const { error } = await supabase
            .from('bilsem_kurumlari')
            .upsert(batch, { onConflict: 'slug' });

        if (error) {
            console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} hata:`, error);
        } else {
            insertedCount += batch.length;
            console.log(`✅ ${insertedCount}/${transformedData.length} kayıt yüklendi`);
        }
    }

    console.log(`\n🎉 ${insertedCount} BİLSEM kaydı veritabanına eklendi.`);
    return insertedCount;
}
