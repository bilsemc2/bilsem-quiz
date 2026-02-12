export interface FaqItem {
  category: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    category: 'Genel',
    question: 'BilsemC2 nedir?',
    answer:
      'Bilsem sinav surecine yonelik dijital calisma platformudur. Oyunlar, soru setleri ve atolyeler ile beceri gelisimini destekler.',
  },
  {
    category: 'Genel',
    question: 'Icerikler sinav formatina uygun mu?',
    answer:
      'Icerikler Bilsem benzeri dikkat, muhakeme, hafiza ve gorsel analiz becerilerine gore kural tabanli olarak hazirlanir.',
  },
  {
    category: 'XP ve Ekonomi',
    question: 'XP sistemi nasil calisir?',
    answer:
      'Platformdaki etkinlikler XP tuketir veya kazandirir. Ogrencinin sureci takip etmesi ve duzenli calismasi icin bir ilerleme metrik olarak kullanilir.',
  },
  {
    category: 'XP ve Ekonomi',
    question: 'Promo kodlar nasil kullanilir?',
    answer:
      'Profil alanindaki ilgili bolumden tek kullanimlik kodlar girilerek hesaba XP tanimlanir.',
  },
  {
    category: 'Paketler',
    question: 'Profesyonel plan neleri kapsar?',
    answer:
      'Genis icerik erisimi, atolyeler, takip ekranlari ve premium moduller dahil kapsamli kullanim sunar.',
  },
  {
    category: 'Paketler',
    question: 'Satin alma sureci nasil ilerler?',
    answer:
      'Paket secimi ve aktivasyon sureci iletisim kanali uzerinden yonetilir, hesap tanimlamasi tamamlandiginda erisim acilir.',
  },
  {
    category: 'Atolyeler',
    question: 'Hangi atolyeler var?',
    answer:
      'Resim, muzik ve bireysel degerlendirme odakli atolyeler bulunur. Her atolye farkli yetenek alanina hitap eder.',
  },
  {
    category: 'Teknik',
    question: 'Ilerleme kaydediliyor mu?',
    answer:
      'Evet. Hesap oturumu acik oldugunda oyun ve calisma ilerlemeleri veritabanina kaydedilir.',
  },
  {
    category: 'Destek',
    question: 'Destek ekibine nasil ulasabilirim?',
    answer:
      'Iletisim kanallarindan veya platform uzerindeki yonlendirmelerle destek talebi olusturabilirsiniz.',
  },
];
