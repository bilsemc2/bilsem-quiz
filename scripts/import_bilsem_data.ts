/**
 * BİLSEM Verisi Import Script
 * 
 * JSON dosyasındaki BİLSEM kurumlarını Supabase'e yükler.
 * 
 * Kullanım:
 * 1. Önce .env dosyasında SUPABASE_URL ve SUPABASE_SERVICE_KEY tanımlayın
 * 2. npx ts-node scripts/import_bilsem_data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Türkçe karakterleri ASCII'ye çevir
function turkishToSlug(text: string): string {
    const charMap: Record<string, string> = {
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

interface BilsemRecord {
    il_adi: string;
    ilce_adi: string;
    kurum_adi: string;
    kurum_tur_adi: string;
    adres: string;
    telefon_no: string;
    fax_no: string;
    mernis_adres_kodu: string;
    web_adres: string;
}

async function importBilsemData() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ SUPABASE_URL ve SUPABASE_SERVICE_KEY tanımlı olmalı');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // JSON dosyasını oku
    const jsonPath = path.join(__dirname, '../bilsem_listesi.json');

    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ JSON dosyası bulunamadı: ${jsonPath}`);
        console.log('💡 JSON dosyasını scripts klasörüne kopyalayın veya yolu düzeltin');
        process.exit(1);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const records: BilsemRecord[] = JSON.parse(rawData);

    console.log(`📊 ${records.length} BİLSEM kaydı bulundu`);

    // Slug'ları takip et (benzersizlik için)
    const slugCounts: Record<string, number> = {};

    // Verileri dönüştür
    const transformedData = records.map((record) => {
        // Base slug oluştur
        let baseSlug = turkishToSlug(record.kurum_adi);

        // Slug benzersizliği için sayaç ekle
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
            web_adres: record.web_adres,
            slug: baseSlug,
        };
    });

    console.log('⏳ Veriler yükleniyor...');

    // Batch insert (100'erli gruplar halinde)
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize);

        const { error } = await supabase
            .from('bilsem_kurumlari')
            .upsert(batch, { onConflict: 'slug' });

        if (error) {
            console.error(`❌ Batch ${i / batchSize + 1} yüklenirken hata:`, error);
        } else {
            insertedCount += batch.length;
            console.log(`✅ ${insertedCount}/${transformedData.length} kayıt yüklendi`);
        }
    }

    console.log(`\n🎉 Tamamlandı! ${insertedCount} BİLSEM kaydı veritabanına eklendi.`);
}

importBilsemData().catch(console.error);
