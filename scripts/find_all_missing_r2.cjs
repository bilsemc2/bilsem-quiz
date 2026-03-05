const fs = require('fs');

// 1. R2 Dosyalarını Oku (NFC Normalize)
const r2Data = fs.readFileSync('/tmp/r2_actual_files.txt', 'utf-8');
const r2Files = new Set(
    r2Data.split('\n')
        .filter(f => f.trim())
        .map(f => f.replace('idioms/', '').normalize('NFC'))
);

// 2. SQL Dosyasını Parse Et
const sql = fs.readFileSync('/Users/yetenekvezeka/Documents/deyimler_rows (1).sql', 'utf-8');
const entries = [];
const tupleRegex = /\('(\d+)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'(true|false)',\s*'((?:[^']|'')*)'\)/g;

let match;
while ((match = tupleRegex.exec(sql)) !== null) {
    entries.push({
        id: match[1],
        deyim: match[2].replace(/''/g, "'"),
        image_filename: match[6].replace(/''/g, "'").normalize('NFC').replace(/\//g, '')
    });
}

console.log(`📊 Toplam Veritabanı Kaydı: ${entries.length}`);
console.log(`📊 Toplam R2 Dosyası: ${r2Files.size}`);

// 3. Eksikleri Bul (DB de var ama R2 de yok)
const missingInR2 = [];
const foundInR2 = [];

for (const entry of entries) {
    if (r2Files.has(entry.image_filename)) {
        foundInR2.push(entry);
    } else {
        missingInR2.push(entry);
    }
}

console.log(`\n✅ R2 de Bulunan Toplam: ${foundInR2.length}`);
console.log(`❌ R2 de EKSİK Toplam: ${missingInR2.length}`);

// Eksikleri bir dosyaya kaydet
const missingText = missingInR2.map(m => m.image_filename).join('\n');
fs.writeFileSync('/Users/yetenekvezeka/Documents/r2_eksik_deyimler_tum.txt', missingText);
console.log(`\n📄 Eksik olan ${missingInR2.length} dosyanın isim listesi buraya kaydedildi: /Users/yetenekvezeka/Documents/r2_eksik_deyimler_tum.txt`);
