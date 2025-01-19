import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(__dirname, '../public/images/options/Matris');

// 6-10 arası sorular için detaylı kontrol
const startQuestion = 6;
const endQuestion = 10;

console.log(`Soru Kontrolleri (${startQuestion}-${endQuestion} arası):`);
console.log('=================');

for (let questionNumber = startQuestion; questionNumber <= endQuestion; questionNumber++) {
    const questionDir = path.join(baseDir, questionNumber.toString());
    if (!fs.statSync(questionDir).isDirectory()) {
        console.log(`❌ Soru ${questionNumber}: Klasör bulunamadı!`);
        continue;
    }

    const files = fs.readdirSync(questionDir)
        .filter(file => file.endsWith('.webp'))
        .sort(); // Dosyaları sıralı göster

    console.log(`\nSoru ${questionNumber}:`);
    console.log('-------------');
    console.log('Tüm dosyalar:', files.join(', '));

    // Doğru cevabı bul
    const correctAnswer = files.find(file => 
        file.toLowerCase().includes('-cevap-') || 
        file.toLowerCase().includes('-cevaba-') || 
        file.toLowerCase().includes('-cevab-')
    );

    if (!correctAnswer) {
        console.log('❌ Doğru cevap dosyası bulunamadı!');
        continue;
    }

    // Doğru cevap harfini bul
    const letterMatch = correctAnswer.match(/[A-E](?=\.webp$)/);
    if (!letterMatch) {
        console.log(`❌ Doğru cevap harfi bulunamadı! (${correctAnswer})`);
        continue;
    }

    console.log('✅ Doğru cevap dosyası:', correctAnswer);
    console.log('✅ Doğru cevap harfi:', letterMatch[0]);

    // Tüm seçenekleri kontrol et
    const options = {};
    files.forEach(file => {
        const match = file.match(/[A-E](?=\.webp$)/);
        if (match) {
            options[match[0]] = file;
        }
    });

    console.log('\nSeçenekler:');
    ['A', 'B', 'C', 'D', 'E'].forEach(letter => {
        if (options[letter]) {
            console.log(`  ${letter}: ${options[letter]}`);
        } else {
            console.log(`  ❌ ${letter} seçeneği eksik!`);
        }
    });
}
