import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightLeft, Trash2, Loader2 } from 'lucide-react'; // İkonlar eklendi
import { useUser } from '../hooks/useUser';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // Shadcn Card varsayımı

// --- Sabit Veriler (Bileşen Dışında) ---
interface CharMapValue {
  color: string;
  symbol: string; // Emoji veya başka bir sembol
}
type CharMappingType = Record<string, CharMapValue>;

// BENZERSİZ SEMBOLLERLE GÜNCELLENMİŞ EŞLEŞTİRME
const charMapping: CharMappingType = {
    'A': { color: '#FF6B6B', symbol: '🍎' }, // Elma
    'B': { color: '#4ECDC4', symbol: '🍌' }, // Muz
    'C': { color: '#45B7D1', symbol: '🍒' }, // Kiraz
    'Ç': { color: '#96CEB4', symbol: '🍓' }, // Çilek
    'D': { color: '#FF8B94', symbol: '🍇' }, // Üzüm
    'E': { color: '#4DA6FF', symbol: '🍉' }, // Karpuz
    'F': { color: '#FFA07A', symbol: '🍊' }, // Portakal
    'G': { color: '#9B59B6', symbol: '🍍' }, // Ananas
    'Ğ': { color: '#2ECC71', symbol: '🥝' }, // Kivi
    'H': { color: '#E74C3C', symbol: '🍅' }, // Domates
    'I': { color: '#16A085', symbol: '🍆' }, // Patlıcan
    'İ': { color: '#2980B9', symbol: '🌽' }, // Mısır
    'J': { color: '#FFB6C1', symbol: '🍑' }, // Şeftali
    'K': { color: '#98FB98', symbol: '🥑' }, // Avokado
    'L': { color: '#87CEEB', symbol: '🍋' }, // Limon
    'M': { color: '#DDA0DD', symbol: '🥭' }, // Mango
    'N': { color: '#F0E68C', symbol: '🍐' }, // Armut
    'O': { color: '#CD853F', symbol: '🥥' }, // Hindistan Cevizi
    'Ö': { color: '#556B2F', symbol: '🥦' }, // Brokoli
    'P': { color: '#4B0082', symbol: '🥔' }, // Patates
    'R': { color: '#FF4500', symbol: '🥕' }, // Havuç
    'S': { color: '#32CD32', symbol: '🌶️' }, // Biber
    'Ş': { color: '#4682B4', symbol: '🍄' }, // Mantar
    'T': { color: '#8B4513', symbol: '🌰' }, // Kestane
    'U': { color: '#483D8B', symbol: '🧅' }, // Soğan
    'Ü': { color: '#2F4F4F', symbol: '🥒' }, // Salatalık
    'V': { color: '#FF69B4', symbol: '🥬' }, // Marul
    'Y': { color: '#20B2AA', symbol: '🥜' }, // Fıstık
    'Z': { color: '#BA55D3', symbol: '🍇' }, // Üzüm (Zaten kullanılmış! Değiştirilmeli!) -> '🧄' (Sarımsak) yapalım
    ' ': { color: '#EAEAEA', symbol: '➖' }, // Boşluk için
    // Sayılar (Semboller benzersiz olmalı!)
    '0': { color: '#FFD700', symbol: '⭐' },
    '1': { color: '#C0C0C0', symbol: '⚪' },
    '2': { color: '#CD853F', symbol: '🟤' },
    '3': { color: '#DA70D6', symbol: '🟣' },
    '4': { color: '#DB7093', symbol: '🔴' },
    '5': { color: '#4169E1', symbol: '🔵' },
    '6': { color: '#9370DB', symbol: '🟩' },
    '7': { color: '#FA8072', symbol: '🟧' },
    '8': { color: '#F08080', symbol: '🟥' },
    '9': { color: '#E6E6FA', symbol: '⬜' }
};
// Z için düzeltme:
charMapping['Z'] = { color: '#BA55D3', symbol: '🧄' }; // Sarımsak

