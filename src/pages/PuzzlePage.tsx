import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PuzzleRating from '../components/PuzzleRating';
import PuzzlePreview from '../components/PuzzlePreview';

// Puzzle arayüzü - grid tipini daha spesifik yapabilirsiniz (örneğin (string | null)[][])
interface Puzzle {
  id: string;
  title: string;
  created_at: string;
  grid: any[][]; // Varsa daha spesifik bir tip kullanın: (string | null)[][] vb.
  created_by: string;
  updated_at: string;
  approved: boolean;
}

export default function PuzzlePage() {
  // useParams tipini belirtmeye gerek yok, string olarak alınır.
  const { id } = useParams();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Hata durumu için state

  // fetchPuzzle fonksiyonunu useCallback ile memoize et
  const fetchPuzzle = useCallback(async () => {
    // id yoksa veya geçerli bir string değilse işlemi durdur
    if (!id) {
      setError('Geçerli bir bulmaca ID sağlanmadı.');
      setLoading(false);
      setPuzzle(null); // Önceki bulmaca verisini temizle
      return;
    }

    setLoading(true);
    setError(null); // Yeni fetch öncesi hatayı temizle
    setPuzzle(null); // Yeni fetch öncesi eski bulmacayı temizle (opsiyonel, UI'a bağlı)

    try {
      const { data, error: dbError } = await supabase
        .from('puzzles')
        .select('id, title, created_at, grid, created_by, updated_at, approved')
        .eq('id', id)
        .single(); // .single() eşleşme yoksa null döner, hata fırlatmaz

      if (dbError) {
        // Supabase'den dönen spesifik hataları ele al
        console.error('Supabase error:', dbError);
        throw new Error(`Veritabanı hatası: ${dbError.message}`);
      }

      if (!data) {
        // .single() null döndüyse bulmaca yoktur
        setError('Bulmaca bulunamadı.');
      } else {
        setPuzzle(data);
      }

    } catch (err: any) { // Hata tipini any veya Error olarak yakala
      console.error('Error fetching puzzle:', err);
      // Kullanıcıya gösterilecek genel bir hata mesajı ayarla
      // Eğer spesifik bir mesaj atılmadıysa genel bir mesaj kullan
      if (!error) { // Eğer yukarıda spesifik bir hata mesajı (örn: bulunamadı) ayarlanmadıysa
         setError(err.message || 'Bulmaca yüklenirken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  }, [id]); // id değiştiğinde fonksiyon yeniden oluşturulur

  useEffect(() => {
    fetchPuzzle();
  }, [fetchPuzzle]); // useEffect artık memoize edilmiş fetchPuzzle'a bağlı

  // --- Render Kısmı ---

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" aria-live="polite">
        <div
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"
          role="status" // Erişilebilirlik için rol ekle
        >
           <span className="sr-only">Yükleniyor...</span> {/* Ekran okuyucular için metin */}
        </div>
      </div>
    );
  }

  // Hata varsa göster
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Hata mesajını göster */}
        <h1 className="text-2xl font-bold text-red-600">{error}</h1>
        {/* İsteğe bağlı: Tekrar deneme butonu veya ana sayfaya link */}
      </div>
    );
  }

  // Bulmaca yoksa (hata yok ama data null ise - fetchPuzzle içinde handle edildiği için bu blok gereksiz olabilir ama güvence için kalabilir)
  if (!puzzle) {
     // Bu durum genellikle error state'i ile yakalanır, ancak bir güvence olarak kalabilir.
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-red-600">Bulmaca bulunamadı.</h1>
      </div>
    );
  }

  // Bulmaca onaylanmamışsa
  if (!puzzle.approved) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-yellow-600">Bu bulmaca henüz onaylanmamış veya yayında değil.</h1>
      </div>
    );
  }

  // Bulmaca bulundu, onaylandı ve hata yoksa göster
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-4">{puzzle.title}</h1>
        <div className="mb-6 text-sm text-gray-500">
          <p>
            Oluşturulma: {new Date(puzzle.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          {/* Güncelleme tarihi sadece varsa VE oluşturulma tarihinden farklıysa göster */}
          {puzzle.updated_at && puzzle.updated_at !== puzzle.created_at && (
            <p>
              Son Güncelleme: {new Date(puzzle.updated_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          )}
           {/* İsteğe bağlı: Oluşturan bilgisi (varsa ve göstermek isterseniz) */}
           {/* <p>Oluşturan: {puzzle.created_by}</p> */}
        </div>

        <div className="mb-8">
          {/* Grid varsa PuzzlePreview'ı render et */}
          {puzzle.grid && (
            <PuzzlePreview
              grid={puzzle.grid}
              scale="scale-100" // Tailwind scale class'ı
            />
          )}
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Bulmacayı Değerlendir</h2>
          <PuzzleRating puzzleId={puzzle.id} />
        </div>
      </div>
    </div>
  );
}