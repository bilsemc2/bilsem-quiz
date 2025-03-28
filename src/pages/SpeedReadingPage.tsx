import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'; // useMemo eklendi
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// XP kontrolü kaldırıldı
import RequireAuth from '../components/RequireAuth';
import { Card, Tabs, Button, Row, Col, Modal, Radio, Space, Alert, InputNumber, Slider, Select } from 'antd'; // Select eklendi
import { BookOutlined, PauseCircleOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons'; // Kullanılmayan ikonlar kaldırıldı
import { supabase } from '../lib/supabase';

// --- Tipler ---
interface StoryQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_option: string;
}

interface Story {
  id: string;
  title: string;
  content: string;
  story_questions?: StoryQuestion[];
}

// İstatistik arayüzü kaldırıldı

interface ReadingResults {
  wpm: number;
  timeTaken: number;
  comprehension: number;
}

// --- Bileşen ---
const SpeedReadingPageContent: React.FC = () => {
    // --- State'ler ---
    const [activeTab, setActiveTab] = useState('reading-practice');
    // Feedback state'i kullanıldığı yerlerde doğrudan toast bildirimleri kullanılacak
    // İstatistik bilgileri kullanıcı arayüzünde gösterilmediği için kaldırıldı

    // Metinsel çalışmalar
    const [readingTextsList, setReadingTextsList] = useState<Story[]>([]);
    const [textsLoading, setTextsLoading] = useState(true);
    const [selectedText, setSelectedText] = useState<Story | null>(null);
    const [readingStartTime, setReadingStartTime] = useState<number | null>(null);
    const [showQuestions, setShowQuestions] = useState(false);
    const [answers, setAnswers] = useState<number[]>([]);
    const [readingResults, setReadingResults] = useState<ReadingResults | null>(null);

    // *** YENİ: Okuma Modu State'leri ***
    const [readingMode, setReadingMode] = useState<'normal' | 'rsvp' | 'pacing'>('normal');
    
    // RSVP State'leri
    const [rsvpSpeedWpm, setRsvpSpeedWpm] = useState<number>(300);
    const [rsvpWords, setRsvpWords] = useState<string[]>([]);
    const [rsvpCurrentIndex, setRsvpCurrentIndex] = useState<number>(0);
    const [rsvpIntervalId, setRsvpIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [isRsvpRunning, setIsRsvpRunning] = useState<boolean>(false);
    const rsvpContainerRef = useRef<HTMLDivElement>(null); // RSVP kelimesini ortalamak için
    
    // Pacing State'leri
    const [pacingSpeedWpm, setPacingSpeedWpm] = useState<number>(250);
    const [pacingChunkSize, setPacingChunkSize] = useState<number>(1); // Vurgulanacak kelime sayısı
    const [pacingCurrentChunkIndex, setPacingCurrentChunkIndex] = useState<number>(0); // Mevcut vurgulanan GRUBUN index'i
    const [pacingIntervalId, setPacingIntervalId] = useState<NodeJS.Timeout | null>(null);
    const [isPacingRunning, setIsPacingRunning] = useState<boolean>(false);
    
    // Pacing için kelime dizisini memoize et (Metin değiştiğinde güncellenir)
    const pacingWords = useMemo(() => {
        if (!selectedText) return [];
        return selectedText.content.trim().split(/\s+/).filter(Boolean);
    }, [selectedText]);

    // Diğer egzersiz/oyun state'leri (Değişiklik varsayılmıyor)
    // ... (memory, eye, word-recognition, mini-games state'leri) ...

    // --- Hooklar ---
    const navigate = useNavigate();
    const { user, loading: userLoading } = useAuth();
    // XP kontrolü kaldırıldı

    // --- Effect'ler ---
    useEffect(() => { if (!userLoading && !user) navigate('/login'); }, [user, userLoading, navigate]);

    // Veri Çekme Effect'i
    useEffect(() => {
        const fetchTexts = async () => {
            if (!user) return;
            setTextsLoading(true);
            try {
                // Hikayeleri ve ilişkili soruları tek sorguda çek
                const { data, error } = await supabase
                    .from('story')
                    .select(`
                        id,
                        title,
                        content,
                        story_questions ( id, question_text, options, correct_option )
                    `)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    setReadingTextsList(data as Story[]);
                    const firstText = data[0] as Story;
                    setSelectedText(firstText);
                    // İlk metin için cevap dizisini başlat
                    setAnswers(new Array(firstText.story_questions?.length || 0).fill(undefined));
                } else {
                    // Veri yoksa veya boşsa, örnek veri kullan
                    const mockData: Story[] = [
                        {
                            id: '1',
                            title: 'Örnek Okuma Metni 1',
                            content: 'Bu bir örnek okuma metnidir. Hızlı okuma pratiği yapmak için kullanılabilir.',
                            story_questions: [
                                {
                                    id: 'q1',
                                    question_text: 'Bu metin ne hakkında?',
                                    options: ['Hızlı okuma', 'Matematik', 'Tarih', 'Bilim'],
                                    correct_option: '0'
                                }
                            ]
                        }
                    ];
                    
                    setReadingTextsList(mockData);
                    setSelectedText(mockData[0]);
                    setAnswers(new Array(mockData[0].story_questions?.length || 0).fill(undefined));
                    console.log('Okunacak aktif metin bulunamadı. Örnek metin gösteriliyor.');
                }
            } catch (err: any) {
                console.error("Error fetching reading texts:", err);
                console.error(`Metinler yüklenemedi: ${err.message || 'Bilinmeyen hata'}`);
                setReadingTextsList([]);
                setSelectedText(null);
            } finally {
                setTextsLoading(false);
            }
        };
        if (user) fetchTexts();
    }, [user]);

    // Mod veya Metin değiştiğinde RSVP'yi sıfırlama Effect'i
    useEffect(() => {
        // Eğer rsvp çalışıyorsa durdur ve state'i temizle
        if (rsvpIntervalId) {
            clearInterval(rsvpIntervalId);
            setRsvpIntervalId(null);
        }
        setIsRsvpRunning(false);
        setRsvpCurrentIndex(0);
        setRsvpWords([]); // Kelimeleri temizle
        setReadingStartTime(null); // Normal okuma zamanlayıcısını da sıfırla
        setShowQuestions(false); // Soruları gizle
        setReadingResults(null); // Sonuçları temizle

    }, [readingMode, selectedText]); // Mod veya metin değiştiğinde tetikle

    // RSVP Interval Cleanup Effect'i
     useEffect(() => {
        // Component unmount olduğunda interval'ı temizle
        return () => {
            if (rsvpIntervalId) {
                clearInterval(rsvpIntervalId);
            }
        };
    }, [rsvpIntervalId]); // Sadece interval ID değiştiğinde cleanup'ı yeniden ayarla


    // --- Fonksiyonlar ---

    // Metinsel Çalışma Handlerları
    // Normal okuma başlatma
    const startReading = () => {
        setReadingStartTime(Date.now());
        setReadingResults(null);
        setShowQuestions(false); // Soruları gizle
        // Cevapları sıfırla
        setAnswers(new Array(selectedText?.story_questions?.length || 0).fill(undefined));
    };
    
    // finishReadingAndShowQuestions -> finishCurrentReadingSession olarak yeniden adlandıralım
    const finishCurrentReadingSession = (wpm: number, timeTaken: number) => {
        // Soruları göster ve WPM/süre ile readingResults'ı ayarla
        setReadingResults({ wpm, timeTaken, comprehension: 0 }); // comprehension sonra hesaplanacak
        setShowQuestions(true);
        setReadingStartTime(null); // Normal zamanlayıcıyı durdur
        
        // RSVP state'lerini sıfırla
        if (rsvpIntervalId) clearInterval(rsvpIntervalId);
        setIsRsvpRunning(false);
        setRsvpIntervalId(null);
        
        // Pacing state'lerini sıfırla
        if (pacingIntervalId) clearInterval(pacingIntervalId);
        setIsPacingRunning(false);
        setPacingIntervalId(null);
    };
    const submitAnswers = () => {
        if (!selectedText || !selectedText.story_questions || !readingResults) return;

        const questions = selectedText.story_questions;
        const correctAnswersCount = answers.filter(
            (answerIndex, questionIndex) => {
                // Kullanıcının seçtiği index (answerIndex) ile sorunun doğru index'ini (string'den parse edilmiş) karşılaştır
                const correctOptionIndex = parseInt(questions[questionIndex].correct_option, 10);
                // Eğer parse edilemezse veya cevap verilmemişse yanlış say
                return !isNaN(correctOptionIndex) && answerIndex === correctOptionIndex;
            }
        ).length;

        const comprehension = questions.length > 0 ? Math.round((correctAnswersCount / questions.length) * 100) : 100; // Soru yoksa %100 varsayalım

        const finalResults = {
            ...readingResults,
            comprehension
        };
        setReadingResults(finalResults); // Sonuçları (anlama oranı dahil) güncelle

        // İstatistik güncellemesi kaldırıldı

        // Sonuçları Modal'da göster
        showResultsModal(finalResults);
    };
    const goToNextText = () => {
        if (!readingTextsList || readingTextsList.length === 0) return;
        const currentIndex = readingTextsList.findIndex(t => t.id === selectedText?.id);
        const nextIndex = (currentIndex === -1 || currentIndex === readingTextsList.length - 1) ? 0 : currentIndex + 1;
        const nextText = readingTextsList[nextIndex];
        setSelectedText(nextText);
        setReadingResults(null);
        setShowQuestions(false);
        // Yeni metnin soru sayısına göre cevap dizisini sıfırla
        setAnswers(new Array(nextText.story_questions?.length || 0).fill(undefined));
    };
    const showResultsModal = (results: ReadingResults) => {
        Modal.success({
            title: 'Çalışma Tamamlandı!',
            content: (
                <div>
                    <p>Okuma Hızı: {results.wpm} kelime/dakika</p>
                    <p>Anlama Oranı: {results.comprehension}%</p>
                    <p>Süre: {results.timeTaken.toFixed(1)} saniye</p>
                </div>
            ),
            onOk: goToNextText // Modal kapanınca sonraki metne geç
        });
    };


    // *** YENİ: RSVP Fonksiyonları ***
    const startRsvp = useCallback(() => {
        if (!selectedText || isRsvpRunning) return;

        const words = selectedText.content.trim().split(/\s+/).filter(Boolean); // Boş stringleri filtrele
        if (words.length === 0) return;

        setRsvpWords(words);
        setRsvpCurrentIndex(0);
        setIsRsvpRunning(true);
        setShowQuestions(false); // Başlarken soruları gizle
        setReadingResults(null); // Başlarken sonuçları temizle

        const intervalMs = Math.max(50, 60000 / rsvpSpeedWpm); // Minimum 50ms bekleme

        const interval = setInterval(() => {
            setRsvpCurrentIndex(prevIndex => {
                const nextIndex = prevIndex + 1;
                if (nextIndex >= words.length) {
                    // RSVP Bitti
                    clearInterval(interval);
                    setIsRsvpRunning(false);
                    // RSVP bittiğinde otomatik olarak soruları göster/sonucu işle
                    // Geçen süre yaklaşık: words.length * intervalMs / 1000
                    const approxTimeTaken = (words.length * intervalMs) / 1000;
                    finishCurrentReadingSession(rsvpSpeedWpm, approxTimeTaken);
                    return prevIndex; // Index'i daha fazla artırma
                }
                return nextIndex;
            });
        }, intervalMs);

        setRsvpIntervalId(interval);

    }, [selectedText, isRsvpRunning, rsvpSpeedWpm]); // Bağımlılıklar

    const pauseRsvp = useCallback(() => {
        if (rsvpIntervalId) {
            clearInterval(rsvpIntervalId);
            setRsvpIntervalId(null);
            setIsRsvpRunning(false); // Duraklatıldı olarak işaretle
        }
    }, [rsvpIntervalId]);

    const stopRsvp = useCallback(() => {
        if (rsvpIntervalId) {
            clearInterval(rsvpIntervalId);
            setRsvpIntervalId(null);
        }
        setIsRsvpRunning(false);
        setRsvpCurrentIndex(0); // Başa dön
        // İsteğe bağlı: Durdurulduğunda da sorulara geçilebilir
        // const approxTimeTaken = (rsvpCurrentIndex * (60000 / rsvpSpeedWpm)) / 1000;
        // finishCurrentReadingSession(rsvpSpeedWpm, approxTimeTaken);
    }, [rsvpIntervalId, rsvpSpeedWpm, rsvpCurrentIndex]);
    
    // Pacing Fonksiyonları
    const startPacing = useCallback(() => {
        // Eğer metin yoksa, pacing zaten çalışıyorsa veya kelime yoksa başlatma
        if (!selectedText || isPacingRunning || pacingWords.length === 0) return;

        setPacingCurrentChunkIndex(0); // Baştan başla
        setIsPacingRunning(true);    // Çalışıyor olarak işaretle
        setShowQuestions(false);     // Soruları gizle
        setReadingResults(null);     // Önceki sonuçları temizle

        // Interval süresini hesapla (ms cinsinden) = (60000 / WPM) * Grup Boyutu
        const intervalMs = Math.max(50, (60000 / pacingSpeedWpm) * pacingChunkSize);
        // Toplam kaç tane kelime grubu olduğunu hesapla
        const totalChunks = Math.ceil(pacingWords.length / pacingChunkSize);

        // Kelime/Chunk yoksa interval'ı başlatma
        if (totalChunks <= 0) { setIsPacingRunning(false); return; }

        // Interval'ı başlat
        const interval = setInterval(() => {
            setPacingCurrentChunkIndex(prevIndex => {
                const nextIndex = prevIndex + 1; // Bir sonraki gruba geç
                // Eğer son gruba ulaşıldıysa
                if (nextIndex >= totalChunks) {
                    clearInterval(interval); // Interval'ı durdur
                    setIsPacingRunning(false); // Çalışmıyor olarak işaretle
                    // Geçen süreyi hesapla ve sonuç/soru ekranına geç
                    const approxTimeTaken = (totalChunks * intervalMs) / 1000;
                    finishCurrentReadingSession(pacingSpeedWpm, approxTimeTaken);
                    return prevIndex; // Index'i daha fazla artırma
                }
                return nextIndex; // Sonraki index'e geç
            });
        }, intervalMs);

        setPacingIntervalId(interval); // Interval ID'sini state'e kaydet

    }, [selectedText, isPacingRunning, pacingSpeedWpm, pacingChunkSize, pacingWords, finishCurrentReadingSession]); // Bağımlılıklar

    const pausePacing = useCallback(() => {
        // Eğer interval çalışıyorsa durdur
        if (pacingIntervalId) {
            clearInterval(pacingIntervalId);
            setPacingIntervalId(null);
            setIsPacingRunning(false); // Duraklatıldı olarak işaretle
        }
    }, [pacingIntervalId]);

    const stopPacing = useCallback(() => {
        // Eğer interval çalışıyorsa durdur
        if (pacingIntervalId) {
            clearInterval(pacingIntervalId);
            setPacingIntervalId(null);
        }
        setIsPacingRunning(false);      // Çalışmıyor olarak işaretle
        setPacingCurrentChunkIndex(0); // İndeksi başa sar
    }, [pacingIntervalId]);

    // Diğer egzersiz/oyun fonksiyonları (Değişiklik varsayılmıyor)
    // ...


    // --- Render Koşulları ---
    if (userLoading || textsLoading) { 
        return <div className="loading-screen">Yükleniyor...</div>;
    }
    if (!user) { return null; }
    // selectedText kontrolü, text listesi boşsa veya yüklenememişse
    if (readingTextsList.length === 0 || (!selectedText && activeTab === 'reading-practice')) {
         return ( <div className="loading-screen"><Alert message="Uyarı" description="Gösterilecek okuma metni bulunamadı." type="warning" showIcon /></div> );
    }


    // --- Ana JSX ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8"> {/* Arka plan güncellendi */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* İstatistikler, Hedef, Rozetler (Değişiklik yok) */}
                {/* ... */}

                {/* Ana İçerik */}
                <Card bordered={false} className="shadow-lg">
                    <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                        // ... Diğer Tab'ler ...
                        {
                            key: 'reading-practice',
                            label: ( <span><BookOutlined /> Metinsel Çalışmalar</span> ),
                            children: (
                                <div className="p-4">
                                    {selectedText && (
                                        <>
                                            {/* Mod Seçimi ve Başlık */}
                                            <div className="mb-6 pb-4 border-b">
                                                 <Row justify="space-between" align="middle">
                                                     <Col>
                                                        <h3 className="text-xl font-bold">{selectedText.title}</h3>
                                                        <Radio.Group
                                                            value={readingMode}
                                                            onChange={(e) => setReadingMode(e.target.value)}
                                                            optionType="button"
                                                            buttonStyle="solid"
                                                            disabled={isRsvpRunning || readingStartTime !== null} // Egzersiz sırasında değiştirilemez
                                                        >
                                                            <Radio.Button value="normal">Normal Okuma</Radio.Button>
                                                            <Radio.Button value="rsvp">Hızlı Gösterim (RSVP)</Radio.Button>
                                                            <Radio.Button value="pacing">Vurgulu Okuma</Radio.Button>
                                                        </Radio.Group>
                                                     </Col>
                                                     <Col>
                                                         <Button onClick={goToNextText} disabled={isRsvpRunning || readingStartTime !== null || readingTextsList.length <= 1}>Başka Metin</Button>
                                                     </Col>
                                                 </Row>
                                            </div>

                                            {/* SORU CEVAPLAMA EKRANI */}
                                            {showQuestions ? (
                                                <div>
                                                    {/* ... (Soru gösterme ve cevaplama JSX - önceki gibi) ... */}
                                                     <h3 className="text-xl font-bold mb-4">Anlama Soruları - "{selectedText.title}"</h3>
                                                     {(!selectedText.story_questions || selectedText.story_questions.length === 0) ? (
                                                         <Alert message="Bu metin için anlama sorusu bulunamadı." type="info" showIcon className="mb-4"/>
                                                     ) : (
                                                         selectedText.story_questions.map((q, idx) => (
                                                            <div key={q.id || idx} className="mb-6 p-4 border rounded-md bg-white">
                                                                <p className="font-medium mb-3 text-gray-800">{idx + 1}. {q.question_text}</p>
                                                                <Radio.Group onChange={(e) => { const newAnswers = [...answers]; newAnswers[idx] = e.target.value; setAnswers(newAnswers);}} value={answers[idx]}>
                                                                    <Space direction="vertical">
                                                                        {q.options.map((option, optIdx) => (<Radio key={optIdx} value={optIdx}>{option}</Radio>))}
                                                                    </Space>
                                                                </Radio.Group>
                                                            </div>
                                                         ))
                                                     )}
                                                      {/* Soru varsa veya yoksa bile gönderme butonu (soru yoksa sadece WPM kaydeder) */}
                                                      <Button
                                                            type="primary"
                                                            size="large"
                                                            block
                                                            onClick={submitAnswers}
                                                            // Soru varsa ve hepsi cevaplanmadıysa butonu disable et
                                                            disabled={
                                                                !!selectedText.story_questions && selectedText.story_questions.length > 0 &&
                                                                (answers.some(ans => ans === undefined || ans === null) || answers.length !== selectedText.story_questions.length)
                                                            }
                                                        >
                                                            Cevapları Gönder & Sonucu Gör
                                                     </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* NORMAL OKUMA MODU */}
                                                    {readingMode === 'normal' && (
                                                        <div>
                                                            {!readingStartTime ? (
                                                                <Button type="primary" onClick={startReading} size="large" block icon={<PlayCircleOutlined />}>Okumaya Başla</Button>
                                                            ) : (
                                                                <div>
                                                                    <div className="bg-gray-50 p-6 rounded-lg text-lg leading-relaxed mb-4 max-h-96 overflow-y-auto border">
                                                                        {selectedText.content.split('\n').map((p, i) => <p key={i} className={p.trim() ? 'mb-4' : ''}>{p}</p>)}
                                                                    </div>
                                                                    <Button 
                                                                        type="primary" 
                                                                        onClick={() => {
                                                                            const timeTaken = readingStartTime ? (Date.now() - readingStartTime)/1000 : 0;
                                                                            // Kelime sayısını hesapla
                                                                            const wordCount = selectedText.content.trim().split(/\s+/).length;
                                                                            // WPM hesapla (dakika başına kelime)
                                                                            const wpm = timeTaken > 0 ? Math.round((wordCount / timeTaken) * 60) : 0;
                                                                            finishCurrentReadingSession(wpm, timeTaken);
                                                                        }} 
                                                                        size="large" 
                                                                        block 
                                                                        danger 
                                                                        icon={<StopOutlined/>}
                                                                    >
                                                                        Okumayı Bitirdim & Soruları Göster
                                                                    </Button>
                                                                    {/* WPM hesaplaması submitAnswers içinde yapılacak */}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* RSVP MODU */}
                                                    {readingMode === 'rsvp' && (
                                                        <div className="flex flex-col items-center">
                                                            {/* RSVP Hız Ayarı */}
                                                            <div className="w-full max-w-md mb-6 p-4 border rounded-lg bg-gray-50">
                                                                <label className="block text-center font-medium mb-2">RSVP Hızı (WPM)</label>
                                                                <Row gutter={16} align="middle">
                                                                    <Col span={18}>
                                                                        <Slider
                                                                            min={100}
                                                                            max={1000}
                                                                            step={50}
                                                                            onChange={setRsvpSpeedWpm}
                                                                            value={rsvpSpeedWpm}
                                                                            disabled={isRsvpRunning}
                                                                        />
                                                                    </Col>
                                                                    <Col span={6}>
                                                                        <InputNumber
                                                                            min={100}
                                                                            max={1000}
                                                                            step={50}
                                                                            value={rsvpSpeedWpm}
                                                                            onChange={(value) => setRsvpSpeedWpm(value ?? 300)}
                                                                            disabled={isRsvpRunning}
                                                                            style={{ width: '100%' }}
                                                                        />
                                                                    </Col>
                                                                </Row>
                                                            </div>

                                                            {/* RSVP Gösterim Alanı */}
                                                            <div ref={rsvpContainerRef} className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg border mb-6 text-4xl sm:text-5xl md:text-6xl font-semibold text-gray-800 p-4 overflow-hidden">
                                                                {isRsvpRunning ? (
                                                                    rsvpWords[rsvpCurrentIndex] || '...' // Kelime veya yükleniyor
                                                                ) : rsvpWords.length > 0 ? (
                                                                    'Duraklatıldı' // Veya Başlamaya Hazır
                                                                ) : (
                                                                    'Başlatmak için butona basın'
                                                                )}
                                                            </div>

                                                            {/* RSVP Kontrol Butonları */}
                                                            <Space size="large">
                                                                {!isRsvpRunning ? (
                                                                    <Button type="primary" size="large" onClick={startRsvp} icon={<PlayCircleOutlined />} disabled={rsvpWords.length > 0 && rsvpCurrentIndex > 0}>
                                                                        {rsvpWords.length > 0 && rsvpCurrentIndex > 0 ? 'Devam Et' : 'Başlat'}
                                                                    </Button>
                                                                ) : (
                                                                    <Button type="default" size="large" onClick={pauseRsvp} icon={<PauseCircleOutlined />}>
                                                                        Duraklat
                                                                    </Button>
                                                                )}
                                                                <Button type="default" size="large" onClick={stopRsvp} icon={<StopOutlined />} danger disabled={!isRsvpRunning && rsvpCurrentIndex === 0}>
                                                                    Sıfırla / Durdur
                                                                </Button>
                                                            </Space>
                                                        </div>
                                                    )}

                                                     {/* PACING MODU */}
                                                    {readingMode === 'pacing' && (
                                                        <div className="flex flex-col items-center">
                                                            {/* Pacing Ayarları */}
                                                            <div className="w-full max-w-xl mb-6 p-4 border rounded-lg bg-gray-50 flex flex-col sm:flex-row gap-4 items-center">
                                                                {/* Hız Ayarı */}
                                                                <div className='flex-1 w-full'>
                                                                    <label className="block text-center font-medium mb-1 text-gray-700">Vurgu Hızı (WPM)</label>
                                                                    <Row gutter={16} align="middle">
                                                                        <Col span={18}> <Slider min={100} max={800} step={25} onChange={setPacingSpeedWpm} value={pacingSpeedWpm} disabled={isPacingRunning}/> </Col>
                                                                        <Col span={6}> <InputNumber min={100} max={800} step={25} value={pacingSpeedWpm} onChange={(v) => setPacingSpeedWpm(v ?? 250)} disabled={isPacingRunning} style={{ width: '100%' }}/> </Col>
                                                                    </Row>
                                                                </div>
                                                                {/* Grup Boyutu Ayarı */}
                                                                <div className='w-full sm:w-auto'>
                                                                    <label className="block text-center font-medium mb-1 text-gray-700">Grup Boyutu</label>
                                                                    <Select
                                                                        value={pacingChunkSize}
                                                                        onChange={setPacingChunkSize}
                                                                        disabled={isPacingRunning}
                                                                        style={{ width: '100%', minWidth: '120px' }}
                                                                        options={[
                                                                            { value: 1, label: '1 Kelime' },
                                                                            { value: 2, label: '2 Kelime' },
                                                                            { value: 3, label: '3 Kelime' },
                                                                            { value: 4, label: '4 Kelime' },
                                                                        ]}
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Pacing Metin Alanı */}
                                                            <div className="w-full bg-white p-6 rounded-lg text-xl sm:text-2xl leading-relaxed mb-4 max-h-[450px] overflow-y-auto border text-gray-800 shadow-inner">
                                                                {pacingWords.map((word, index) => {
                                                                    // Mevcut chunk'a ait kelimeleri belirle
                                                                    const isHighlighted = isPacingRunning &&
                                                                                          index >= pacingCurrentChunkIndex * pacingChunkSize &&
                                                                                          index < (pacingCurrentChunkIndex + 1) * pacingChunkSize;
                                                                    return (
                                                                        <React.Fragment key={index}>
                                                                            <span 
                                                                                className={`pacing-word ${isHighlighted ? 'highlighted' : ''}`}
                                                                                style={isHighlighted ? { backgroundColor: '#06b6d4', color: 'white' } : {}}
                                                                            >
                                                                                {word}
                                                                            </span>
                                                                            {' '} {/* Kelimeler arası boşluk */}
                                                                        </React.Fragment>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Pacing Kontrol Butonları */}
                                                             <Space size="large">
                                                                {!isPacingRunning ? (
                                                                    <Button type="primary" size="large" onClick={startPacing} icon={<PlayCircleOutlined />}>
                                                                        {pacingCurrentChunkIndex > 0 ? 'Devam Et' : 'Başlat'}
                                                                    </Button>
                                                                ) : (
                                                                    <Button type="default" size="large" onClick={pausePacing} icon={<PauseCircleOutlined />}>
                                                                        Duraklat
                                                                    </Button>
                                                                )}
                                                                <Button type="default" size="large" onClick={stopPacing} icon={<StopOutlined />} danger disabled={!isPacingRunning && pacingCurrentChunkIndex === 0}>
                                                                    Sıfırla / Durdur
                                                                </Button>
                                                            </Space>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* Son Okuma Sonuçları (Modal yerine burada gösterilebilir) */}
                                            {readingResults && !showQuestions && (
                                                <Alert
                                                    className='mt-6'
                                                    message="Son Okuma Sonuçları"
                                                    description={
                                                        <div>
                                                            <p>Okuma Hızı: {readingResults.wpm} WPM</p>
                                                            <p>Anlama Oranı: {readingResults.comprehension}%</p>
                                                            <p>Süre: {readingResults.timeTaken.toFixed(1)} sn</p>
                                                        </div>
                                                    }
                                                    type="success"
                                                    showIcon
                                                    closable // Kapatılabilir
                                                    onClose={() => setReadingResults(null)} // Kapatınca sonucu temizle
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            ),
                        }, // Metinsel Çalışmalar Sonu
                    ]}/>
                </Card>
            </div>
            {/* Global stiller index.css'de tanımlanmıştır */}
        </div>
    );
};

// Wrapper
const SpeedReadingPage: React.FC = () => <RequireAuth><SpeedReadingPageContent /></RequireAuth>;
            <style>{`
                /* RSVP Stilleri */
                .rsvp-container {
                    min-height: 150px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .rsvp-word {
                    font-size: 2rem;
                    font-weight: 500;
                }
                /* Pacing stilleri */
                .pacing-word {
                    transition: all 0.15s ease-in-out;
                    padding: 2px 4px;
                    margin: 0;
                    border-radius: 3px;
                    display: inline-block;
                    line-height: 1.8;
                }
                .pacing-word.highlighted {
                    background-color: #06b6d4 !important; /* Daha koyu turkuaz renk */
                    color: white !important;
                    font-weight: 500;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                /* Okuma alanının okunabilirliğini artır */
                .leading-relaxed { line-height: 1.8; }
                .loading-screen {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 300px;
                }
            `}</style>

export default SpeedReadingPage;