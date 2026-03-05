/**
 * Worker URL üzerinden R2 Image Karşılaştırma (NFC normalize fix)
 */
import { readFileSync } from 'fs';

const WORKER_BASE = 'https://deyimler-images.bilsemc2-eth.workers.dev/idioms';
const SQL_FILE = '/Users/yetenekvezeka/Documents/deyimler_rows (1).sql';

function parseSqlInsert(sql) {
    const entries = [];
    const tupleRegex = /\('(\d+)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'(true|false)',\s*'((?:[^']|'')*)'\)/g;
    let match;
    while ((match = tupleRegex.exec(sql)) !== null) {
        entries.push({
            id: parseInt(match[1]),
            deyim: match[2].replace(/''/g, "'"),
            child_safe: match[5] === 'true',
            image_filename: match[6].replace(/''/g, "'"),
        });
    }
    return entries;
}

function normalizeFilename(filename) {
    return filename.normalize('NFC').replace(/\//g, '');
}

async function checkImage(filename) {
    try {
        const normalized = normalizeFilename(filename);
        const r = await fetch(`${WORKER_BASE}/${encodeURIComponent(normalized)}`, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        return r.ok;
    } catch { return false; }
}

async function main() {
    const sql = readFileSync(SQL_FILE, 'utf-8');
    const childSafe = parseSqlInsert(sql).filter(e => e.child_safe);

    console.log(`👶 child_safe: ${childSafe.length} deyim kontrol ediliyor...\n`);

    const found = [], missing = [];
    const BATCH = 10;

    for (let i = 0; i < childSafe.length; i += BATCH) {
        const batch = childSafe.slice(i, i + BATCH);
        const results = await Promise.all(batch.map(async d => ({
            ...d, exists: await checkImage(d.image_filename)
        })));
        for (const r of results) {
            if (r.exists) found.push(r);
            else missing.push(r);
        }
        process.stdout.write(`\r  ${Math.min(i + BATCH, childSafe.length)}/${childSafe.length}`);
    }

    console.log('\n\n' + '═'.repeat(50));
    console.log(`✅ Bulunan: ${found.length}/${childSafe.length}`);
    console.log(`❌ Eksik:   ${missing.length}/${childSafe.length}`);
    console.log('═'.repeat(50));

    if (missing.length > 0) {
        console.log('\n❌ R2\'de BULUNAMAYAN:');
        for (const m of missing) {
            console.log(`  ID:${m.id} "${m.deyim}" → ${normalizeFilename(m.image_filename)}`);
        }
    }
}

main();
