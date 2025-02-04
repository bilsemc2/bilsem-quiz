const fs = require('fs');
const path = require('path');

// Soru seçeneklerinin bulunduğu temel dizin
const baseDir = path.join(__dirname, '../src/images/options/Matris');

// Tüm soru dizinlerini oku, gizli dosyaları filtrele ve sayısal sıraya göre düzenle
const questionDirs = fs.readdirSync(baseDir)
  .filter(name => !name.startsWith('.'))
  .sort((a, b) => Number(a) - Number(b));

console.log('Soru Kontrolleri:');
console.log('=================');

questionDirs.forEach(questionNumber => {
  const questionDir = path.join(baseDir, questionNumber);
  if (!fs.statSync(questionDir).isDirectory()) return;

  const files = fs.readdirSync(questionDir).filter(file => file.endsWith('.webp'));

  // Dosya isminde "-cevap-" ifadesi geçen dosyayı doğru cevap olarak belirle
  const correctFile = files.find(file => file.toLowerCase().includes('-cevap-'));
  if (!correctFile) {
    console.log(`❌ Soru ${questionNumber}: Doğru cevap bulunamadı!`);
    return;
  }

  // Doğru cevap harfini, dosya isminde A-E aralığından çıkar
  const correctMatch = correctFile.match(/[A-E](?=\.webp$)/);
  if (!correctMatch) {
    console.log(`❌ Soru ${questionNumber}: Doğru cevap harfi bulunamadı! (${correctFile})`);
    return;
  }
  const correctLetter = correctMatch[0];

  // Tüm dosyalardan harfleri çıkar ve benzersiz olanları kontrol et
  const letters = files
    .map(file => {
      const match = file.match(/[A-E](?=\.webp$)/);
      return match ? match[0] : null;
    })
    .filter(Boolean);

  const uniqueLetters = new Set(letters);
  if (uniqueLetters.size !== 5) {
    console.log(`❌ Soru ${questionNumber}: ${uniqueLetters.size} farklı seçenek var (5 olmalı).`);
    console.log('   Mevcut harfler:', Array.from(uniqueLetters).sort().join(', '));
    return;
  }

  console.log(`✅ Soru ${questionNumber}: Doğru cevap ${correctLetter} (${correctFile})`);
});