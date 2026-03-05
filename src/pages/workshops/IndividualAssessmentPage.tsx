import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Star, ChevronLeft, Rocket, Trophy, Lightbulb, Radio, Search, Cpu, Hash,
    LayoutGrid, TrendingUp, ArrowLeftRight, Languages, Grid3X3, Eye, Compass, Smile,
    PenTool, Link2, BookOpen, BookText, MessageSquareText, Binary, ScanEye, Headphones,
    Activity, CircleUser, Calculator, Sparkles, Info, Scale, Shapes, MapPin, Puzzle,
    FlaskConical, Type, BrainCircuit, Bug, ScanSearch, Code2, Crosshair, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './bireysel.css';
import { useAuth } from '../../contexts/AuthContext';
import AccessDeniedScreen from '../../components/AccessDeniedScreen';

// yetenek_alani erişim kontrolü
const hasIndividualAccess = (yetenekAlani: string[] | string | null | undefined): boolean => {
    if (!yetenekAlani) return false;
    const skills = Array.isArray(yetenekAlani) ? yetenekAlani : [yetenekAlani];
    return skills.some(s => s === 'genel yetenek' || s === 'genel yetenek - bireysel');
};

const MODULES = [
    { id: 'stream-sum', title: "Akışkan Toplam", desc: "Sürekli akan sayıları takip et ve her yeni sayıyı bir öncekiyle topla. Odak ve hızını test et!", icon: <TrendingUp />, color: "sky", difficulty: "Uzman", link: "/games/akiskan-toplam", tuzo: "5.9.2 Çalışma Belleği (Güncelleme)" },
    { id: 'algisal-hiz', title: "Algısal Hız Testi", desc: "İki sayı dizisini karşılaştır — aynı mı farklı mı? Transpozisyon ve görsel benzerlik tuzaklarıyla işleme hızını test et!", icon: <Eye />, color: "cyan", difficulty: "Orta", link: "/games/algisal-hiz", tuzo: "5.6.1 İşleme Hızı" },
    { id: 'target-grid', title: "Bak ve Bul", desc: "Izgaradaki sayıları hafızana al ve hedef toplama ulaşmak için doğru kartları eşleştir. Hız ve hafıza bir arada!", icon: <LayoutGrid />, color: "purple", difficulty: "Uzman", link: "/games/hedef-sayi", tuzo: "5.2.2 Matematiksel Problem Çözme" },
    { id: 'knowledge-card', title: "Bilgi Kartları", desc: "Genel kültür cümlelerindeki eksik kelimeyi bul! Sözel zeka ve bilgi testi.", icon: <BookOpen />, color: "emerald", difficulty: "Orta", link: "/games/bilgi-kartlari", tuzo: "5.1.4 Bilgi (Genel Kültür)" },
    { id: 'sentence-synonym', title: "Cümle İçi Eş Anlam", desc: "Cümledeki kelimenin eş anlamlısını bul! Kelime hazineni ve cümle anlayışını geliştir.", icon: <MessageSquareText />, color: "violet", difficulty: "Orta", link: "/games/cumle-ici-es-anlam", tuzo: "5.1.3 Sözlü Anlama" },
    { id: 'cross-match', title: "Çapraz Eşleşme", desc: "Sembol ve renk kombinasyonlarını hatırla. Dinamik karıştırma efektlerine karşı verileri takip et!", icon: <Cpu />, color: "rose", difficulty: "Uzman", link: "/games/capraz-eslesme", tuzo: "5.9.1 Çalışma Belleği (İzleme)" },
    { id: 'dual-bind', title: "Çift Mod Hafıza", desc: "Renk→Şekil ve Şekil→Renk çift yönlü hatırla! İleri düzey çalışma belleği testi.", icon: <Link2 />, color: "rose", difficulty: "Zor", link: "/games/cift-mod-hafiza", tuzo: "5.9.1 Çalışma Belleği (Bağlama)" },
    { id: 'desen-boyama', title: "Desen Boyama", desc: "Örüntüdeki boşluğu doğru renklerle doldur! Desen analizi ve görsel tamamlama.", icon: <PenTool />, color: "rose", difficulty: "Orta", link: "/games/desen-boyama", tuzo: "5.3.2 Desen Analizi" },
    { id: 'idioms', title: "Deyimler Oyunu", desc: "Türkçe deyimlerdeki eksik kelimeyi bul! Sözlü anlama ve kültürel birikimini test et.", icon: <Languages />, color: "pink", difficulty: "Orta", link: "/games/deyimler-oyunu", tuzo: "5.1.3 Sözlü Anlama" },
    { id: 'dikkat-ve-kodlama', title: "Dikkat ve Kodlama", desc: "Sayı-şekil eşleşmelerini ezberle, test maddelerini en hızlı şekilde doldur! İşleme hızı ve kodlama.", icon: <Code2 />, color: "violet", difficulty: "Orta", link: "/games/dikkat-ve-kodlama", tuzo: "5.6.1 İşleme Hızı" },
    { id: 'emoji-stroop', title: "Emoji Stroop", desc: "Emojiyi tanı, yazıya aldanma! Çocuklar için eğlenceli dikkat ve algı testi.", icon: <Smile />, color: "pink", difficulty: "Kolay", link: "/games/emoji-stroop", tuzo: "5.8.2 Tepki Kontrolü (İnhibisyon)" },
    { id: 'synonym', title: "Eş Anlam Bulmaca", desc: "Kelimelerin eş anlamlılarını bul! Kelime hazineni test et ve geliştir.", icon: <BookText />, color: "teal", difficulty: "Orta", link: "/games/es-anlam", tuzo: "5.1.1 Kelime Bilgisi" },
    { id: 'farki-bul', title: "Farkı Bul", desc: "Renk, şekil, boyut ve açı farkını yakala! Seçici dikkat ve görsel algı becerini test et.", icon: <Eye />, color: "fuchsia", difficulty: "Orta", link: "/games/farki-bul", tuzo: "5.7.1 Seçici Dikkat" },
    { id: 'shadow-detective', title: "Gölge Dedektifi", desc: "Karmaşık desenleri 3 saniyede hatırla. Birbirine çok benzeyen kanıtlar arasından gerçeği bul!", icon: <Search />, color: "amber", difficulty: "Uzman", link: "/games/golge-dedektifi", tuzo: "5.3.1 Şekil Eşleştirme" },
    { id: 'gorsel-cebir-dengesi', title: "Görsel Cebir Dengesi", desc: "Terazideki şekillerin ağırlık ilişkisini çöz ve dengeyi sağla! Görsel akıl yürütme ve kural çıkarsama.", icon: <Scale />, color: "indigo", difficulty: "Zor", link: "/games/gorsel-cebir-dengesi", tuzo: "5.5.2 Kural Çıkarsama" },
    { id: 'gorsel-hafiza', title: "Görsel Hafıza", desc: "Ekranda beliren sembolleri hafızana kazı, sonra değişen sembolü bul! Bilişsel kodlama ve kısa süreli bellek.", icon: <ScanEye />, color: "sky", difficulty: "Orta", link: "/games/gorsel-hafiza", tuzo: "5.4.2 Görsel Kısa Süreli Bellek" },
    { id: 'mantik-bulmacasi', title: "Görsel Mantık Bulmacası", desc: "Şekil gruplarındaki gizli kuralı çöz! Renk, şekil, dolgu ve sayı kurallarını analiz et.", icon: <FlaskConical />, color: "blue", difficulty: "Zor", link: "/games/mantik-bulmacasi", tuzo: "5.5.1 Kural Çıkarsama" },
    { id: 'visual-scanning', title: "Görsel Tarama", desc: "Hedef sembolü bul! Dikkat ve görsel tarama hızını test et.", icon: <ScanEye />, color: "rose", difficulty: "Orta", link: "/games/gorsel-tarama", tuzo: "5.7.1 Seçici Dikkat" },
    { id: 'invisible-tower', title: "Görünmez Kule", desc: "Piramit katmanlarında yükselen sayıları hafızana al. Çarpanlar ve negatif sayılarla dinamik toplamı hesapla!", icon: <TrendingUp />, color: "amber", difficulty: "Uzman", link: "/games/gorunmez-kule", tuzo: "5.9.2 Çalışma Belleği (Güncelleme)" },
    { id: 'gurultu-filtresi', title: "Gürültü Filtresi", desc: "Dikkat dağıtıcı arka plan sesleri arasında hedef sesi tanı! Seçici dikkat ve odaklanma.", icon: <Headphones />, color: "purple", difficulty: "Uzman", link: "/games/gurultu-filtresi", tuzo: "5.7.1 Seçici Dikkat" },
    { id: 'story-quiz', title: "Hikaye Quiz", desc: "Rastgele bir hikaye oku, sorulara cevap ver ve puan kazan! Sözel zeka ve okuduğunu anlama testi.", icon: <BookText />, color: "purple", difficulty: "Orta", link: "/stories/quiz-game", tuzo: "5.1.3 Sözlü Anlama" },
    { id: 'auditory-memory', title: "İşitsel Hafıza", desc: "Ses dizisini dinle ve tekrarla! İşitsel hafızanı test et.", icon: <Headphones />, color: "indigo", difficulty: "Zor", link: "/games/isitsel-hafiza", tuzo: "5.4.1 Sayısal Kısa Süreli Bellek" },
    { id: 'kelime-avi', title: "Kelime Avı", desc: "Hedef harfi içeren kelimeleri hızla bul! Ortografik algı ve işlem hızını test et.", icon: <Search />, color: "violet", difficulty: "Orta", link: "/games/kelime-avi", tuzo: "5.6.1 Algısal İşlem Hızı" },
    { id: 'konum-bulmaca', title: "Konum Bulmaca", desc: "Şekillerin kesişim bölgelerinde noktanın konumunu bul! Uzamsal ilişki ve mantıksal analiz.", icon: <MapPin />, color: "teal", difficulty: "Orta", link: "/games/konum-bulmaca", tuzo: "5.5.3 Uzamsal İlişki" },
    { id: 'kosullu-yonerge', title: "Koşullu Yönerge Takibi", desc: "Mantık yönergesini oku, koşulu değerlendir ve doğru nesneyi seç! Koşullu çıkarım becerisi.", icon: <BrainCircuit />, color: "indigo", difficulty: "Zor", link: "/games/kosullu-yonerge", tuzo: "5.5.2 Koşullu Çıkarım" },
    { id: 'cosmic-memory', title: "Kozmik Hafıza", desc: "Görsel-uzamsal hafıza ve çalışma belleği simülatörü.", icon: <Star />, color: "indigo", difficulty: "Zor", link: "/games/kozmik-hafiza", tuzo: "5.4.2 Görsel Kısa Süreli Bellek" },
    { id: 'labirent', title: "Labirent Koşusu", desc: "Parmağınla yolu çiz, duvarlara değme! Uzamsal ilişki çözümleme ve görsel-motor koordinasyon.", icon: <Compass />, color: "violet", difficulty: "Zor", link: "/games/labirent", isNew: true, tuzo: "5.3.3 Uzamsal İlişki Çözümleme" },
    { id: 'lazer-hafiza', title: "Lazer Hafıza", desc: "Noktalar arasındaki lazer yolunu izle ve hafızandan aynı yolu yeniden çiz!", icon: <Crosshair />, color: "emerald", difficulty: "Zor", link: "/games/lazer-hafiza", tuzo: "5.4.2 Görsel Kısa Süreli Bellek" },
    { id: 'lazer-labirent', title: "Lazer Labirent", desc: "Görünmez lazerin aynalardan yansıyarak hangi çıkışa ulaştığını tahmin et! Uzamsal ilişki ve görsel takip becerisi.", icon: <Crosshair />, color: "indigo", difficulty: "Zor", link: "/games/lazer-labirent", tuzo: "5.3.3 Uzamsal İlişki Çözümleme" },
    { id: 'matematik-grid', title: "Matematik Grid", desc: "3×3 sayı tablosundaki gizli sayıları bul! Satırlar arası matematiksel ilişkiyi keşfet.", icon: <Grid3X3 />, color: "teal", difficulty: "Orta", link: "/games/matematik-grid", tuzo: "5.2.1 Sayısal Akıl Yürütme" },
    { id: 'matris-bulmaca', title: "Matris Bulmaca", desc: "3×3 ızgarada deseni analiz et! Döndürme, aynalama ve renk değişimi kurallarıyla gizli hücreyi bul.", icon: <Grid3X3 />, color: "violet", difficulty: "Orta", link: "/games/matris-bulmaca", tuzo: "5.5.2 Kural Çıkarsama" },
    { id: 'matrix-echo', title: "Matris Yankısı", desc: "3x3 matristeki sayıları takip et. Shuffling sonrası karmaşık mantıksal soruları yanıtla!", icon: <LayoutGrid />, color: "blue", difficulty: "Uzman", link: "/games/matris-yankisi", tuzo: "5.3.2 Desen Analizi" },
    { id: 'mindmatch-oruntu', title: "MindMatch Örüntü", desc: "Kategoriye ait tüm öğeleri bul! Kalıbı çöz, eşleşmeyenleri ayır. Sınıflandırma ve analiz becerisi.", icon: <Puzzle />, color: "violet", difficulty: "Orta", link: "/games/mindmatch-oruntu", tuzo: "5.5.4 Kategori Analizi" },
    { id: 'n-back', title: "N-Geri Şifresi", desc: "Bilişsel bilimin en etkili zeka egzersizi. N-adım önceki şekli hatırla ve karşılaştır.", icon: <Radio />, color: "emerald", difficulty: "Uzman", link: "/games/n-geri-sifresi", tuzo: "5.9.2 Çalışma Belleği (Güncelleme)" },
    { id: 'patterniq-express', title: "PatternIQ Express", desc: "Vagon dizisindeki örüntüyü çöz! Şekillerin dönüşüm kuralını bul ve sıradaki vagonu seç.", icon: <Shapes />, color: "cyan", difficulty: "Orta", link: "/games/patterniq-express", tuzo: "5.5.1 Örüntü Analizi" },
    { id: 'puzzle-master', title: "Puzzle Master", desc: "Karmaşık görsel örüntüler içindeki eksik parçayı bulma ve analiz etme simülatörü.", icon: <ScanEye />, color: "indigo", difficulty: "Zor", link: "/games/puzzle-master", tuzo: "5.3.2 Desen Analizi" },
    { id: 'pencil-stroop', title: "Renkli Kalemler", desc: "Yazının rengindeki kalemi seç! Görsel Stroop dikkat testi.", icon: <PenTool />, color: "amber", difficulty: "Orta", link: "/games/renkli-kalemler", tuzo: "5.8.1 Bilişsel Esneklik" },
    { id: 'sayi-sihirbazi', title: "Sayı Sihirbazı", desc: "Renkli kartları hafızana al, sonra renk, sayı ve matematik sorularını çöz!", icon: <Sparkles />, color: "amber", difficulty: "Orta", link: "/games/sayi-sihirbazi", tuzo: "5.9.1 Çalışma Belleği (Güncelleme)" },
    { id: 'number-sequence', title: "Sayısal Dizi Tamamlama", desc: "Sayı dizisindeki örüntüyü bul ve sıradaki sayıyı tahmin et! Sayısal zeka ve mantıksal çıkarım testi.", icon: <Hash />, color: "blue", difficulty: "Orta", link: "/games/sayisal-dizi", tuzo: "5.2.1 Sayısal Dizi Tamamlama" },
    { id: 'number-memory', title: "Sayısal Hafıza", desc: "Sesli okunan rakamları dinle! Sıralama, toplam ve pozisyon sorularıyla işitsel-sayısal hafızanı test et.", icon: <Headphones />, color: "violet", difficulty: "Zor", link: "/games/sayisal-hafiza", tuzo: "5.4.1 Sayısal Kısa Süreli Bellek" },
    { id: 'sayisal-sifre', title: "Sayısal Şifre", desc: "Sayılar arasındaki gizli kuralları keşfet! Soyut matematiksel mantık ve örüntü tanıma.", icon: <Calculator />, color: "amber", difficulty: "Uzman", link: "/games/sayisal-sifre", tuzo: "5.2.3 Soyut Sayısal Mantık" },
    { id: 'sembol-arama', title: "Sembol Arama", desc: "Hedef sembolü incele, arama grubunda olup olmadığını en hızlı şekilde bul! Seçici dikkat ve görsel tarama.", icon: <ScanSearch />, color: "cyan", difficulty: "Orta", link: "/games/sembol-arama", tuzo: "5.7.1 Seçici Dikkat" },
    { id: 'digit-symbol', title: "Simge Kodlama", desc: "Sayı-sembol eşleştirme! İşlem hızını ve dikkatini test et.", icon: <Binary />, color: "cyan", difficulty: "Orta", link: "/games/simge-kodlama", tuzo: "5.6.1 İşlem Hızı" },
    { id: 'son-harf-ustasi', title: "Son Harf Ustası", desc: "Kelimelerin son harflerini birleştirerek gizli şifreyi çöz! Sözel analiz ve dikkat becerisi.", icon: <Type />, color: "fuchsia", difficulty: "Orta", link: "/games/son-harf-ustasi", tuzo: "5.1.3 Sözel Analiz" },
    { id: 'stroop', title: "Stroop Etkisi", desc: "Yazının rengini seç, kelimeyi değil! Bilişsel esneklik ve dikkat kontrolü testi.", icon: <Eye />, color: "violet", difficulty: "Orta", link: "/games/stroop", tuzo: "5.8.1 Bilişsel Esneklik" },
    { id: 'verbal-analogy', title: "Sözel Analoji", desc: "Kavramlar arasındaki ilişkiyi bul! Anne:Baba gibi Kız:? Sözel akıl yürütme testi.", icon: <BookOpen />, color: "pink", difficulty: "Orta", link: "/games/sozel-analoji", tuzo: "5.1.2 Sözel Analoji" },
    { id: 'sekil-cebiri', title: "Şekil Cebiri", desc: "Her şeklin bir değeri var! Görsel denklemleri çözerek şekillerin değerlerini bul ve soruyu cevapla.", icon: <Brain />, color: "indigo", difficulty: "Zor", link: "/games/sekil-cebiri", tuzo: "5.5.2 Kural Çıkarsama" },
    { id: 'symbol-match', title: "Şekil Hafızası", desc: "Renkli şekilleri ezberle! Hangi şekil hangi renkteydi? Görsel hafıza ve dikkat testi.", icon: <Lightbulb />, color: "violet", difficulty: "Orta", link: "/games/sekil-hafizasi", tuzo: "5.4.2 Görsel Kısa Süreli Bellek" },
    { id: 'reaction-time', title: "Tepki Süresi", desc: "Ne kadar hızlı tepki verebilirsin? Reflekslerini test et!", icon: <Activity />, color: "amber", difficulty: "Kolay", link: "/games/tepki-suresi", tuzo: "5.6.1 İşlem Hızı" },
    { id: 'reflection-sum', title: "Yansıma Toplamı", desc: "Rakam dizisini izle. Hem geriye doğru hatırla hem de toplamı hesapla. Ayna efektine dikkat et!", icon: <ArrowLeftRight />, color: "purple", difficulty: "Uzman", link: "/games/yansima-toplami", tuzo: "5.9.2 Çalışma Belleği (Ters Sıralı)" },
    { id: 'yaratik-mantigi', title: "Yaratık Mantığı", desc: "Kuralları oku, koşulları değerlendir ve doğru yaratıkları seç! Yönerge takibi becerisi.", icon: <Bug />, color: "emerald", difficulty: "Zor", link: "/games/yaratik-mantigi", tuzo: "5.5.3 Yönerge Takibi" },
    { id: 'direction-stroop', title: "Yön Stroop", desc: "Yazının konumunu seç, kelimeyi değil! Uzamsal dikkat ve bilişsel esneklik testi.", icon: <Compass />, color: "cyan", difficulty: "Orta", link: "/games/yon-stroop", tuzo: "5.8.1 Bilişsel Esneklik" },
    { id: 'face-expression', title: "Yüz İfadesi Tanıma", desc: "Duyguları yüz ifadesinden tanı! Sosyal zeka testi.", icon: <CircleUser />, color: "pink", difficulty: "Orta", link: "/games/yuz-ifadesi", tuzo: "5.10.1 Sosyal Zeka" },
    { id: 'zaman-gezgini', title: "Zaman Gezgini", desc: "Saati oku, yelkovanı sürükle ve doğru zamanı göster! Dakika hesaplama ve sayısal akıl yürütme becerisi.", icon: <Clock />, color: "indigo", difficulty: "Orta", link: "/games/zaman-gezgini", tuzo: "5.2.1 Sayısal Akıl Yürütme" },
];

