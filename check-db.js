import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDb() {
    console.log("Supabase veritabanı kontrol ediliyor...");

    // Tablodaki tüm kayıtları getirmeyi dene (RLS izin veriyorsa)
    const { data, error } = await supabase
        .from('music_test_results')
        .select('*')
        .limit(10);

    if (error) {
        console.error("Sorgu Hatası:", error);
    } else {
        console.log(`Tabloda ${data.length} kayıt bulundu (anonim sorgu ile görülebilen).`);
        if (data.length > 0) {
            console.log("Örnek Kayıtlar:", JSON.stringify(data, null, 2));
        }
    }

    // Eğer admin yetkisi (service_role) varsa, tüm tabloyu RLS'i aşarak kontrol edelim.
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log("\nService Role Key bulundu. Tüm veritabanı RLS atlanarak taranıyor...");
        const adminSupabase = createClient(
            process.env.VITE_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: adminData, error: adminError } = await adminSupabase
            .from('music_test_results')
            .select('*');

        if (adminError) {
            console.error("Admin Sorgu Hatası:", adminError);
        } else {
            console.log(`RLS Atlanarak Tabloda Toplam ${adminData?.length || 0} kayıt bulundu.`);
            if (adminData && adminData.length > 0) {
                console.log("Tüm kayıtların test_type listesi:", adminData.map(d => d.test_type).join(", "));
            }
        }
    } else {
        console.log("\nSUPABASE_SERVICE_ROLE_KEY bulunamadı. Tam tablo analizi (RLS aşma) yapılamıyor.");
    }
}

checkDb().catch(console.error);
