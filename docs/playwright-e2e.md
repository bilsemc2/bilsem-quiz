# Playwright E2E

Bu repo icin Playwright tabanli browser smoke katmani vardir. Amac, kritik route ve auth davranislarini gercek tarayici seviyesinde kirmaya karsi korumaktir.

## Suite ayrimi

### 1. Anonim browser smoke

Komut: `npm run test:e2e:anon`

Dogruladigi davranislar:

- `/login` sayfasi render olur
- `Sifremi Unuttum` modal acma, validasyon ve basari geri bildirimi calisir
- `signup` gecisi ve referral prefill davranisi korunur
- public workshop landing route'lari acik kalir
- eski `/atolyeler/muzik` yolu yeni rota'ya yonlenir
- korumali `games`, `profile` ve `sinav-simulasyonu` route'lari login'e redirect eder

Bu suite tamamen public davranis uzerinden calisir; secret veya test kullanicisi gerekmez.

### 2. Authenticated browser smoke

Komut: `npm run test:e2e:auth`

Dogruladigi davranislar:

- korumali route -> login -> hedef route'a geri donus
- `/profile` erisimi
- navbar logout davranisi
- oturumlu kullanicinin `login/signup` sayfalarindan geri yonlendirilmesi
- genel yetenek fixture'i icin sinav simulasyonu erisimi
- muzik fixture'i icin muzik atolyesi erisimi

Bu suite iki farkli modda calisabilir:

#### Mock-auth modu

Varsayilan fallback budur. `E2E_AUTH_EMAIL` ve `E2E_AUTH_PASSWORD` verilmezse veya `E2E_USE_MOCK_AUTH=1` acik ise authenticated suite built-in mock auth ile yine kosar.

Bu modun amaci:

- browser seviyesinde auth guard ve route wiring'ini secretsiz dogrulamak
- CI'da auth smoke adimini her zaman calistirabilmek
- logout, profile ve guest-only auth route davranisini hizli sekilde kilitlemek

Bu modun siniri:

- gercek Supabase session olusturmaz
- gercek backend permission, seed data veya auth provider davranisini ispatlamaz
- sadece uygulamanin browser tarafindaki auth kontratini dogrular

#### Gercek backend auth modu

`E2E_AUTH_EMAIL` ve `E2E_AUTH_PASSWORD` verildiginde authenticated suite gercek login akisi ile calisir.

Istege bagli fixture bayraklari:

- `E2E_EXPECT_GENERAL_TALENT=1`
- `E2E_EXPECT_MUSIC_TALENT=1`
- `E2E_EXPECT_PROFILE_NAME="Ada Lovelace"`
- `E2E_EXPECT_PROFILE_REFERRAL_CODE="ARKADAS123"`

Bu modun amaci:

- gercek auth provider entegrasyonunu dogrulamak
- seeded kullanici bazli talent access davranisini kontrol etmek
- seeded account identity ve referral verisinin UI'a geldiginin minimum smoke seviyesinde gorulmesi
- mock smoke'un otesinde, canli backend ile minimum guven sinyali saglamak

Bu modun siniri:

- kapsam halen smoke seviyesindedir
- her backend edge case'ini veya tum veri varyasyonlarini kapsamaz

## Komutlar

- `npm run test:e2e:install`
- `npm run test:e2e:anon`
- `npm run test:e2e:auth`
- `npm run test:e2e:auth:mock`
- `npm run test:e2e:auth:real`
- `npm run test:e2e:ci:validate`
- `npm run test:e2e:list`
- `npm run test:e2e:smoke`
- `npm run test:e2e`

`npm run test:e2e:smoke` davranisi:

- her zaman anonim suite'i kosar
- auth suite'i de her zaman kosar
- gercek credentials varsa gercek backend auth kullanir
- credentials yoksa built-in mock auth ile devam eder

`npm run test:e2e:auth` yarim auth secret konfigurasyonunu sessizce skip etmez; `E2E_AUTH_EMAIL` veya `E2E_AUTH_PASSWORD` tek basina verilirse komut fail eder.
`npm run test:e2e:auth:mock` built-in mock auth'i zorlar ve deterministic browser auth baseline'i verir.
`npm run test:e2e:auth:real` ise built-in mock fallback'i tamamen kapatip sadece gercek backend auth ile kosar.
`npm run test:e2e:ci:validate` ise CI secret kombinasyonlarini browser testlerinden once dogrular.
Talent expectation flag'leri yalnizca bos veya `1` olabilir; `true`, `yes` gibi degerler preflight tarafinda fail edilir.

## Test dosyalari

- `tests/e2e/critical-routes.spec.ts`
- `tests/e2e/authenticated-routes.spec.ts`

Her iki durumda da Playwright global setup tek sefer login olur ve `.playwright/.auth/user.json` storage state uretir.

## CI davranisi

CI tarafinda uc browser adimi vardir:

- anonim browser smoke her zaman kosar
- authenticated mock baseline da her zaman kosar
- gercek auth secret'lari tam ise ek olarak strict real-auth smoke da kosar

Authenticated mock baseline adimi:

- secretsiz, deterministic mock-auth ile calisir
- route/auth wiring kiriklarini backend bagimsiz dogrular
- `npm run test:e2e:auth:mock` ile ayni davranisi uygular

Strict real-auth adimi:

- sadece `E2E_AUTH_EMAIL` ve `E2E_AUTH_PASSWORD` birlikte varsa kosar
- built-in mock fallback'i kabul etmez
- `E2E_EXPECT_PROFILE_NAME` ve `E2E_EXPECT_PROFILE_REFERRAL_CODE` verilirse seeded profil kimligi de ekstra dogrulanir
- `npm run test:e2e:auth:real` ile ayni davranisi uygular

CI preflight adimi:

- yarim `E2E_AUTH_*` secret konfigurasyonunu fail eder
- real-auth olmadan kalan talent/profile expectation secret'larini fail eder
- talent expectation flag'lerinde `1` disi degerleri fail eder
- CI loguna ve job summary'ye aktif auth modunu yazar
- `npm run test:e2e:ci:validate` ile ayni davranisi uygular

Bu ayrim kasitlidir. Mock-auth baseline, route/auth wiring kiriklarini erken yakalamak icindir. Gercek secret'li kosu ise auth entegrasyonunu ayrica dogrulayan daha guclu sinyaldir.

Playwright adimlari fail olursa `playwright-report` ve `test-results` artifact olarak saklanir.

## Secret ve env adlari

- `E2E_AUTH_EMAIL`
- `E2E_AUTH_PASSWORD`
- `E2E_EXPECT_GENERAL_TALENT`
- `E2E_EXPECT_MUSIC_TALENT`
- `E2E_EXPECT_PROFILE_NAME`
- `E2E_EXPECT_PROFILE_REFERRAL_CODE`
- `E2E_USE_MOCK_AUTH=1`
- `VITE_E2E_MOCK_AUTH=1`

`E2E_USE_MOCK_AUTH=1` test orchestrator seviyesinde auth suite'i mock moda zorlar.
`VITE_E2E_MOCK_AUTH=1` ise uygulama icinde mock auth session fallback'ini aktif eder.

## Notlar

- Varsayilan base URL: `http://127.0.0.1:4173`
- Playwright config dev server'i otomatik ayaga kaldirir
- `PLAYWRIGHT_NO_WEBSERVER=1` ile mevcut bir sunucuya baglanabilir veya sadece test kesfini dogrulayabilirsiniz
- `critical-routes.spec.ts` anonim project ile kosar
- `authenticated-routes.spec.ts` auth storage state project'i ile kosar
