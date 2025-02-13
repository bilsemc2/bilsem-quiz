interface ReadingText {
    id: string;
    title: string;
    content: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number; // seconds
    questions: {
        question: string;
        options: string[];
        correctAnswer: number;
    }[];
}

export const READING_TEXTS: ReadingText[] = [
    {
        id: '1',
        title: 'Yapay Zeka ve Gelecek',
        content: `Yapay zeka, günümüzde hayatımızın her alanında karşımıza çıkan bir teknoloji haline geldi. 
        Akıllı telefonlardan otomobillere, sağlık hizmetlerinden eğitime kadar pek çok alanda yapay zeka 
        uygulamalarını görmek mümkün. Bu teknolojinin gelişimi, insanlığın geleceğini şekillendirme 
        potansiyeline sahip. Yapay zekanın en önemli özelliklerinden biri, öğrenme yeteneğidir. 
        Makine öğrenmesi sayesinde, sistemler deneyimlerinden ders çıkarabilir ve performanslarını 
        sürekli olarak iyileştirebilir.`,
        difficulty: 'beginner',
        estimatedTime: 30,
        questions: [
            {
                question: 'Yapay zekanın en önemli özelliği nedir?',
                options: [
                    'Hız',
                    'Öğrenme yeteneği',
                    'Bellek kapasitesi',
                    'Enerji tüketimi'
                ],
                correctAnswer: 1
            }
        ]
    },
    {
        id: '2',
        title: 'Kuantum Bilgisayarlar',
        content: `Kuantum bilgisayarlar, klasik bilgisayarlardan tamamen farklı bir paradigma üzerine 
        inşa edilmiştir. Bu bilgisayarlar, kuantum mekaniğinin temel prensiplerini kullanarak çalışır. 
        Süperpozisyon ve dolanıklık gibi kuantum özellikleri sayesinde, belirli problemleri klasik 
        bilgisayarlara göre çok daha hızlı çözebilirler. Örneğin, büyük sayıları çarpanlara ayırma 
        işlemi, klasik bilgisayarlar için oldukça zor bir problem iken, kuantum bilgisayarlar bu işlemi 
        çok daha kısa sürede gerçekleştirebilir.`,
        difficulty: 'intermediate',
        estimatedTime: 45,
        questions: [
            {
                question: 'Kuantum bilgisayarların avantajı nedir?',
                options: [
                    'Daha ucuz olmaları',
                    'Daha küçük olmaları',
                    'Belirli problemleri daha hızlı çözmeleri',
                    'Daha az enerji tüketmeleri'
                ],
                correctAnswer: 2
            }
        ]
    },
    {
        id: '3',
        title: 'Beyin ve Öğrenme',
        content: `İnsan beyni, yaklaşık 86 milyar nörondan oluşan karmaşık bir yapıdır. Her nöron, 
        diğer nöronlarla binlerce bağlantı kurabilir ve bu bağlantılar sürekli olarak değişebilir. 
        Bu değişim, öğrenmenin temelini oluşturur. Nöroplastisite olarak adlandırılan bu özellik, 
        beynin yaşam boyu öğrenme ve adapte olma yeteneğini sağlar. Yeni bir beceri öğrenirken, 
        beynimizdeki nöronlar arasında yeni bağlantılar oluşur ve var olan bağlantılar güçlenir. 
        Bu süreç, düzenli pratik ve tekrar ile desteklendiğinde daha etkili hale gelir.`,
        difficulty: 'advanced',
        estimatedTime: 60,
        questions: [
            {
                question: 'Nöroplastisite nedir?',
                options: [
                    'Beynin büyüme hızı',
                    'Beynin öğrenme ve adapte olma yeteneği',
                    'Nöronların sayısı',
                    'Beynin enerji tüketimi'
                ],
                correctAnswer: 1
            }
        ]
    }
];