// Ters Eşleştirmeyi Oluştur (Optimize Edilmiş) - Sadece bir kere hesaplanır
const createReverseMapping = (mapping: CharMappingType): Record<string, string> => {
  const reverseMap: Record<string, string> = {};
  const symbolSet = new Set<string>(); // Sembollerin benzersizliğini kontrol etmek için

  for (const [char, { symbol }] of Object.entries(mapping)) {
    if (symbolSet.has(symbol)) {
      console.warn(`Tekrarlayan sembol bulundu ve üzerine yazılacak: ${symbol} (Harf: ${char})`);
      // Gerçek uygulamada burada bir hata fırlatmak veya varsayılan bir işlem yapmak daha iyi olabilir.
    }
    reverseMap[symbol] = char;
    symbolSet.add(symbol);
  }
  return reverseMap;
};
const reverseMapping = createReverseMapping(charMapping);

// Emoji/Sembol Ayırıcı Regex (Daha kapsamlı)
// Bu regex, Unicode emoji özelliklerini ve bazı yaygın sembolleri yakalamaya çalışır.
// Not: Emoji regex'leri karmaşıktır ve %100 kapsama sağlamayabilir.
const SYMBOL_REGEX = /(\p{Emoji_Presentation}|\p{Extended_Pictographic}|➖|⭐|⚪|🟤|🟣|🔴|🔵|🟩|🟧|🟥|⬜)/gu;

