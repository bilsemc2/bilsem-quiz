export interface AboutExperience {
  title: string;
  detail: string;
}

export interface AboutMethodItem {
  title: string;
  detail: string;
}

export const ABOUT_PROFILE = {
  name: 'Ersan Icoz',
  title: '10 Yillik Tecrubeli Egitimci',
  intro:
    'BilsemC2 sureci, kendi cocugu icin Bilsem hazirligi yapan bir velinin sahadaki ihtiyaclari birebir gormesiyle basladi. Uretilen icerikler sinav odakli, duzenli ve takip edilebilir bir sistem hedefiyle gelistirildi.',
};

export const ABOUT_EXPERIENCES: AboutExperience[] = [
  {
    title: 'Eski Bankaci',
    detail: 'Kurumsal disiplin, surec yonetimi ve veri odakli takip aliskanligi.',
  },
  {
    title: '2015 MV Adayi',
    detail: 'Kamu iletisim tecrubesi ve sosyal etki odakli saha deneyimi.',
  },
  {
    title: 'Bilsem Velisi',
    detail: 'Bilsem surecinin ogrenci ve aile tarafindaki gercek dinamiklerini bilme.',
  },
  {
    title: 'Icerik Ureticisi',
    detail: 'Algoritmik kurallarla olcelebilir egitsel icerik tasarimi.',
  },
];

export const ABOUT_METHOD_ITEMS: AboutMethodItem[] = [
  {
    title: 'Yapay Zeka Destekli Icerik',
    detail:
      'Soru mantigi once kural tabanli olarak tasarlanir, sonra yapay zeka ile olceklendirilebilir setlere donusturulur.',
  },
  {
    title: 'Gorsel ve Mantiksal Gelisim',
    detail:
      'Ezber yerine dikkat, gorsel bellek, problem cozme ve muhakeme becerilerini arttiran alistirmalara odaklanilir.',
  },
  {
    title: 'Sinav Simulasyonu',
    detail:
      'Bilsem benzeri sure ve zorluk katmanlariyla ogrencinin performansi duzenli araliklarla olculur.',
  },
];