// Map game color to cyber token
const getCyberColor = (c: string) => {
    if (['violet', 'indigo', 'purple'].includes(c)) return 'cyber-purple';
    if (['fuchsia', 'sky', 'cyan'].includes(c)) return 'cyber-blue';
    if (['rose', 'pink'].includes(c)) return 'cyber-pink';
    if (['emerald', 'teal'].includes(c)) return 'cyber-emerald';
    if (['amber'].includes(c)) return 'cyber-gold';
    if (['blue'].includes(c)) return 'cyber-blue';
    return 'cyber-gold';
};

// Static class map for Tailwind JIT (dynamic `bg-${var}` won't be detected)
const CYBER_CLASSES: Record<string, { bg: string; bgLight: string; border: string; text: string; strip: string }> = {
    'cyber-purple': { bg: 'bg-cyber-purple', bgLight: 'bg-cyber-purple/10', border: 'border-cyber-purple/20', text: 'text-cyber-purple', strip: 'bg-cyber-purple' },
    'cyber-blue': { bg: 'bg-cyber-blue', bgLight: 'bg-cyber-blue/10', border: 'border-cyber-blue/20', text: 'text-cyber-blue', strip: 'bg-cyber-blue' },
    'cyber-pink': { bg: 'bg-cyber-pink', bgLight: 'bg-cyber-pink/10', border: 'border-cyber-pink/20', text: 'text-cyber-pink', strip: 'bg-cyber-pink' },
    'cyber-emerald': { bg: 'bg-cyber-emerald', bgLight: 'bg-cyber-emerald/10', border: 'border-cyber-emerald/20', text: 'text-cyber-emerald', strip: 'bg-cyber-emerald' },
    'cyber-gold': { bg: 'bg-cyber-gold', bgLight: 'bg-cyber-gold/10', border: 'border-cyber-gold/20', text: 'text-cyber-gold', strip: 'bg-cyber-gold' },
};