// --- Ana Bileşen ---
const VisualEncoderPage: React.FC = () => {
  // --- Hooklar ---
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useUser();
  const { hasEnoughXP, userXP, requiredXP, loading: xpLoading } = useXPCheck(false);

  // --- State'ler ---
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [decodedText, setDecodedText] = useState(''); // Decode sonucu için ayrı state
  const [encodedElements, setEncodedElements] = useState<JSX.Element[]>([]); // Encode sonucu için ayrı state

  // --- Efektler ---
  // Kullanıcı Giriş Kontrolü
  useEffect(() => {
    if (!userLoading && !currentUser) {
      toast.error("Bu sayfayı görmek için giriş yapmalısınız.");
      navigate('/login', { replace: true });
    }
  }, [currentUser, userLoading, navigate]);

  // Encode/Decode işlemini inputText veya mode değiştikçe tetikle
  useEffect(() => {
    if (mode === 'encode') {
      const upperCaseText = inputText.toUpperCase();
      const elements = upperCaseText.split('').map((char, index) => {
        const mapping = charMapping[char];
        // Bilinmeyen karakterler veya boşluklar için stil
        const style: React.CSSProperties = mapping
          ? { color: mapping.color }
          : { color: '#A0A0A0', fontStyle: 'italic' }; // Gri ve italik
        const symbol = mapping ? mapping.symbol : char; // Eşleşme yoksa karakteri göster

        return (
          <span
            key={`${char}-${index}`}
            style={style}
            className="inline-block mx-0.5 text-2xl leading-relaxed" // Boyut ve boşluk
            title={`Harf: ${char}`} // Hover'da harfi göster
          >
            {symbol}
          </span>
        );
      });
      setEncodedElements(elements);
    } else {
      // Decode işlemi
      // inputText'i SYMBOL_REGEX ile böl
      const symbols = inputText.match(SYMBOL_REGEX) || [];
      const decoded = symbols.map(symbol => reverseMapping[symbol] || '?').join(''); // Bilinmeyen sembol için '?'
      setDecodedText(decoded);
    }
  }, [inputText, mode]);

  // --- Olay Yöneticileri (useCallback ile) ---
  const handleModeToggle = useCallback(() => {
    setMode(prev => (prev === 'encode' ? 'decode' : 'encode'));
    setInputText(''); // Mod değişince girişi temizle
    setDecodedText('');
    setEncodedElements([]);
  }, []);

  const handleSymbolClick = useCallback((symbol: string) => {
    setInputText(prev => prev + symbol);
  }, []);

  const handleBackspace = useCallback(() => {
    // Son sembolü silmek için regex ile eşleşen son kısmı çıkar
    setInputText(prev => {
        const matches = prev.match(SYMBOL_REGEX) || [];
        if (matches.length > 0) {
            // Son eşleşmeyi string'den çıkar
            const lastMatch = matches[matches.length - 1];
            const lastIndex = prev.lastIndexOf(lastMatch);
            if(lastIndex !== -1) {
                 return prev.substring(0, lastIndex);
            }
        }
        return prev.slice(0, -1); // Fallback: son karakteri sil
    });
  }, []);

  const handleClearInput = useCallback(() => {
      setInputText('');
  }, [])


  // --- Yükleme ve Erişim Kontrolleri Render ---
   if (userLoading || xpLoading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        );
    }
    if (!currentUser) return null;
    if (!hasEnoughXP) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <XPWarning requiredXP={requiredXP} currentXP={userXP} title="Görsel Şifreci İçin Gereken XP" />
          </div>
        );
    }

  // --- Ana JSX ---
  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 max-w-5xl">
      <Card className="shadow-xl">
        <CardHeader className="text-center border-b pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">
            Görsel Sembol Şifreci
          </h1>
          <p className="text-gray-500 mt-2">Metinleri renkli sembollere dönüştürün veya sembolleri çözün.</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Mod Değiştirme */}
          <div className="flex justify-center">
            <Button onClick={handleModeToggle} variant="outline" className="gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              {mode === 'encode' ? 'Şifre Çözme Modu' : 'Şifreleme Modu'}
            </Button>
          </div>

          {/* Giriş Alanı */}
          <div className="space-y-2">
            <label className="block text-lg font-semibold text-gray-700">
              {mode === 'encode' ? 'Şifrelenecek Metin:' : 'Şifreli Semboller:'}
            </label>
            {mode === 'encode' ? (
              <textarea
                value={inputText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                className="w-full h-36 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                placeholder="Metni buraya yazın..."
                maxLength={200} // Karakter limiti
              />
            ) : (
              // Decode Modu Giriş
              <div className="space-y-3">
                {/* Sembol Seçim Butonları */}
                <div className="flex flex-wrap gap-1 border rounded p-2 bg-gray-50 max-h-40 overflow-y-auto">
                  {Object.entries(charMapping).map(([char, { color, symbol }]) => (
                    <button
                      key={char}
                      onClick={() => handleSymbolClick(symbol)}
                      className="p-1.5 rounded hover:bg-gray-200 transition-colors text-2xl leading-none"
                      title={`Harf: ${char}`} // Hover'da harfi göster
                      style={{ color: color }}
                      aria-label={`Sembol ekle: ${symbol}`}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
                {/* Seçilen Semboller Alanı */}
                <div className="relative">
                  <textarea
                    readOnly
                    value={inputText}
                    className="w-full h-36 p-3 pr-20 border rounded-lg bg-white text-2xl leading-relaxed" // Yazı tipi büyütüldü
                    placeholder="Sembolleri seçin veya yapıştırın..."
                  />
                  <div className='absolute right-2 top-2 flex flex-col gap-1'>
                    <Button onClick={handleBackspace} variant="outline" className="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2" aria-label="Son sembolü sil">
                       <Trash2 className="w-4 h-4 mr-1"/> Sil
                    </Button>
                     <Button onClick={handleClearInput} variant="outline" className="text-xs py-1 px-2" aria-label="Tümünü temizle">
                       Temizle
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Çıktı Alanı */}
          <div className="space-y-2">
            <label className="block text-lg font-semibold text-gray-700">
              {mode === 'encode' ? 'Şifrelenmiş Sonuç:' : 'Çözülmüş Metin:'}
            </label>
            <Card className="w-full min-h-[9rem] p-3 bg-gray-100 shadow-inner overflow-y-auto">
               {/* Kelime kaydırma için break-words */}
              <div className="break-words leading-relaxed">
                 {mode === 'encode' ?
                    (encodedElements.length > 0 ? encodedElements : <span className="text-gray-400">Sonuç burada görünecek...</span>)
                    :
                    (decodedText ? <span className='text-lg font-mono'>{decodedText}</span> : <span className="text-gray-400">Sonuç burada görünecek...</span>)
                 }
              </div>
            </Card>
          </div>

          {/* Referans Tablosu (Opsiyonel, Açılır/Kapanır olabilir) */}
          <details className="mt-6 group">
              <summary className="cursor-pointer text-center text-gray-500 hover:text-blue-600 group-open:mb-2">
                  Sembol Referans Tablosunu Göster/Gizle
              </summary>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1 text-center border rounded p-2">
                {Object.entries(charMapping).map(([char, { color, symbol }]) => (
                  <div key={char} className="border rounded p-1 hover:bg-gray-50 transition-colors text-xs sm:text-sm" title={`${char} = ${symbol}`}>
                    <span className="font-bold text-gray-700 block">{char}</span>
                    <span className="text-xl sm:text-2xl" style={{ color }}>
                      {symbol}
                    </span>
                  </div>
                ))}
              </div>
          </details>

        </CardContent>
      </Card>
    </div>
  );
};

export default VisualEncoderPage;