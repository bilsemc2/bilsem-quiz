/**
 * Eksik Deyim Karikatürlerini Cloudflare R2'ye Yükleme Scripti
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join, basename, extname } from 'path';
import fg from 'fast-glob';

// R2 Credentials (çalıştırmadan önce ENV üzerinden alınacak)
const ACCOUNT_ID = '8a039be025dd2109371ab7345043fc00';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET_NAME = 'deyimler';

if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    console.error('HATA: R2_ACCESS_KEY_ID ve R2_SECRET_ACCESS_KEY ortam değişkenleri tanımlanmalı.');
    process.exit(1);
}

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
    },
});

// Documents altındaki tüm Karikatür* klasörlerini kök olarak kullan
const DOCUMENTS_DIR = '/Users/yetenekvezeka/Documents';
const KARIKATÜR_DIRS = readdirSync(DOCUMENTS_DIR)
    .filter(name => name.startsWith('Karikatür') || name.startsWith('Karikatu'))
    .map(name => join(DOCUMENTS_DIR, name));

// Tüm eksik dosyaları txt'den oku
const missingText = readFileSync('/Users/yetenekvezeka/Documents/r2_eksik_deyimler_tum.txt', 'utf-8');
const MISSING_FILES = missingText.split('\n')
    .filter(f => f.trim())
    .map(f => f.normalize('NFC'));

const DONE_LOG = '/Users/yetenekvezeka/Documents/r2_yuklenen_log.txt';
const doneSet = new Set(
    (() => { try { return readFileSync(DONE_LOG, 'utf-8').split('\n').filter(Boolean); } catch { return []; } })()
);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function uploadFile(localPath, r2Key, attempt = 1) {
    let fileContent;
    try {
        fileContent = readFileSync(localPath);
    } catch (err) {
        if (attempt < 3) {
            console.warn(`⚠️  Dosya okuma hatası (${r2Key}), ${attempt}. deneme: ${err.message}`);
            await sleep(2000);
            return uploadFile(localPath, r2Key, attempt + 1);
        }
        console.error(`❌ Dosya okunamadı (${r2Key}):`, err.message);
        return false;
    }

    const lowerPath = localPath.toLowerCase();
    const contentType = (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) ? 'image/jpeg' : 'image/png';

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `idioms/${r2Key}`,
        Body: fileContent,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000'
    });

    try {
        await s3.send(command);
        console.log(`✅ Başarılı: ${r2Key}`);
        // Başarılı yüklemeleri log'a yaz (resume için)
        import('fs').then(({ appendFileSync }) => appendFileSync(DONE_LOG, r2Key + '\n'));
        return true;
    } catch (err) {
        if (attempt < 3) {
            console.warn(`⚠️  Yükleme hatası (${r2Key}), ${attempt}. deneme: ${err.message}`);
            await sleep(2000);
            return uploadFile(localPath, r2Key, attempt + 1);
        }
        console.error(`❌ Hata (${r2Key}):`, err.message);
        return false;
    }
}

// --- Fuzzy Eşleştirme Yardımcıları ---
function normalizeStr(str) {
    return str
        .toLowerCase()
        .normalize('NFC')
        .replace(/[`'''""]/g, '')           // apostrof temizle
        .replace(/\s*\([^)]*\)/g, '')       // parantez içeriği kaldır
        .replace(/[_\-.,\/\\!?;:]/g, ' ')  // özel char → boşluk
        .replace(/\s+/g, ' ')
        .trim();
}

function getTokens(str) {
    return normalizeStr(str).split(' ').filter(Boolean);
}

// __ ile ayrılmış alternatifleri genişlet
function expandVariants(targetBase) {
    const parts = targetBase.split('__');
    return parts.map(p => p.replace(/_/g, ' ').replace(/[`'''""]/g, '').trim().toLowerCase());
}

// Token overlap benzerliği (Jaccard)
function similarity(a, b) {
    const tokA = new Set(getTokens(a));
    const tokB = new Set(getTokens(b));
    if (tokA.size === 0 || tokB.size === 0) return 0;
    let overlap = 0;
    for (const t of tokA) if (tokB.has(t)) overlap++;
    const union = new Set([...tokA, ...tokB]).size;
    return overlap / union;
}

function findBestMatch(r2Key, allLocalFiles) {
    const targetBase = r2Key.replace(/\.(png|jpg|jpeg)$/i, '');
    const variants = expandVariants(targetBase);

    // Önce tam/normalize eşleşmeyi dene (hız için)
    for (const local of allLocalFiles) {
        const ext = extname(local);
        const lBase = basename(local, ext).trim().normalize('NFC').toLowerCase();
        const lNorm = lBase.replace(/[\s,.'']+/g, '_');
        const tNorm = targetBase.toLowerCase().replace(/[\s,.'']+/g, '_');
        if (lBase === targetBase.toLowerCase() || lNorm === tNorm) {
            return { local, score: 1.0 };
        }
    }

    // Fuzzy eşleştirme
    let bestMatch = null;
    let bestScore = 0;
    for (const local of allLocalFiles) {
        const ext = extname(local);
        const lBase = basename(local, ext);
        const lNorm = normalizeStr(lBase);
        for (const variant of variants) {
            const score = similarity(variant, lNorm);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = local;
            }
        }
    }

    return { local: bestMatch, score: bestScore };
}
// --- /Fuzzy Eşleştirme ---

async function main() {
    console.log(`🔍 Karikatür klasörleri: ${KARIKATÜR_DIRS.join(', ')}`);

    // Tüm Karikatür* klasörlerinin içinde PNG ve JPG ara (deyim alt klasörleri dahil)
    const allLocalFiles = [];
    for (const dir of KARIKATÜR_DIRS) {
        const files = await fg(['**/*.png', '**/*.jpg', '**/*.jpeg'], { cwd: dir, absolute: true });
        allLocalFiles.push(...files);
    }
    console.log(`📂 Toplam ${allLocalFiles.length} adet yerel resim bulundu.`);

    let uploadedCount = 0;
    let notFoundCount = 0;

    // Sadece eksik listesinde olanları yükleyelim
    for (const r2Key of MISSING_FILES) {
        // Daha önce başarıyla yüklendiyse atla (resume)
        if (doneSet.has(r2Key)) {
            console.log(`⏭️  Atlandı (zaten yüklü): ${r2Key}`);
            uploadedCount++;
            continue;
        }

        const { local, score } = findBestMatch(r2Key, allLocalFiles);

        if (local && score >= 0.6) {
            console.log(`\n⏳ Yükleniyor: ${r2Key} [benzerlik: ${(score * 100).toFixed(0)}%] (Bulundu: ${local})`);
            const success = await uploadFile(local, r2Key);
            if (success) uploadedCount++;
        } else {
            if (local && score >= 0.4) {
                console.log(`⚠️  Zayıf eşleşme atlandı (${(score * 100).toFixed(0)}%): ${r2Key} → ${basename(local)}`);
            }
            notFoundCount++;
        }
    }

    console.log(`\n🎉 Yükleme tamamlandı. Toplam ${uploadedCount}/${MISSING_FILES.length} eksik resim yüklendi.`);
    console.log(`📋 Lokalinde bulunamayan: ${notFoundCount} dosya`);
}

main();
