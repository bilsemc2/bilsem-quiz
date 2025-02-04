// pages/api/check-answers.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    // Projenizin kök dizininden (process.cwd()) göreceli yol
    const baseDir = path.join(process.cwd(), 'src/images/options/Matris');

    // Tüm soru dizinlerini oku, gizli dosyaları atla ve sayısal sıraya göre düzenle
    const questionDirs = fs.readdirSync(baseDir)
      .filter(name => !name.startsWith('.'))
      .sort((a, b) => Number(a) - Number(b));

    const logs = [];
    logs.push('Soru Kontrolleri:');
    logs.push('=================');

    questionDirs.forEach(questionNumber => {
      const questionDir = path.join(baseDir, questionNumber);
      if (!fs.statSync(questionDir).isDirectory()) return;

      const files = fs.readdirSync(questionDir).filter(file => file.endsWith('.webp'));

      // Dosya isminde "-cevap-" ifadesi geçen dosyayı doğru cevap olarak belirle
      const correctFile = files.find(file => file.toLowerCase().includes('-cevap-'));
      if (!correctFile) {
        logs.push(`❌ Soru ${questionNumber}: Doğru cevap bulunamadı!`);
        return;
      }

      // Dosya isminde A-E aralığından doğru cevabı çıkar
      const correctMatch = correctFile.match(/[A-E](?=\.webp$)/);
      if (!correctMatch) {
        logs.push(`❌ Soru ${questionNumber}: Doğru cevap harfi bulunamadı! (${correctFile})`);
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
        logs.push(`❌ Soru ${questionNumber}: ${uniqueLetters.size} farklı seçenek var (5 olmalı).`);
        logs.push(`   Mevcut harfler: ${Array.from(uniqueLetters).sort().join(', ')}`);
        return;
      }

      logs.push(`✅ Soru ${questionNumber}: Doğru cevap ${correctLetter} (${correctFile})`);
    });

    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}