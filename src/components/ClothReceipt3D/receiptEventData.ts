// ClothReceipt3D — Receipt event data and date-based event resolution

export interface ReceiptEvent {
    title: string;
    emoji: string;
    subtitle: string;
    items: { name: string; price: string }[];
    footer: string;
    accentColor: string;
    decorations: string[];
}

export function getTodayEvent(): ReceiptEvent {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const year = now.getFullYear();

    // Ramazan & Kurban Bayramı tarihleri (Hicri takvime göre her yıl ~11 gün kayar)
    const islamicHolidays: Record<number, { ramazan: [number, number, number, number]; kurban: [number, number, number, number] }> = {
        2025: { ramazan: [3, 30, 4, 1], kurban: [6, 6, 6, 9] },
        2026: { ramazan: [3, 20, 3, 22], kurban: [5, 27, 5, 30] },
        2027: { ramazan: [3, 9, 3, 11], kurban: [5, 16, 5, 18] },
        2028: { ramazan: [2, 27, 2, 29], kurban: [5, 4, 5, 6] },
    };

    const holidays = islamicHolidays[year];
    if (holidays) {
        const inRange = (m: number, d: number, m1: number, d1: number, m2: number, d2: number) => {
            if (m1 === m2) return m === m1 && d >= d1 && d <= d2;
            if (m === m1) return d >= d1;
            if (m === m2) return d <= d2;
            return m > m1 && m < m2;
        };

        const [rM1, rD1, rM2, rD2] = holidays.ramazan;
        if (inRange(month, day, rM1, rD1, rM2, rD2)) {
            return {
                title: 'RAMAZAN BAYRAMI',
                emoji: '🌙',
                subtitle: 'Bayramınız Mübarek Olsun!',
                accentColor: '#059669',
                items: [],
                footer: 'Huzur, sevgi ve bereket dolu bir bayram!',
                decorations: ['🌙', '⭐', '🕌', '✨', '🤲', '💚', '🌟', '🌙'],
            };
        }
        const [kM1, kD1, kM2, kD2] = holidays.kurban;
        if (inRange(month, day, kM1, kD1, kM2, kD2)) {
            return {
                title: 'KURBAN BAYRAMI',
                emoji: '🌙',
                subtitle: 'Bayramınız Mübarek Olsun!',
                accentColor: '#0d9488',
                items: [],
                footer: 'Paylaşmanın ve birliğin bayramı!',
                decorations: ['🌙', '⭐', '🕌', '✨', '🤲', '💙', '🌟', '🌙'],
            };
        }
    }

    if (month === 3 && day === 8) {
        return {
            title: '8 MART',
            emoji: '💜',
            subtitle: 'Dünya Kadınlar Günü',
            accentColor: '#9333ea',
            items: [],
            footer: 'Kadınlar her yerde, her zaman güçlü! 💪',
            decorations: ['💜', '🌸', '💐', '💐', '💕', '🦋', '✨', '🌺'],
        };
    }

    if (month === 4 && day === 23) {
        return {
            title: '23 NİSAN',
            emoji: '🇹🇷',
            subtitle: 'Çocuk Bayramı Kutlu Olsun!',
            accentColor: '#dc2626',
            items: [],
            footer: 'Egemenlik kayıtsız şartsız milletindir!',
            decorations: ['🎈', '🎉', '🎊', '🎀', '🎵', '🎀', '⭐', '🎵'],
        };
    }

    if (month === 5 && day === 19) {
        return {
            title: '19 MAYIS',
            emoji: '🇹🇷',
            subtitle: 'Gençlik ve Spor Bayramı',
            accentColor: '#dc2626',
            items: [],
            footer: 'Gençliğe hitabe ile ilham al!',
            decorations: ['🔥', '⚡', '💪', '🏅', '🚀', '🌟', '🚀', '🏅'],
        };
    }

    if (month === 7 && day === 15) {
        return {
            title: '15 TEMMUZ',
            emoji: '🇹🇷',
            subtitle: 'Demokrasi ve Milli Birlik Günü',
            accentColor: '#dc2626',
            items: [],
            footer: 'Milletin iradesine saygı!',
            decorations: ['🇹🇷', '✊', '🏛️', '⭐', '🔥', '🇹🇷', '✨', '🏛️'],
        };
    }

    if (month === 8 && day === 30) {
        return {
            title: '30 AĞUSTOS',
            emoji: '🇹🇷',
            subtitle: 'Zafer Bayramı Kutlu Olsun!',
            accentColor: '#dc2626',
            items: [],
            footer: 'Ordular, ilk hedefiniz Akdenizdir, ileri!',
            decorations: ['🇹🇷', '⚔️', '🏅', '🦅', '🔥', '⭐', '✨', '🎖️'],
        };
    }

    if (month === 10 && day === 29) {
        return {
            title: '29 EKİM',
            emoji: '🇹🇷',
            subtitle: 'Cumhuriyet Bayramı Kutlu Olsun!',
            accentColor: '#dc2626',
            items: [],
            footer: 'Cumhuriyet ilelebet payidar kalacaktır!',
            decorations: ['🇹🇷', '⭐', '🏛️', '🎉', '🎊', '🕊️', '🔥', '✨'],
        };
    }

    if (month === 11 && day === 10) {
        return {
            title: '10 KASIM',
            emoji: '🖤',
            subtitle: "Atatürk'ü Anıyoruz",
            accentColor: '#1a1a2e',
            items: [],
            footer: 'Hayatta en hakiki mürşit ilimdir.',
            decorations: ['🖤', '📚', '🕯️', '🌹', '🎓', '✨'],
        };
    }

    if (month === 1 && day === 1) {
        return {
            title: 'YENİ YIL',
            emoji: '🎉',
            subtitle: 'Mutlu Yıllar!',
            accentColor: '#f59e0b',
            items: [],
            footer: 'Yeni yılınız kutlu olsun! 🎊',
            decorations: ['🎉', '🎊', '🥂', '🎆', '🎇', '✨', '🌟', '🎁'],
        };
    }

    if (month === 2 && day === 14) {
        return {
            title: 'SEVGİLİLER GÜNÜ',
            emoji: '❤️',
            subtitle: '14 Şubat',
            accentColor: '#e11d48',
            items: [],
            footer: 'Sevgi her şeyin başıdır! 💕',
            decorations: ['❤️', '💕', '💝', '💗', '🌹', '💐', '😍', '✨'],
        };
    }

    // Varsayılan — BilsemC2 tanıtım fişi
    return {
        title: 'BİLSEMC2',
        emoji: '🧠',
        subtitle: 'Çocuğunuzun Geleceği ile Oynayın',
        accentColor: '#7e30e1',
        items: [
            { name: 'Zeka Oyunları', price: '57+' },
            { name: 'Sınav Simülasyonu', price: '25 mod' },
            { name: 'Müzik Atölyesi', price: '🎵' },
            { name: 'Resim Atölyesi', price: '🎨' },
            { name: 'Genel Yetenek', price: '💡' },
        ],
        footer: 'bilsemc2.com • Beynini Kullan!',
        decorations: ['🧠', '⭐', '🎮', '💡', '🚀', '✨', '🎯', '🏆'],
    };
}