import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Brain, Star, ChevronLeft, Rocket, Zap, Trophy, Lightbulb, Radio, Search, Cpu, Hash, LayoutGrid, TrendingUp, ArrowLeftRight, Languages, Grid3X3, Eye, Compass, Smile, PenTool, Link2, BookOpen, BookText, MessageSquareText, Binary, ScanEye, Headphones, Activity, CircleUser, Calculator, Sparkles, Info, Scale, Shapes, MapPin, Puzzle, FlaskConical, Type, BrainCircuit, Bug, ScanSearch, Code2, Crosshair, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import './bireysel.css';
import { useAuth } from '../../contexts/AuthContext';
import AccessDeniedScreen from '../../components/AccessDeniedScreen';

// yetenek_alani erişim kontrolü
const hasIndividualAccess = (yetenekAlani: string[] | string | null | undefined): boolean => {
    if (!yetenekAlani) return false;
    const skills = Array.isArray(yetenekAlani) ? yetenekAlani : [yetenekAlani];
    // 'genel yetenek' tüm alt kategorilere erişim sağlar
    // 'genel yetenek - bireysel' sadece bireysel'e erişim sağlar
    return skills.some(s => s === 'genel yetenek' || s === 'genel yetenek - bireysel');
};

const IndividualAssessmentPage: React.FC = () => {
    const { profile, loading } = useAuth();

    // Erişim kontrolü
    const canAccess = hasIndividualAccess(profile?.yetenek_alani);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
            />
        );
    }

    const modules = [
        {
            id: 'labirent',
            title: "Labirent Koşusu",
            desc: "Parmağınla yolu çiz, duvarlara değme! Uzamsal ilişki çözümleme ve görsel-motor koordinasyon.",
            icon: <Compass />,
            color: "violet",
            difficulty: "Zor",
            link: "/games/labirent",
            isNew: true,
            tuzo: "5.3.3 Uzamsal İlişki Çözümleme"
        },
        {
            id: 'lazer-hafiza',
            title: "Lazer Hafıza",
            desc: "Noktalar arasındaki lazer yolunu izle ve hafızandan aynı yolu yeniden çiz!",
            icon: <Crosshair />,
            color: "emerald",
            difficulty: "Zor",
            link: "/games/lazer-hafiza",
            tuzo: "5.4.2 Görsel Kısa Süreli Bellek"
        },
        {
            id: 'sekil-cebiri',
            title: "Şekil Cebiri",
            desc: "Her şeklin bir değeri var! Görsel denklemleri çözerek şekillerin değerlerini bul ve soruyu cevapla.",
            icon: <Brain />,
            color: "indigo",
            difficulty: "Zor",
            link: "/games/sekil-cebiri",
            tuzo: "5.5.2 Kural Çıkarsama"
        },
        {
            id: 'zaman-gezgini',
            title: "Zaman Gezgini",
            desc: "Saati oku, yelkovanı sürükle ve doğru zamanı göster! Dakika hesaplama ve sayısal akıl yürütme becerisi.",
            icon: <Clock />,
            color: "indigo",
            difficulty: "Orta",
            link: "/games/zaman-gezgini",
            tuzo: "5.2.1 Sayısal Akıl Yürütme"
        },
        {
            id: 'farki-bul',
            title: "Farkı Bul",
            desc: "Renk, şekil, boyut ve açı farkını yakala! Seçici dikkat ve görsel algı becerini test et.",
            icon: <Eye />,
            color: "fuchsia",
            difficulty: "Orta",
            link: "/games/farki-bul",
            tuzo: "5.7.1 Seçici Dikkat"
        },
        {
            id: 'kelime-avi',
            title: "Kelime Avı",
            desc: "Hedef harfi içeren kelimeleri hızla bul! Ortografik algı ve işlem hızını test et.",
            icon: <Search />,
            color: "violet",
            difficulty: "Orta",
            link: "/games/kelime-avi",
            tuzo: "5.6.1 Algısal İşlem Hızı"
        },
        {
            id: 'matematik-grid',
            title: "Matematik Grid",
            desc: "3×3 sayı tablosundaki gizli sayıları bul! Satırlar arası matematiksel ilişkiyi keşfet.",
            icon: <Grid3X3 />,
            color: "teal",
            difficulty: "Orta",
            link: "/games/matematik-grid",
            tuzo: "5.2.1 Sayısal Akıl Yürütme"
        },
        {
            id: 'gorsel-hafiza',
            title: "Görsel Hafıza",
            desc: "Ekranda beliren sembolleri hafızana kazı, sonra değişen sembolü bul! Bilişsel kodlama ve kısa süreli bellek.",
            icon: <ScanEye />,
            color: "sky",
            difficulty: "Orta",
            link: "/games/gorsel-hafiza",
            tuzo: "5.4.2 Görsel Kısa Süreli Bellek"
        },

        {
            id: 'lazer-labirent',
            title: "Lazer Labirent",
            desc: "Görünmez lazerin aynalardan yansıyarak hangi çıkışa ulaştığını tahmin et! Uzamsal ilişki ve görsel takip becerisi.",
            icon: <Crosshair />,
            color: "indigo",
            difficulty: "Zor",
            link: "/games/lazer-labirent",
            tuzo: "5.3.3 Uzamsal İlişki Çözümleme"
        },
        {
            id: 'algisal-hiz',
            title: "Algısal Hız Testi",
            desc: "İki sayı dizisini karşılaştır — aynı mı farklı mı? Transpozisyon ve görsel benzerlik tuzaklarıyla işleme hızını test et!",
            icon: <Eye />,
            color: "cyan",
            difficulty: "Orta",
            link: "/games/algisal-hiz",
            tuzo: "5.6.1 İşleme Hızı"
        },
        {
            id: 'dikkat-ve-kodlama',
            title: "Dikkat ve Kodlama",
            desc: "Sayı-şekil eşleşmelerini ezberle, test maddelerini en hızlı şekilde doldur! İşleme hızı ve kodlama.",
            icon: <Code2 />,
            color: "violet",
            difficulty: "Orta",
            link: "/games/dikkat-ve-kodlama",
            tuzo: "5.6.1 İşleme Hızı"
        },
        {
            id: 'sembol-arama',
            title: "Sembol Arama",
            desc: "Hedef sembolü incele, arama grubunda olup olmadığını en hızlı şekilde bul! Seçici dikkat ve görsel tarama.",
            icon: <ScanSearch />,
            color: "cyan",
            difficulty: "Orta",
            link: "/games/sembol-arama",
            tuzo: "5.7.1 Seçici Dikkat"
        },
        {
            id: 'yaratik-mantigi',
            title: "Yaratık Mantığı",
            desc: "Kuralları oku, koşulları değerlendir ve doğru yaratıkları seç! Yönerge takibi becerisi.",
            icon: <Bug />,
            color: "emerald",
            difficulty: "Zor",
            link: "/games/yaratik-mantigi",
            tuzo: "5.5.3 Yönerge Takibi"
        },
        {
            id: 'kosullu-yonerge',
            title: "Koşullu Yönerge Takibi",
            desc: "Mantık yönergesini oku, koşulu değerlendir ve doğru nesneyi seç! Koşullu çıkarım becerisi.",
            icon: <BrainCircuit />,
            color: "indigo",
            difficulty: "Zor",
            link: "/games/kosullu-yonerge",
            tuzo: "5.5.2 Koşullu Çıkarım"
        },
        {
            id: 'son-harf-ustasi',
            title: "Son Harf Ustası",
            desc: "Kelimelerin son harflerini birleştirerek gizli şifreyi çöz! Sözel analiz ve dikkat becerisi.",
            icon: <Type />,
            color: "fuchsia",
            difficulty: "Orta",
            link: "/games/son-harf-ustasi",
            tuzo: "5.1.3 Sözel Analiz"
        },
        {
            id: 'mantik-bulmacasi',
            title: "Görsel Mantık Bulmacası",
            desc: "Şekil gruplarındaki gizli kuralı çöz! Renk, şekil, dolgu ve sayı kurallarını analiz et.",
            icon: <FlaskConical />,
            color: "blue",
            difficulty: "Zor",
            link: "/games/mantik-bulmacasi",
            tuzo: "5.5.1 Kural Çıkarsama"
        },
        {
            id: 'mindmatch-oruntu',
            title: "MindMatch Örüntü",
            desc: "Kategoriye ait tüm öğeleri bul! Kalıbı çöz, eşleşmeyenleri ayır. Sınıflandırma ve analiz becerisi.",
            icon: <Puzzle />,
            color: "violet",
            difficulty: "Orta",
            link: "/games/mindmatch-oruntu",
            tuzo: "5.5.4 Kategori Analizi"
        },
        {
            id: 'konum-bulmaca',
            title: "Konum Bulmaca",
            desc: "Şekillerin kesişim bölgelerinde noktanın konumunu bul! Uzamsal ilişki ve mantıksal analiz.",
            icon: <MapPin />,
            color: "teal",
            difficulty: "Orta",
            link: "/games/konum-bulmaca",
            tuzo: "5.5.3 Uzamsal İlişki"
        },
        {
            id: 'patterniq-express',
            title: "PatternIQ Express",
            desc: "Vagon dizisindeki örüntüyü çöz! Şekillerin dönüşüm kuralını bul ve sıradaki vagonu seç.",
            icon: <Shapes />,
            color: "cyan",
            difficulty: "Orta",
            link: "/games/patterniq-express",
            tuzo: "5.5.1 Örüntü Analizi"
        },
        {
            id: 'gorsel-cebir-dengesi',
            title: "Görsel Cebir Dengesi",
            desc: "Terazideki şekillerin ağırlık ilişkisini çöz ve dengeyi sağla! Görsel akıl yürütme ve kural çıkarsama.",
            icon: <Scale />,
            color: "indigo",
            difficulty: "Zor",
            link: "/games/gorsel-cebir-dengesi",
            tuzo: "5.5.2 Kural Çıkarsama"
        },
        {
            id: 'matris-bulmaca',
            title: "Matris Bulmaca",
            desc: "3×3 ızgarada deseni analiz et! Döndürme, aynalama ve renk değişimi kurallarıyla gizli hücreyi bul.",
            icon: <Grid3X3 />,
            color: "violet",
            difficulty: "Orta",
            link: "/games/matris-bulmaca",
            tuzo: "5.5.2 Kural Çıkarsama"
        },
        {
            id: 'sayi-sihirbazi',
            title: "Sayı Sihirbazı",
            desc: "Renkli kartları hafızana al, sonra renk, sayı ve matematik sorularını çöz!",
            icon: <Sparkles />,
            color: "amber",
            difficulty: "Orta",
            link: "/games/sayi-sihirbazi",
            tuzo: "5.9.1 Çalışma Belleği (Güncelleme)"
        },
        {
            id: 'desen-boyama',
            title: "Desen Boyama",
            desc: "Örüntüdeki boşluğu doğru renklerle doldur! Desen analizi ve görsel tamamlama.",
            icon: <PenTool />,
            color: "rose",
            difficulty: "Orta",
            link: "/games/desen-boyama",
            tuzo: "5.3.2 Desen Analizi"
        },
        {
            id: 'gurultu-filtresi',
            title: "Gürültü Filtresi",
            desc: "Dikkat dağıtıcı arka plan sesleri arasında hedef sesi tanı! Seçici dikkat ve odaklanma.",
            icon: <Headphones />,
            color: "purple",
            difficulty: "Uzman",
            link: "/games/gurultu-filtresi",
            tuzo: "5.7.1 Seçici Dikkat"
        },
        {
            id: 'sayisal-sifre',
            title: "Sayısal Şifre",
            desc: "Sayılar arasındaki gizli kuralları keşfet! Soyut matematiksel mantık ve örüntü tanıma.",
            icon: <Calculator />,
            color: "amber",
            difficulty: "Uzman",
            link: "/games/sayisal-sifre",
            tuzo: "5.2.3 Soyut Sayısal Mantık"
        },
        {
            id: 'number-memory',
            title: "Sayısal Hafıza",
            desc: "Sesli okunan rakamları dinle! Sıralama, toplam ve pozisyon sorularıyla işitsel-sayısal hafızanı test et.",
            icon: <Headphones />,
            color: "violet",
            difficulty: "Zor",
            link: "/games/sayisal-hafiza",
            tuzo: "5.4.1 Sayısal Kısa Süreli Bellek"
        },
        {
            id: 'puzzle-master',
            title: "Puzzle Master",
            desc: "Karmaşık görsel örüntüler içindeki eksik parçayı bulma ve analiz etme simülatörü.",
            icon: <ScanEye />,
            color: "indigo",
            difficulty: "Zor",
            link: "/games/puzzle-master",
            tuzo: "5.3.2 Desen Analizi"
        },
        {
            id: 'cosmic-memory',
            title: "Kozmik Hafıza",
            desc: "Görsel-uzamsal hafıza ve çalışma belleği simülatörü.",
            icon: <Star />,
            color: "indigo",
            difficulty: "Zor",
            link: "/games/kozmik-hafiza",
            tuzo: "5.4.2 Görsel Kısa Süreli Bellek"
        },
        {
            id: 'n-back',
            title: "N-Geri Şifresi",
            desc: "Bilişsel bilimin en etkili zeka egzersizi. N-adım önceki şekli hatırla ve karşılaştır.",
            icon: <Radio />,
            color: "emerald",
            difficulty: "Uzman",
            link: "/games/n-geri-sifresi",
            tuzo: "5.9.2 Çalışma Belleği (Güncelleme)"
        },
        {
            id: 'shadow-detective',
            title: "Gölge Dedektifi",
            desc: "Karmaşık desenleri 3 saniyede hatırla. Birbirine çok benzeyen kanıtlar arasından gerçeği bul!",
            icon: <Search />,
            color: "amber",
            difficulty: "Uzman",
            link: "/games/golge-dedektifi",
            tuzo: "5.3.1 Şekil Eşleştirme"
        },
        {
            id: 'cross-match',
            title: "Çapraz Eşleşme",
            desc: "Sembol ve renk kombinasyonlarını hatırla. Dinamik karıştırma efektlerine karşı verileri takip et!",
            icon: <Cpu />,
            color: "rose",
            difficulty: "Uzman",
            link: "/games/capraz-eslesme",
            tuzo: "5.9.1 Çalışma Belleği (İzleme)"
        },
        {
            id: 'target-grid',
            title: "Bak ve Bul",
            desc: "Izgaradaki sayıları hafızana al ve hedef toplama ulaşmak için doğru kartları eşleştir. Hız ve hafıza bir arada!",
            icon: <LayoutGrid />,
            color: "purple",
            difficulty: "Uzman",
            link: "/games/hedef-sayi",
            tuzo: "5.2.2 Matematiksel Problem Çözme"
        },
        {
            id: 'stream-sum',
            title: "Akışkan Toplam",
            desc: "Sürekli akan sayıları takip et ve her yeni sayıyı bir öncekiyle topla. Odak ve hızını test et!",
            icon: <TrendingUp />,
            color: "sky",
            difficulty: "Uzman",
            link: "/games/akiskan-toplam",
            tuzo: "5.9.2 Çalışma Belleği (Güncelleme)"
        },
        {
            id: 'invisible-tower',
            title: "Görünmez Kule",
            desc: "Piramit katmanlarında yükselen sayıları hafızana al. Çarpanlar ve negatif sayılarla dinamik toplamı hesapla!",
            icon: <TrendingUp />,
            color: "amber",
            difficulty: "Uzman",
            link: "/games/gorunmez-kule",
            tuzo: "5.9.2 Çalışma Belleği (Güncelleme)"
        },
        {
            id: 'matrix-echo',
            title: "Matris Yankısı",
            desc: "3x3 matristeki sayıları takip et. Shuffling sonrası karmaşık mantıksal soruları yanıtla!",
            icon: <LayoutGrid />,
            color: "blue",
            difficulty: "Uzman",
            link: "/games/matris-yankisi",
            tuzo: "5.3.2 Desen Analizi"
        },
        {
            id: 'reflection-sum',
            title: "Yansıma Toplamı",
            desc: "Rakam dizisini izle. Hem geriye doğru hatırla hem de toplamı hesapla. Ayna efektine dikkat et!",
            icon: <ArrowLeftRight />,
            color: "purple",
            difficulty: "Uzman",
            link: "/games/yansima-toplami",
            tuzo: "5.9.2 Çalışma Belleği (Ters Sıralı)"
        },
        {
            id: 'idioms',
            title: "Deyimler Atölyesi",
            desc: "Sözsel zekanı ve kültürel birikimini test et. Deyimleri anlamlarıyla eşleştir ve yorumla!",
            icon: <Languages />,
            color: "pink",
            difficulty: "Orta",
            link: "/deyimler",
            tuzo: "5.1.3 Sözlü Anlama"
        },
        {
            id: 'stroop',
            title: "Stroop Etkisi",
            desc: "Yazının rengini seç, kelimeyi değil! Bilişsel esneklik ve dikkat kontrolü testi.",
            icon: <Eye />,
            color: "violet",
            difficulty: "Orta",
            link: "/games/stroop",
            tuzo: "5.8.1 Bilişsel Esneklik"
        },
        {
            id: 'direction-stroop',
            title: "Yön Stroop",
            desc: "Yazının konumunu seç, kelimeyi değil! Uzamsal dikkat ve bilişsel esneklik testi.",
            icon: <Compass />,
            color: "cyan",
            difficulty: "Orta",
            link: "/games/yon-stroop",
            tuzo: "5.8.1 Bilişsel Esneklik"
        },
        {
            id: 'emoji-stroop',
            title: "Emoji Stroop",
            desc: "Emojiyi tanı, yazıya aldanma! Çocuklar için eğlenceli dikkat ve algı testi.",
            icon: <Smile />,
            color: "pink",
            difficulty: "Kolay",
            link: "/games/emoji-stroop",
            tuzo: "5.8.2 Tepki Kontrolü (İnhibisyon)"
        },
        {
            id: 'pencil-stroop',
            title: "Renkli Kalemler",
            desc: "Yazının rengindeki kalemi seç! Görsel Stroop dikkat testi.",
            icon: <PenTool />,
            color: "amber",
            difficulty: "Orta",
            link: "/games/renkli-kalemler",
            tuzo: "5.8.1 Bilişsel Esneklik"
        },
        {
            id: 'symbol-match',
            title: "Şekil Hafızası",
            desc: "Renkli şekilleri ezberle! Hangi şekil hangi renkteydi? Görsel hafıza ve dikkat testi.",
            icon: <Lightbulb />,
            color: "violet",
            difficulty: "Orta",
            link: "/games/sekil-hafizasi",
            tuzo: "5.4.2 Görsel Kısa Süreli Bellek"
        },
        {
            id: 'dual-bind',
            title: "Çift Mod Hafıza",
            desc: "Renk→Şekil ve Şekil→Renk çift yönlü hatırla! İleri düzey çalışma belleği testi.",
            icon: <Link2 />,
            color: "rose",
            difficulty: "Zor",
            link: "/games/cift-mod-hafiza",
            tuzo: "5.9.1 Çalışma Belleği (Bağlama)"
        },
        {
            id: 'number-sequence',
            title: "Sayısal Dizi Tamamlama",
            desc: "Sayı dizisindeki örüntüyü bul ve sıradaki sayıyı tahmin et! Sayısal zeka ve mantıksal çıkarım testi.",
            icon: <Hash />,
            color: "blue",
            difficulty: "Orta",
            link: "/games/sayisal-dizi",
            tuzo: "5.2.1 Sayısal Dizi Tamamlama"
        },
        {
            id: 'verbal-analogy',
            title: "Sözel Analoji",
            desc: "Kavramlar arasındaki ilişkiyi bul! Anne:Baba gibi Kız:? Sözel akıl yürütme testi.",
            icon: <BookOpen />,
            color: "pink",
            difficulty: "Orta",
            link: "/games/sozel-analoji",
            tuzo: "5.1.2 Sözel Analoji"
        },
        {
            id: 'synonym',
            title: "Eş Anlam Bulmaca",
            desc: "Kelimelerin eş anlamlılarını bul! Kelime hazineni test et ve geliştir.",
            icon: <BookText />,
            color: "teal",
            difficulty: "Orta",
            link: "/games/es-anlam",
            tuzo: "5.1.1 Kelime Bilgisi"
        },
        {
            id: 'sentence-synonym',
            title: "Cümle İçi Eş Anlam",
            desc: "Cümledeki kelimenin eş anlamlısını bul! Kelime hazineni ve cümle anlayışını geliştir.",
            icon: <MessageSquareText />,
            color: "violet",
            difficulty: "Orta",
            link: "/games/cumle-ici-es-anlam",
            tuzo: "5.1.3 Sözlü Anlama"
        },
        {
            id: 'digit-symbol',
            title: "Simge Kodlama",
            desc: "Sayı-sembol eşleştirme! İşlem hızını ve dikkatini test et.",
            icon: <Binary />,
            color: "cyan",
            difficulty: "Orta",
            link: "/games/simge-kodlama",
            tuzo: "5.6.1 İşlem Hızı"
        },
        {
            id: 'visual-scanning',
            title: "Görsel Tarama",
            desc: "Hedef sembolü bul! Dikkat ve görsel tarama hızını test et.",
            icon: <ScanEye />,
            color: "rose",
            difficulty: "Orta",
            link: "/games/gorsel-tarama",
            tuzo: "5.7.1 Seçici Dikkat"
        },
        {
            id: 'auditory-memory',
            title: "İşitsel Hafıza",
            desc: "Ses dizisini dinle ve tekrarla! İşitsel hafızanı test et.",
            icon: <Headphones />,
            color: "indigo",
            difficulty: "Zor",
            link: "/games/isitsel-hafiza",
            tuzo: "5.4.1 Sayısal Kısa Süreli Bellek"
        },
        {
            id: 'reaction-time',
            title: "Tepki Süresi",
            desc: "Ne kadar hızlı tepki verebilirsin? Reflekslerini test et!",
            icon: <Activity />,
            color: "amber",
            difficulty: "Kolay",
            link: "/games/tepki-suresi",
            tuzo: "5.6.1 İşlem Hızı"
        },
        {
            id: 'face-expression',
            title: "Yüz İfadesi Tanıma",
            desc: "Duyguları yüz ifadesinden tanı! Sosyal zeka testi.",
            icon: <CircleUser />,
            color: "pink",
            difficulty: "Orta",
            link: "/games/yuz-ifadesi",
            tuzo: "5.10.1 Sosyal Zeka"
        },
        {
            id: 'knowledge-card',
            title: "Bilgi Kartları",
            desc: "Genel kültür cümlelerindeki eksik kelimeyi bul! Sözel zeka ve bilgi testi.",
            icon: <BookOpen />,
            color: "emerald",
            difficulty: "Orta",
            link: "/games/bilgi-kartlari",
            tuzo: "5.1.4 Bilgi (Genel Kültür)"
        },
        {
            id: 'story-quiz',
            title: "Hikaye Quiz",
            desc: "Rastgele bir hikaye oku, sorulara cevap ver ve puan kazan! Sözel zeka ve okuduğunu anlama testi.",
            icon: <BookText />,
            color: "purple",
            difficulty: "Orta",
            link: "/stories/quiz-game",
            tuzo: "5.1.3 Sözlü Anlama"
        }
    ];

    return (
        <div className="bireysel-workshop-container pt-24 pb-12 px-6">
            {/* SEO Meta Tags */}
            <Helmet>
                <title>Bireysel Değerlendirme Atölyesi | BİLSEM 2. Aşama Hazırlık</title>
                <meta name="description" content="BİLSEM bireysel değerlendirme sınavına hazırlık. 30+ interaktif simülatör ile zeka ölçeği testlerine hazırlan. Sözel, sayısal ve performans tabanlı değerlendirmeler." />
                <meta name="keywords" content="BİLSEM bireysel değerlendirme, 2. aşama hazırlık, zeka ölçeği, mülakat hazırlık, WISC-R, sözel zeka, sayısal zeka" />
                <link rel="canonical" href="https://bilsemc2.com/atolyeler/bireysel-degerlendirme" />

                {/* Open Graph */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Bireysel Değerlendirme Atölyesi | BİLSEM 2. Aşama" />
                <meta property="og:description" content="30+ simülatör ile BİLSEM bireysel değerlendirme sınavına hazırlan." />
                <meta property="og:url" content="https://bilsemc2.com/atolyeler/bireysel-degerlendirme" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Bireysel Değerlendirme | BİLSEM" />

                {/* Structured Data - Course Schema */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Course",
                        "name": "Bireysel Değerlendirme Atölyesi",
                        "description": "BİLSEM 2. aşama bireysel değerlendirme sınavına hazırlık. 30+ interaktif simülatör ile zeka ölçeği testlerine hazırlan.",
                        "provider": {
                            "@type": "EducationalOrganization",
                            "name": "BilsemC2",
                            "url": "https://bilsemc2.com"
                        },
                        "educationalLevel": "İlkokul - Ortaokul",
                        "inLanguage": "tr",
                        "isAccessibleForFree": false,
                        "audience": {
                            "@type": "EducationalAudience",
                            "educationalRole": "student",
                            "audienceType": "BİLSEM 2. aşama adayları"
                        },
                        "hasCourseInstance": {
                            "@type": "CourseInstance",
                            "courseMode": "online",
                            "courseWorkload": "PT90M"
                        },
                        "teaches": ["Sözel zeka", "Sayısal zeka", "İşlem hızı", "Çalışma belleği", "Görsel-uzamsal beceriler"]
                    })}
                </script>
            </Helmet>

            {/* Background Blobs */}
            <div className="bireysel-bg-blobs">
                <div className="bireysel-blob bireysel-blob-1" />
                <div className="bireysel-blob bireysel-blob-2" />
                <div className="bireysel-blob bireysel-blob-3" />
            </div>

            <div className="container mx-auto max-w-6xl relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <Link to="/atolyeler/genel-yetenek" className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors mb-4 uppercase text-xs tracking-widest">
                            <ChevronLeft size={16} /> Genel Yetenek Atölyesi
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-indigo-500/20 rounded-[1.5rem] text-indigo-400 border border-indigo-500/30">
                                <Brain size={48} />
                            </div>
                            <div>
                                <h1 className="text-4xl lg:text-6xl font-poppins font-black text-white leading-tight tracking-tight">
                                    Bireysel <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Değerlendirme</span>
                                </h1>
                                <p className="text-slate-400 font-bold mt-2 uppercase tracking-[0.2em] text-sm">2. Aşama Hazırlık Merkezi</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 flex items-center gap-8 shadow-2xl"
                    >
                        <div className="hidden md:block">
                            <div className="text-white font-black text-right text-xl">Zeka Ölçekleri</div>
                            <div className="text-indigo-400 text-sm font-bold uppercase tracking-widest text-right italic">TÜZÖ</div>
                        </div>
                        <div className="h-14 w-px bg-white/10 hidden md:block" />
                        <div className="flex -space-x-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 border-2 border-slate-950 flex items-center justify-center text-white text-sm font-black shadow-lg">
                                    {i}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Sınav Simülasyonu CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-12"
                >
                    <Link to="/atolyeler/sinav-simulasyonu">
                        <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-[2rem] p-6 sm:p-8 border-2 border-red-400/30 shadow-2xl shadow-red-500/20 hover:shadow-red-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer group overflow-hidden relative">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
                            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <TrendingUp size={40} className="text-white" />
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                                        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Sınav Simülasyonu</h3>
                                        <span className="px-3 py-1 bg-emerald-500/80 text-white text-xs font-black uppercase rounded-full">Beta</span>
                                        <div className="relative group/tooltip">
                                            <Info size={18} className="text-white/60 cursor-help hover:text-white transition-colors" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-white/20 shadow-xl">
                                                Hatalar olabilir. Lütfen ekran resmi alıp bildirin!
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-red-100 font-medium text-sm sm:text-base">
                                        Adaptif zorluk sistemiyle gerçek sınav deneyimini yaşa! Tüm modülleri tek seansta test et ve detaylı performans raporu al.
                                    </p>
                                </div>
                                <div className="shrink-0">
                                    <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                        <ChevronLeft size={28} className="text-white rotate-180" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </motion.div>

                {/* Modüller Listesi */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {modules.map((mod, i) => (
                        <motion.div
                            key={mod.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -10 }}
                            className="group relative"
                        >
                            {/* Special border for new games */}
                            {(mod as { isNew?: boolean }).isNew && (
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-[3.5rem] opacity-50" />
                            )}
                            <div className={`h-full bg-slate-900/90 backdrop-blur-xl rounded-[3.5rem] p-10 border transition-all duration-500 flex flex-col justify-between overflow-hidden relative shadow-2xl ${(mod as { isNew?: boolean }).isNew
                                ? 'border-emerald-500/30'
                                : 'border-white/10 hover:border-indigo-500/30'
                                }`}>
                                {/* Decorative Gradient */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />

                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-white/10 rounded-2xl flex items-center justify-center text-indigo-400 text-3xl group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-xl group-hover:scale-110">
                                            {mod.icon}
                                        </div>
                                        <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                                            {mod.difficulty}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-2xl font-black text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-violet-400 transition-all duration-300 tracking-tight">{mod.title}</h3>
                                            {(mod as { isNew?: boolean }).isNew && (
                                                <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black uppercase rounded-full animate-pulse mb-3">YENİ</span>
                                            )}
                                        </div>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed italic line-clamp-2">{mod.desc}</p>
                                        {/* TUZÖ Badge */}
                                        {mod.tuzo && (
                                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">TUZÖ</span>
                                                <span className="text-[10px] font-bold text-indigo-400">{mod.tuzo}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                                    <div className="text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group-hover:scale-105 transition-transform">
                                        <Zap size={14} fill="currentColor" className="animate-pulse" /> Simülatör Hazır
                                    </div>
                                    <Link
                                        to={mod.link}
                                        state={{ autoStart: true }}
                                        className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-700 text-white font-black text-sm rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/40 transition-all flex items-center gap-3 group/btn"
                                    >
                                        BAŞLAT <Rocket size={18} fill="currentColor" className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {/* Bilgi Kartı */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[3.5rem] p-12 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group border-4 border-white/10"
                    >
                        <div className="relative z-10 space-y-6">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                                💡
                            </div>
                            <h3 className="text-3xl font-black tracking-tight">Neden 2. Aşama?</h3>
                            <p className="text-base text-indigo-100 font-medium leading-relaxed">
                                Tablet sınavını geçen öğrenciler, bireysel değerlendirmede zekalarını çok yönlü (sözsel, sayısal, performans) ispat ederler. Buradaki modüller, o mülakat ortamındaki bilişsel baskıyı ve soru tiplerini simüle etmek için tasarlanmıştır.
                            </p>
                        </div>
                        <div className="mt-10 relative z-10">
                            <div className="flex items-center gap-3 text-indigo-200 text-sm font-black uppercase tracking-widest">
                                <Trophy size={20} className="text-yellow-400" /> Üstün Başarı Hedefi
                            </div>
                        </div>

                        {/* Arka Plan Dekoru */}
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default IndividualAssessmentPage;