const TUZO_CATEGORIES: Record<string, string> = {
    '1': 'Sözel Yetenek',
    '2': 'Sayısal Yetenek',
    '3': 'Görsel-Uzamsal',
    '4': 'Hafıza',
    '5': 'Akıl Yürütme',
    '6': 'İşlem Hızı',
    '7': 'Dikkat',
    '8': 'Bilişsel Esneklik',
    '9': 'Çalışma Belleği',
    '10': 'Sosyal Zeka'
};

const getTuzoCategory = (tuzoStr?: string) => {
    if (!tuzoStr) return 'Diğer';
    const match = tuzoStr.match(/^5\.(\d+)\./);
    if (match && match[1]) {
        return TUZO_CATEGORIES[match[1]] || 'Diğer';
    }
    return 'Diğer';
};

const IndividualAssessmentPage: React.FC = () => {
    const { profile, loading } = useAuth();
    const canAccess = hasIndividualAccess(profile?.yetenek_alani);
    const [activeCategory, setActiveCategory] = useState<string>('Hepsi');

    const categories = useMemo(() => {
        const cats = new Set<string>();
        MODULES.forEach(m => {
            if (m.tuzo) cats.add(getTuzoCategory(m.tuzo));
        });
        return ['Hepsi', ...Array.from(cats).sort()];
    }, []);

    const filteredModules = useMemo(() => {
        if (activeCategory === 'Hepsi') return MODULES;
        return MODULES.filter(m => getTuzoCategory(m.tuzo) === activeCategory);
    }, [activeCategory]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-cyber-emerald border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!canAccess) {
        return (
            <AccessDeniedScreen
                requiredTalent="Genel Yetenek - Bireysel Değerlendirme"
                backLink="/atolyeler/genel-yetenek"
                backLabel="Genel Yetenek Sayfasına Dön"
                iconType="shield"
                requiredIncludes={['genel_yetenek']}
            />
        );
    }


    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800 pt-24 pb-12 px-6 relative overflow-hidden transition-colors duration-300">
            <Helmet>
                <title>Bireysel Değerlendirme Atölyesi | BİLSEM 2. Aşama Hazırlık</title>
                <meta name="description" content="BİLSEM bireysel değerlendirme sınavına hazırlık. 30+ interaktif simülatör ile zeka ölçeği testlerine hazırlan. Sözel, sayısal ve performans tabanlı değerlendirmeler." />
                <meta name="keywords" content="BİLSEM bireysel değerlendirme, 2. aşama hazırlık, zeka ölçeği, mülakat hazırlık, WISC-R, sözel zeka, sayısal zeka" />
                <link rel="canonical" href="https://bilsemc2.com/atolyeler/bireysel-degerlendirme" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Bireysel Değerlendirme Atölyesi | BİLSEM 2. Aşama" />
                <meta property="og:description" content="30+ simülatör ile BİLSEM bireysel değerlendirme sınavına hazırlan." />
                <meta property="og:url" content="https://bilsemc2.com/atolyeler/bireysel-degerlendirme" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Bireysel Değerlendirme | BİLSEM" />
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Course",
                        "name": "Bireysel Değerlendirme Atölyesi",
                        "description": "BİLSEM 2. aşama bireysel değerlendirme sınavına hazırlık. 30+ interaktif simülatör ile zeka ölçeği testlerine hazırlan.",
                        "provider": { "@type": "EducationalOrganization", "name": "BilsemC2", "url": "https://bilsemc2.com" },
                        "educationalLevel": "İlkokul - Ortaokul",
                        "inLanguage": "tr",
                        "isAccessibleForFree": false,
                        "audience": { "@type": "EducationalAudience", "educationalRole": "student", "audienceType": "BİLSEM 2. aşama adayları" },
                        "hasCourseInstance": { "@type": "CourseInstance", "courseMode": "online", "courseWorkload": "PT90M" },
                        "teaches": ["Sözel zeka", "Sayısal zeka", "İşlem hızı", "Çalışma belleği", "Görsel-uzamsal beceriler"]
                    })}
                </script>
            </Helmet>

            {/* Background dots */}
            <div className="fixed inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="container mx-auto max-w-6xl relative z-10">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-14">
                    <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 w-full lg:flex-1 min-w-0">
                        <Link to="/atolyeler/genel-yetenek"
                            className="inline-flex items-center gap-2 text-black dark:text-white font-nunito font-extrabold uppercase text-xs tracking-widest bg-white dark:bg-slate-800 border-3 border-black/10 rounded-xl px-4 py-2 shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all">
                            <ChevronLeft size={14} strokeWidth={3} /> Genel Yetenek Atölyesi
                        </Link>
                        <div className="flex flex-col sm:flex-row sm:items-center items-start gap-4 sm:gap-5">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                className="p-4 bg-cyber-pink/10 border-3 border-cyber-pink/30 rounded-2xl">
                                <Brain size={40} className="text-cyber-pink sm:w-12 sm:h-12" strokeWidth={2.5} />
                            </motion.div>
                            <div className="min-w-0">
                                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-nunito font-extrabold text-black dark:text-white leading-none tracking-tight uppercase break-words">
                                    Bireysel <span className="text-cyber-emerald block sm:inline">Değerlendirme</span>
                                </h1>
                                <p className="text-slate-500 font-nunito font-extrabold mt-3 uppercase tracking-widest text-xs border-l-4 border-cyber-pink pl-3">
                                    2. Aşama Hazırlık Merkezi
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="w-full lg:w-auto bg-white dark:bg-slate-800 p-5 sm:p-6 border-2 border-black/10 rounded-2xl flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-neo-md">
                        <div className="hidden md:block">
                            <div className="text-black dark:text-white font-nunito font-extrabold text-right text-lg uppercase tracking-tight">Zeka Ölçekleri</div>
                            <div className="text-cyber-pink text-xs font-extrabold uppercase tracking-widest text-right mt-1">TÜZÖ</div>
                        </div>
                        <div className="h-10 w-0.5 bg-black/10 dark:bg-white/10 hidden md:block" />
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full bg-cyber-purple/10 border-3 border-cyber-purple/30 flex items-center justify-center text-cyber-purple text-sm font-extrabold transition-transform hover:-translate-y-1">
                                    {i}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Sınav Simülasyonu CTA */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-14">
                    <Link to="/atolyeler/sinav-simulasyonu" className="block outline-none">
                        <div className="bg-cyber-gold border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-md hover:-translate-y-1 hover:shadow-neo-lg transition-all cursor-pointer group flex flex-col sm:flex-row items-center gap-6 sm:gap-8 p-5 sm:p-8">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white border-3 border-black/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <TrendingUp size={36} className="text-black sm:w-10 sm:h-10" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0 text-center sm:text-left">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2">
                                    <h3 className="text-2xl sm:text-3xl font-nunito font-extrabold text-black tracking-tight uppercase">Sınav Simülasyonu</h3>
                                    <span className="px-2.5 py-1 bg-black text-cyber-gold text-[10px] font-extrabold uppercase rounded-lg">Beta</span>
                                    <div className="relative group/tooltip">
                                        <Info strokeWidth={3} className="text-black/40 cursor-help hover:text-black transition-colors w-5 h-5" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-normal sm:whitespace-nowrap text-center w-56 sm:w-auto z-50 font-bold">
                                            Hatalar olabilir. Lütfen ekran resmi alıp bildirin!
                                        </div>
                                    </div>
                                </div>
                                <p className="text-black/70 font-nunito font-bold text-sm sm:text-base max-w-2xl leading-relaxed">
                                    Adaptif zorluk sistemiyle gerçek sınav deneyimini yaşa! Tüm modülleri tek seansta test et ve detaylı performans raporu al.
                                </p>
                            </div>
                            <div className="shrink-0 group-hover:translate-x-2 transition-transform">
                                <ChevronLeft size={36} strokeWidth={3} className="text-black rotate-180" />
                            </div>
                        </div>
                    </Link>
                </motion.div>

                {/* Filter Bar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
                    <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide snap-x">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`shrink-0 px-4 py-2 rounded-xl font-nunito font-extrabold text-xs sm:text-sm tracking-widest uppercase transition-all shadow-neo-sm hover:-translate-y-1 snap-start border-2 ${activeCategory === cat
                                    ? 'bg-black text-cyber-gold border-black'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-black/10 hover:border-cyber-pink hover:text-cyber-pink'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Modüller Grid */}
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence mode="popLayout">
                        {filteredModules.map((mod) => {
                            const cyberColor = getCyberColor(mod.color);
                            const cc = CYBER_CLASSES[cyberColor] ?? CYBER_CLASSES['cyber-gold'];
                            return (
                                <motion.div key={mod.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                    className="group h-full relative">
                                    <div className="h-full bg-white dark:bg-slate-800 border-2 border-black/10 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-neo-sm hover:shadow-neo-md hover:-translate-y-1">
                                        {/* Accent strip */}
                                        <div className={`h-1.5 ${cc.strip}`} />

                                        <div className="p-6 space-y-4 flex-1">
                                            <div className="flex items-start justify-between">
                                                <div className={`w-12 h-12 ${cc.bgLight} border-2 ${cc.border} rounded-xl flex items-center justify-center ${cc.text} group-hover:scale-110 transition-transform`}>
                                                    {React.cloneElement(mod.icon as React.ReactElement, { strokeWidth: 2.5, size: 24 })}
                                                </div>
                                                <span className="px-2.5 py-1 bg-gray-50 dark:bg-slate-700 border border-black/5 text-[10px] font-nunito font-extrabold uppercase text-slate-500 dark:text-slate-400 tracking-widest rounded-lg">
                                                    {mod.difficulty}
                                                </span>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-lg font-nunito font-extrabold text-black dark:text-white uppercase tracking-tight leading-tight">{mod.title}</h3>
                                                    {(mod as { isNew?: boolean }).isNew && (
                                                        <span className="px-1.5 py-0.5 bg-cyber-emerald/10 border border-cyber-emerald/30 text-cyber-emerald text-[9px] font-extrabold uppercase animate-pulse rounded-md">YENİ</span>
                                                    )}
                                                </div>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs font-nunito font-bold leading-relaxed">{mod.desc}</p>

                                                {mod.tuzo && (
                                                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyber-purple/5 border border-cyber-purple/20 rounded-lg">
                                                        <span className="text-[9px] font-extrabold text-cyber-purple uppercase tracking-widest">TUZÖ</span>
                                                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{mod.tuzo}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="px-6 pb-5 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between flex-col sm:flex-row gap-3">
                                            <div className="text-slate-400 text-[10px] font-nunito font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-cyber-emerald rounded-full animate-pulse" /> Simülatör Hazır
                                            </div>
                                            <Link to={mod.link} state={{ autoStart: true }}
                                                className="w-full sm:w-auto px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black font-nunito font-extrabold text-xs uppercase text-center border-3 border-black/10 rounded-xl shadow-neo-sm hover:-translate-y-1 hover:shadow-neo-md transition-all flex items-center justify-center gap-2 group/btn">
                                                BAŞLAT <Rocket size={14} strokeWidth={2.5} className="group-hover/btn:translate-x-1 transition-transform" />
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Info Card */}
                    <motion.div layout
                        className="lg:col-span-1 bg-cyber-purple border-2 border-black/10 rounded-2xl overflow-hidden shadow-neo-md relative group">
                        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                        <div className="relative z-10 p-8 space-y-5">
                            <div className="w-14 h-14 bg-white/20 border-2 border-white/30 rounded-2xl flex items-center justify-center">
                                <Lightbulb size={28} className="text-cyber-gold" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-nunito font-extrabold text-white tracking-tight uppercase">Neden 2. Aşama?</h3>
                            <p className="text-white/80 font-nunito font-bold text-sm leading-relaxed">
                                Tablet sınavını geçen öğrenciler, bireysel değerlendirmede zekalarını çok yönlü (sözsel, sayısal, performans) ispat ederler. Buradaki modüller, o mülakat ortamındaki bilişsel baskıyı ve soru tiplerini simüle etmek için tasarlanmıştır.
                            </p>
                        </div>
                        <div className="px-8 pb-8 relative z-10">
                            <div className="inline-flex items-center gap-2 text-white text-xs font-extrabold uppercase tracking-widest bg-white/10 border border-white/20 px-4 py-2 rounded-xl">
                                <Trophy size={16} className="text-cyber-gold" strokeWidth={2.5} /> Üstün Başarı Hedefi
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default IndividualAssessmentPage;
