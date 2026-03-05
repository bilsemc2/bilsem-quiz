import { readFileSync } from 'fs';
import { basename, extname } from 'path';
import fg from 'fast-glob';

const DOCUMENTS_DIR = '/Users/yetenekvezeka/Documents';
const { readdirSync } = await import('fs');

// Tüm Karikatür* klasörlerini bul
const KARIKATÜR_DIRS = readdirSync(DOCUMENTS_DIR)
    .filter(name => name.startsWith('Karikatür') || name.startsWith('Karikatu'))
    .map(name => `${DOCUMENTS_DIR}/${name}`);

// Tüm yerel dosyaları topla
const allLocalFiles = [];
for (const dir of KARIKATÜR_DIRS) {
    const files = await fg(['**/*.png', '**/*.jpg', '**/*.jpeg'], { cwd: dir, absolute: true });
    allLocalFiles.push(...files);
}

console.log(`Yerel dosya sayısı: ${allLocalFiles.length}`);

// Normalize fonksiyonu: Her türlü özel karakteri temizle
function normalize(str) {
    return str
        .toLowerCase()
        .normalize('NFC')
        // Türkçe karakterleri koru ama backtick/apostrof/tırnak kaldır
        .replace(/[`'''""]/g, '')
        // Parantez içerikleri kaldır
        .replace(/\s*\([^)]*\)/g, '')
        // Özel karakterleri boşluğa çevir
        .replace(/[_\-.,\/\\!?;:]/g, ' ')
        // Çift boşlukları tek yap
        .replace(/\s+/g, ' ')
        .trim();
}

// Altçizgi listesini token listesine çevir
function getTokens(str) {
    return normalize(str).split(' ').filter(Boolean);
}

// Hedef dosya adından alternatifleri çıkar
// ör: "geçmek__girmek" → ["geçmek", "girmek"]
function expandTarget(targetBase) {
    // __ ile bölünmüş alternatifleri al
    const parts = targetBase.split('__');
    // Her part ayrı bir varyant
    return parts.map(p => p.replace(/_/g, ' ').replace(/[`'''""]/g, '').trim().toLowerCase());
}

// İki string ne kadar benzer? (token overlap)
function similarity(a, b) {
    const tokA = new Set(getTokens(a));
    const tokB = new Set(getTokens(b));
    if (tokA.size === 0 || tokB.size === 0) return 0;
    let overlap = 0;
    for (const t of tokA) if (tokB.has(t)) overlap++;
    // Jaccard-benzeri: overlap / birleşim
    const union = new Set([...tokA, ...tokB]).size;
    return overlap / union;
}

// Eksik listesini yükle
const missingFiles = readFileSync('/Users/yetenekvezeka/Documents/r2_eksik_deyimler_tum.txt', 'utf-8')
    .split('\n').filter(Boolean).map(f => f.trim());

console.log(`Eksik dosya sayısı: ${missingFiles.length}\n`);

// Her eksik için en iyi eşleşmeyi bul
let found = 0;
let notFound = 0;
const results = [];

for (const r2Key of missingFiles) {
    const ext = extname(r2Key);
    const targetBase = r2Key.replace(/\.(png|jpg|jpeg)$/i, '');
    const variants = expandTarget(targetBase);

    let bestMatch = null;
    let bestScore = 0;

    for (const local of allLocalFiles) {
        const localExt = extname(local);
        const lBase = basename(local, localExt);
        const lNorm = normalize(lBase);

        for (const variant of variants) {
            const score = similarity(variant, lNorm);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = local;
            }
        }
    }

    if (bestScore >= 0.6) {
        found++;
        results.push({ r2Key, local: bestMatch, score: bestScore.toFixed(2), status: '✅ BULUNDU' });
    } else if (bestScore >= 0.4) {
        results.push({ r2Key, local: bestMatch, score: bestScore.toFixed(2), status: '⚠️  ZAYIF' });
        notFound++;
    } else {
        notFound++;
        results.push({ r2Key, local: bestMatch, score: bestScore.toFixed(2), status: '❌ YOK' });
    }
}

// Sonuçları göster
const good = results.filter(r => r.status.startsWith('✅'));
const weak = results.filter(r => r.status.startsWith('⚠️'));
const bad = results.filter(r => r.status.startsWith('❌'));

console.log(`✅ Yüksek güven (>=0.6): ${good.length}`);
console.log(`⚠️  Zayıf eşleşme (0.4-0.6): ${weak.length}`);
console.log(`❌ Bulunamadı (<0.4): ${bad.length}`);

console.log('\n--- İlk 30 BULUNDU ---');
good.slice(0, 30).forEach(r => console.log(`[${r.score}] ${r.r2Key}\n       → ${r.local}`));

console.log('\n--- Zayıf eşleşmeler (ilk 10) ---');
weak.slice(0, 10).forEach(r => console.log(`[${r.score}] ${r.r2Key}\n       → ${r.local}`));
