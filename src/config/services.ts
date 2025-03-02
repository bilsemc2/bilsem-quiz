export interface ServiceGroup {
    name: string;
    description: string;
    grade: string;
    type: 'bronze' | 'silver' | 'gold' | 'trial';
    features: string[];
    badge?: string;          // , , , 
    requiredLevel?: number;  // Seviye gereksinimleri
    requiredXP?: number;     // XP gereksinimleri
}

export const availableServices: ServiceGroup[] = [
    {
        name: 'Okul öncesi - Deneme Grubu',
        description: 'Basit sorulardan oluşur.',
        grade: 'preschool',
        type: 'trial',
        badge: '',
        requiredLevel: 1,
        requiredXP: 50000,
        features: [
            'Temel seviye sorular',
            'Sınırsız deneme hakkı',
            'Anlık geri bildirim'
        ]
    },
    {
        name: '1. Sınıf - Bronz Deneme Grubu',
        description: 'Hafta içi her gün bir deneme kodu paylaşılır.',
        grade: '1',
        type: 'bronze',
        badge: '',
        requiredLevel: 1,
        requiredXP: 100000,
        features: [
            'Günlük deneme kodları'
        ]
    },
    {
        name: '2. Sınıf - Bronz Deneme Grubu',
        description: 'Hafta içi her gün bir deneme kodu paylaşılır.',
        grade: '2',
        type: 'bronze',
        badge: '',
        requiredLevel: 2,
        requiredXP: 200000,
        features: [
            'Günlük deneme kodları'
        ]
    },
    {
        name: '3. Sınıf - Bronz Deneme Grubu',
        description: 'Hafta içi her gün bir deneme kodu paylaşılır.',
        grade: '3',
        type: 'bronze',
        badge: '',
        requiredLevel: 3,
        requiredXP: 300000,
        features: [
            'Günlük deneme kodları'
        ]
    },
    {
        name: '1. Sınıf - Gümüş Deneme Grubu',
        description: 'Hafta içi her gün bir deneme kodu paylaşılır. Haftada bir canlı ders verilir.',
        grade: '1',
        type: 'silver',
        badge: '',
        requiredLevel: 4,
        requiredXP: 400000,
        features: [
            'Günlük deneme kodları',
            'Haftalık canlı ders'
        ]
    },
    {
        name: '2. Sınıf - Gümüş Deneme Grubu',
        description: 'Hafta içi her gün bir deneme kodu paylaşılır. Haftada bir canlı ders verilir.',
        grade: '2',
        type: 'silver',
        badge: '',
        requiredLevel: 5,
        requiredXP: 500000,
        features: [
            'Günlük deneme kodları',
            'Haftalık canlı ders'
        ]
    },
    {
        name: '3. Sınıf - Gümüş Deneme Grubu',
        description: 'Hafta içi her gün bir deneme kodu paylaşılır. Haftada bir canlı ders verilir.',
        grade: '3',
        type: 'silver',
        badge: '',
        requiredLevel: 6,
        requiredXP: 600000,
        features: [
            'Günlük deneme kodları',
            'Haftalık canlı ders'
        ]
    },
    {
        name: '1. Sınıf - Altın Deneme Grubu',
        description: 'Hafta içi her gün bir deneme kodu paylaşılır. Haftada iki canlı ders verilir.',
        grade: '1',
        type: 'gold',
        badge: '',
        requiredLevel: 7,
        requiredXP: 700000,
        features: [
            'Günlük deneme kodları',
            'Haftada 2 canlı ders',
            'Birebir mentorluk',
            'Öncelikli destek'
        ]
    },
    {
        name: '2. Sınıf - Altın Deneme Grubu',
        description: 'Hafta içi her gün bir deneme kodu paylaşılır. Haftada iki canlı ders verilir.',
        grade: '2',
        type: 'gold',
        badge: '',
        requiredLevel: 8,
        requiredXP: 800000,
        features: [
            'Günlük deneme kodları',
            'Haftada 2 canlı ders',
            'Birebir mentorluk',
            'Öncelikli destek'
        ]
    },
    {
        name: '3. Sınıf - Altın Deneme Grubu',
        description: 'Hafta içi her gün bir deneme kodu paylaşılır. Haftada iki canlı ders verilir.',
        grade: '3',
        type: 'gold',
        badge: '',
        requiredLevel: 9,
        requiredXP: 900000,
        features: [
            'Günlük deneme kodları',
            'Haftada 2 canlı ders',
            'Birebir mentorluk',
            'Öncelikli destek'
        ]
    }
];
