import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRightLeft, 
  Trash2, 
  Loader2, 
  Eye, 
  EyeOff, 
  Copy, 
  Shuffle,
  Sparkles,
  Zap
} from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { useXPCheck } from '../hooks/useXPCheck';
import XPWarning from '../components/XPWarning';
import toast from 'react-hot-toast';

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
    'Z': { color: '#BA55D3', symbol: '🧄' }, // Sarımsak
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
  const [decodedText, setDecodedText] = useState('');
  const [encodedElements, setEncodedElements] = useState<JSX.Element[]>([]);
  const [showReferenceTable, setShowReferenceTable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    setIsProcessing(true);
    setTimeout(() => {
      setMode(prev => (prev === 'encode' ? 'decode' : 'encode'));
      setInputText('');
      setDecodedText('');
      setEncodedElements([]);
      setIsProcessing(false);
      toast.success(`${mode === 'encode' ? 'Şifre Çözme' : 'Şifreleme'} moduna geçildi`);
    }, 300);
  }, [mode]);

  const handleSymbolClick = useCallback((symbol: string) => {
    setInputText(prev => prev + symbol);
  }, []);

  const handleBackspace = useCallback(() => {
    setInputText(prev => {
        const matches = prev.match(SYMBOL_REGEX) || [];
        if (matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            const lastIndex = prev.lastIndexOf(lastMatch);
            if(lastIndex !== -1) {
                 return prev.substring(0, lastIndex);
            }
        }
        return prev.slice(0, -1);
    });
  }, []);

  const handleClearInput = useCallback(() => {
      setInputText('');
      toast.success('Metin temizlendi');
  }, []);

  const handleCopyResult = useCallback(() => {
    const textToCopy = mode === 'encode' 
      ? encodedElements.map(el => el.props.children).join('')
      : decodedText;
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        toast.success('Sonuç panoya kopyalandı!');
      }).catch(() => {
        toast.error('Kopyalama başarısız');
      });
    }
  }, [mode, encodedElements, decodedText]);

  const generateRandomText = useCallback(() => {
    const sampleTexts = [
      'MERHABA DÜNYA',
      'TÜRKÇE ŞIFRELEME',
      'SEMBOL OYUNU',
      'GÖRSEL KOD',
      'RENGARENK HARFLER'
    ];
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    setInputText(randomText);
    toast.success('Örnek metin eklendi!');
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Görsel Sembol Şifreci
            </h1>
            <Zap className="w-8 h-8 text-purple-600" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Metinleri renkli sembollere dönüştürün veya sembolleri çözün
          </p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8"
        >
          {/* Mode Toggle */}
          <div className="flex justify-center mb-8">
            <motion.button
              onClick={handleModeToggle}
              disabled={isProcessing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300
                ${mode === 'encode' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
              `}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRightLeft className="w-5 h-5" />
              )}
              {mode === 'encode' ? 'Şifre Çözme Moduna Geç' : 'Şifreleme Moduna Geç'}
            </motion.button>
          </div>

          {/* Content Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {mode === 'encode' ? '📝 Şifrelenecek Metin' : '🔤 Şifreli Semboller'}
                </h3>
                {mode === 'encode' && (
                  <motion.button
                    onClick={generateRandomText}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    <Shuffle className="w-4 h-4" />
                    Örnek
                  </motion.button>
                )}
              </div>

              {mode === 'encode' ? (
                <div className="relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value.toUpperCase())}
                    className="w-full h-48 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder="Metni buraya yazın..."
                    maxLength={200}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
                    {inputText.length}/200
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Symbol Picker */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                      {Object.entries(charMapping).map(([char, { color, symbol }]) => (
                        <motion.button
                          key={char}
                          onClick={() => handleSymbolClick(symbol)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-all text-2xl"
                          style={{ color: color }}
                          title={`Harf: ${char}`}
                        >
                          {symbol}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="relative">
                    <div className="w-full min-h-[12rem] p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-2xl leading-relaxed overflow-y-auto">
                      {inputText || <span className="text-gray-400">Sembolleri seçin...</span>}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <motion.button
                        onClick={handleBackspace}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        Sil
                      </motion.button>
                      <motion.button
                        onClick={handleClearInput}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all"
                      >
                        Temizle
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Output Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {mode === 'encode' ? '🎨 Şifrelenmiş Sonuç' : '📄 Çözülmüş Metin'}
                </h3>
                <motion.button
                  onClick={handleCopyResult}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
                  disabled={!inputText}
                >
                  <Copy className="w-4 h-4" />
                  Kopyala
                </motion.button>
              </div>

              <div className="min-h-[20rem] p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-600 overflow-y-auto">
                <div className="break-words leading-relaxed">
                  {mode === 'encode' ? (
                    encodedElements.length > 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-2xl"
                      >
                        {encodedElements}
                      </motion.div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                        <div className="text-center">
                          <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Sonuç burada görünecek...</p>
                        </div>
                      </div>
                    )
                  ) : (
                    decodedText ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-lg font-mono text-gray-900 dark:text-white"
                      >
                        {decodedText}
                      </motion.div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                        <div className="text-center">
                          <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Çözüm burada görünecek...</p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Reference Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <motion.button
              onClick={() => setShowReferenceTable(!showReferenceTable)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              {showReferenceTable ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              Sembol Referans Tablosunu {showReferenceTable ? 'Gizle' : 'Göster'}
            </motion.button>

            {showReferenceTable && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600"
              >
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
                  {Object.entries(charMapping).map(([char, { color, symbol }]) => (
                    <motion.div
                      key={char}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.random() * 0.3 }}
                      whileHover={{ scale: 1.1 }}
                      className="flex flex-col items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer"
                      title={`${char} = ${symbol}`}
                      onClick={() => mode === 'decode' && handleSymbolClick(symbol)}
                    >
                      <span className="font-bold text-gray-700 dark:text-gray-300 text-sm">
                        {char}
                      </span>
                      <span 
                        className="text-2xl mt-1" 
                        style={{ color }}
                      >
                        {symbol}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default VisualEncoderPage;