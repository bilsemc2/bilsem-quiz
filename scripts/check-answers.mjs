import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(__dirname, '../public/images/options/Matris');

// Her soru için doğru cevapları bul
const questions = fs.readdirSync(baseDir)
    .filter(dir => !dir.startsWith('.')) // .DS_Store gibi dosyaları atla
    .sort((a, b) => Number(a) - Number(b));

console.log('Soru Kontrolleri:');
console.log('=================');

questions.forEach(questionNumber => {
    const questionDir = path.join(baseDir, questionNumber);
    if (!fs.statSync(questionDir).isDirectory()) return;

    const files = fs.readdirSync(questionDir)
        .filter(file => file.endsWith('.webp'));

    // Doğru cevabı bul
    const correctAnswer = files.find(file => 
        file.toLowerCase().includes('-cevap-') || 
        file.toLowerCase().includes('-cevaba-') || 
        file.toLowerCase().includes('-cevab-')
    );

    if (!correctAnswer) {
        console.log(`❌ Soru ${questionNumber}: Doğru cevap bulunamadı!`);
        return;
    }

    // Doğru cevap harfini bul
    const letterMatch = correctAnswer.match(/[A-E](?=\.webp$)/);
    if (!letterMatch) {
        console.log(`❌ Soru ${questionNumber}: Doğru cevap harfi bulunamadı! (${correctAnswer})`);
        return;
    }

    // Tüm seçenekleri kontrol et
    const letters = files
        .map(file => {
            const match = file.match(/[A-E](?=\.webp$)/);
            return match ? match[0] : null;
        })
        .filter(Boolean);

    const uniqueLetters = new Set(letters);
    
    if (uniqueLetters.size !== 5) {
        console.log(`❌ Soru ${questionNumber}: ${uniqueLetters.size} farklı seçenek var (5 olmalı)`);
        console.log('   Mevcut harfler:', Array.from(uniqueLetters).sort().join(', '));
        console.log('   Dosyalar:', files.join(', '));
        return;
    }

    console.log(`✅ Soru ${questionNumber}: Doğru cevap ${letterMatch[0]} (${correctAnswer})`);
});
