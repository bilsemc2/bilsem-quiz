# Bilsem Quiz Story Veritabanı Entegrasyonu

Bu proje, hikaye ve quiz veritabanı entegrasyonu içermektedir. Hikayelerin ve ilgili soruların Supabase veritabanına kaydedilmesi sağlanmıştır.

## Veritabanı Tabloları

### Story Tablosu

```sql
create table public.story (
  id uuid not null default extensions.uuid_generate_v4 (),
  title character varying(255) not null,
  content text not null,
  image_path text null,
  theme character varying(100) not null,
  age_range character varying(50) not null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  created_by uuid null,
  constraint story_pkey primary key (id),
  constraint story_created_by_fkey foreign KEY (created_by) references profiles (id)
) TABLESPACE pg_default;

create index IF not exists idx_story_theme on public.story using btree (theme) TABLESPACE pg_default;
create index IF not exists idx_story_age_range on public.story using btree (age_range) TABLESPACE pg_default;
create index IF not exists idx_story_is_active on public.story using btree (is_active) TABLESPACE pg_default;
```

### Story Questions Tablosu

```sql
create table public.story_questions (
  id uuid not null default extensions.uuid_generate_v4 (),
  story_id uuid null,
  question_text text not null,
  options jsonb not null,
  correct_option character varying(255) not null,
  difficulty_level character varying(20) null default 'normal'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint story_questions_pkey primary key (id),
  constraint story_questions_story_id_fkey foreign KEY (story_id) references story (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_story_questions_story_id on public.story_questions using btree (story_id) TABLESPACE pg_default;
```

## Entegrasyon Açıklaması

Hikaye oluşturma işlemleri artık hem yerel depolamada (localStorage) hem de Supabase veritabanında saklanmaktadır. Bu şekilde:

1. **Yedeklilik**: Ağ bağlantısı olmadığında bile hikayeler kullanıcının tarayıcısında saklanır
2. **Veri Kalıcılığı**: Hikayelerin veritabanında kalıcı olarak saklanması sağlanır
3. **Kullanıcı Ayırımı**: Hikayeler, kullanıcı kimliği ile ilişkilendirilir (oturum açılmışsa)

## Teknik Detaylar

- **LocalStorage Anahtarı**: `local_stories`
- **Varsayılan Yaş Aralığı**: 7-12
- **Hata Yönetimi**: Veritabanı kaydı başarısız olursa, localStorage'a düşülür
- **Soru Kaydı**: Hikaye kaydından sonra ilgili sorular toplu şekilde eklenir
- **Zorluk Seviyesi**: Varsayılan olarak 'normal' atanmaktadır
- **Doğru Cevap Formatı**: Sorular için doğru cevap, indeks yerine tam metin olarak saklanır

## Kurulum

Supabase veritabanını kurmak için:

1. Supabase hesabı oluşturun
2. Yeni bir proje oluşturun
3. Yukarıdaki SQL tablolarını Supabase SQL Editörü'nde çalıştırın
4. Projeye Supabase URL ve ANON KEY bilgilerini `.env` dosyasına ekleyin:

```
VITE_SUPABASE_URL=xxx
VITE_SUPABASE_ANON_KEY=xxx
```
