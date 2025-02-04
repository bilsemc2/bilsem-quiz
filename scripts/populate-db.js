import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Soru seçeneklerinin bulunduğu temel dizin
const baseDir = path.join(__dirname, '../public/images/options/Matris');
const questionsDir = path.join(__dirname, '../public/images/questions/Matris');

// Veritabanı bağlantısı
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

async function populateQuestions() {
  try {
    await client.connect();
    console.log('Veritabanına bağlanıldı.');

    // Tüm soru dizinlerini oku, gizli dosyaları ve sayısal olmayan dizinleri filtrele
    const questionDirs = fs.readdirSync(baseDir)
      .filter(name => !name.startsWith('.') && /^\d+$/.test(name))
      .sort((a, b) => Number(a) - Number(b));

    console.log('Soru Kontrolleri ve Veritabanı Güncellemesi:');
    console.log('========================================');

    for (const questionNumber of questionDirs) {
      const questionDir = path.join(baseDir, questionNumber);
      if (!fs.statSync(questionDir).isDirectory()) continue;

      const files = fs.readdirSync(questionDir).filter(file => file.endsWith('.webp'));

      // Dosya isminde "-cevap-" ifadesi geçen dosyayı doğru cevap olarak belirle
      const correctFile = files.find(file => file.toLowerCase().includes('-cevap-'));
      if (!correctFile) {
        console.log(`❌ Soru ${questionNumber}: Doğru cevap bulunamadı!`);
        continue;
      }

      // Doğru cevap harfini, dosya isminde A-E aralığından çıkar
      const correctMatch = correctFile.match(/[A-E](?=\.webp$)/);
      if (!correctMatch) {
        console.log(`❌ Soru ${questionNumber}: Doğru cevap harfi bulunamadı! (${correctFile})`);
        continue;
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
        continue;
      }

      // Soru resminin varlığını kontrol et
      const questionImagePath = path.join(questionsDir, `Soru-${questionNumber}.webp`);
      if (!fs.existsSync(questionImagePath)) {
        console.log(`❌ Soru ${questionNumber}: Soru resmi bulunamadı!`);
        continue;
      }

      try {
        // Soruyu veritabanına ekle
        const questionData = {
          text: `Soru ${questionNumber}`,
          image_url: `/images/questions/Matris/Soru-${questionNumber}.webp`,
          options: JSON.stringify(['A', 'B', 'C', 'D', 'E']),
          correct_option_id: correctLetter
        };

        // Önce mevcut soruyu silip sonra yeniden ekleyelim
        await client.query('DELETE FROM public.questions WHERE text = $1', [questionData.text]);

        const insertQuery = `
          INSERT INTO public.questions (text, image_url, options, correct_option_id)
          VALUES ($1, $2, $3, $4)
          RETURNING id;
        `;

        const res = await client.query(insertQuery, [
          questionData.text,
          questionData.image_url,
          questionData.options,
          questionData.correct_option_id
        ]);

        console.log(`✅ Soru ${questionNumber}: Doğru cevap ${correctLetter} (${correctFile})`);
        console.log(`   Veritabanına eklendi/güncellendi, ID: ${res.rows[0].id}`);
      } catch (error) {
        console.error(`❌ Soru ${questionNumber}: Veritabanı hatası:`, error.message);
      }
    }
  } catch (error) {
    console.error('Genel hata:', error);
  } finally {
    await client.end();
    console.log('\nVeritabanı bağlantısı kapatıldı.');
  }
}

populateQuestions().catch(err => {
  console.error('Script çalışırken hata oluştu:', err);
  process.exit(1);
});
