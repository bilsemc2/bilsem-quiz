import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';

const VisualEncoderPage = () => {
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('encode'); // 'encode' veya 'decode'

  // Her harf için renk ve sembol eşleştirmesi
  const charMapping = {
    'A': { color: '#FF6B6B', symbol: '🐱' },  // Kedi
    'B': { color: '#4ECDC4', symbol: '🐶' },  // Köpek
    'C': { color: '#45B7D1', symbol: '🐰' },  // Tavşan
    'Ç': { color: '#96CEB4', symbol: '🐼' },  // Panda
    'D': { color: '#FF8B94', symbol: '🦊' },  // Tilki
    'E': { color: '#4DA6FF', symbol: '🐘' },  // Fil
    'F': { color: '#FFA07A', symbol: '🦒' },  // Zürafa
    'G': { color: '#9B59B6', symbol: '🦁' },  // Aslan
    'Ğ': { color: '#2ECC71', symbol: '🐸' },  // Kurbağa
    'H': { color: '#E74C3C', symbol: '🦉' },  // Baykuş
    'I': { color: '#16A085', symbol: '🐧' },  // Penguen
    'İ': { color: '#2980B9', symbol: '🦋' },  // Kelebek
    'J': { color: '#FFB6C1', symbol: '🐬' },  // Yunus
    'K': { color: '#98FB98', symbol: '🐨' },  // Koala
    'L': { color: '#87CEEB', symbol: '🦌' },  // Geyik
    'M': { color: '#DDA0DD', symbol: '🐯' },  // Kaplan
    'N': { color: '#F0E68C', symbol: '🦄' },  // Unicorn
    'O': { color: '#CD853F', symbol: '🐮' },  // İnek
    'Ö': { color: '#556B2F', symbol: '🐷' },  // Domuz
    'P': { color: '#4B0082', symbol: '🐙' },  // Ahtapot
    'R': { color: '#FF4500', symbol: '🦊' },  // Tilki
    'S': { color: '#32CD32', symbol: '🐍' },  // Yılan
    'Ş': { color: '#4682B4', symbol: '🦢' },  // Kuğu
    'T': { color: '#8B4513', symbol: '🐢' },  // Kaplumbağa
    'U': { color: '#483D8B', symbol: '🦅' },  // Kartal
    'Ü': { color: '#2F4F4F', symbol: '🦜' },  // Papağan
    'V': { color: '#FF69B4', symbol: '🦩' },  // Flamingo
    'Y': { color: '#20B2AA', symbol: '🦘' },  // Kanguru
    'Z': { color: '#BA55D3', symbol: '🦒' },  // Zürafa
    '0': { color: '#FFD700', symbol: '①' },  // Altın
    '1': { color: '#C0C0C0', symbol: '②' },  // Gümüş
    '2': { color: '#CD853F', symbol: '③' },  // Peru
    '3': { color: '#DA70D6', symbol: '④' },  // Orkide
    '4': { color: '#DB7093', symbol: '⑤' },  // Paleviolet
    '5': { color: '#4169E1', symbol: '⑥' },  // Royal Mavi
    '6': { color: '#9370DB', symbol: '⑦' },  // Orta Mor
    '7': { color: '#FA8072', symbol: '⑧' },  // Somon
    '8': { color: '#F08080', symbol: '⑨' },  // Açık Mercan
    '9': { color: '#E6E6FA', symbol: '⓪' }   // Lavanta
  };

  // Ters mapping oluştur (sembolden harfe)
  const reverseMapping = {};
  Object.entries(charMapping).forEach(([char, { symbol }]) => {
    reverseMapping[symbol] = char;
  });

  const encodeText = (text) => {
    return text.toUpperCase().split('').map((char, index) => {
      const mapping = charMapping[char];
      if (!mapping) return char; // Eşleşme yoksa karakteri aynen bırak

      return (
        <span
          key={index}
          style={{ color: mapping.color, fontSize: '24px' }}
          className="inline-block mx-1"
        >
          {mapping.symbol}
        </span>
      );
    });
  };

  const decodeText = (text) => {
    // Metindeki her emojiyi ayrı ayrı tanımla
    const emojiRegex = /(\p{Emoji})/gu;
    const symbols = text.match(emojiRegex) || [];
    
    // Her emojiyi karşılık gelen harfe çevir
    return symbols.map(symbol => {
      // charMapping'de sembolü ara ve karşılık gelen harfi bul
      const char = Object.entries(charMapping).find(([_, value]) => value.symbol === symbol)?.[0];
      return char || symbol; // Eğer karşılık bulunamazsa sembolü aynen döndür
    }).join('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Hayvan Şifreleme</h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Nasıl Çalışır?</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Her harf bir hayvan sembolü ile temsil edilir</li>
            <li>Metninizi yazın ve otomatik olarak şifrelensin</li>
            <li>Veya şifreli mesajı çözmek için sembolleri seçin</li>
            <li>Mod değiştirme butonu ile şifreleme ve çözme arasında geçiş yapın</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-6">
            {/* Mod değiştirme butonu */}
            <div className="flex justify-center">
              <button
                onClick={() => setMode(mode === 'encode' ? 'decode' : 'encode')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4" />
                {mode === 'encode' ? 'Şifre Çözmeye Geç' : 'Şifrelemeye Geç'}
              </button>
            </div>

            {/* Giriş alanı */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {mode === 'encode' ? 'Metin Girin' : 'Sembolleri Seçin'}
              </label>
              {mode === 'encode' ? (
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Şifrelenecek metin..."
                />
              ) : (
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(charMapping).map(([char, { color, symbol }]) => (
                      <button
                        key={char}
                        onClick={() => setInputText(prev => prev + symbol)}
                        className="p-2 border rounded hover:bg-gray-100 transition-colors"
                        style={{ color: color }}
                      >
                        <span className="text-xl">{symbol}</span>
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <textarea
                      value={inputText}
                      readOnly
                      className="w-full h-32 p-3 border rounded-lg bg-gray-50"
                      placeholder="Seçilen semboller burada görünecek..."
                    />
                    <button
                      onClick={() => setInputText(prev => prev.slice(0, -1))}
                      className="absolute right-2 top-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Çıktı alanı */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {mode === 'encode' ? 'Şifrelenmiş Görsel' : 'Çözülmüş Metin'}
              </label>
              <div className="w-full min-h-[8rem] p-3 border rounded-lg bg-gray-50">
                {mode === 'encode' ? (
                  encodeText(inputText)
                ) : (
                  decodeText(inputText)
                )}
              </div>
            </div>

            {/* Referans tablosu */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Hayvan Alfabesi</h3>
              <div className="grid grid-cols-6 gap-2 text-center">
                {Object.entries(charMapping).map(([char, { color, symbol }]) => (
                  <div key={char} className="border rounded p-2 hover:bg-gray-50 transition-colors">
                    <span className="font-bold text-gray-700">{char}</span>
                    <span className="text-2xl ml-2" style={{ color }}>
                      {symbol}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualEncoderPage;
