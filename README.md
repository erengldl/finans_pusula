# Finans Pusula

Türkçe, mobil uyumlu finans hesaplama uygulaması. Kredi, birikim, yatırım ve enflasyon etkisini sade ekranlarla gösterir; kaynak ve metodolojiyi açık tutar.

## Canlı Demo

- Production deployment Vercel üzerinde çalışır.
- Canonical/base URL `NEXT_PUBLIC_SITE_URL` ile belirlenir.
- Kredi tarafında Upstash Redis bağlı değilse uygulama read-only seed snapshot ile açılır ve bunu UI içinde açıkça belirtir.

## Ekran Görüntüleri

Önerilen ekranlar:

- Ana sayfa
- Kredi hesaplayıcı
- Birikim / yatırım hesaplayıcısı
- Aylık yol haritası ve PDF çıktı

İstersen bu görselleri `docs/screenshots/` altında tutabilirsin.

## Özellikler

- Bileşik faiz, basit faiz, yatırım getirisi ve kredi hesaplayıcıları
- Düzenli plan ve hedefe ulaşma modu
- Katkı zamanlaması seçimi
- Şubat / Temmuz artış modeli
- Enflasyon etkisini bugünün parasıyla gösterme
- Kredi için nominal ödeme, nominal toplam maliyet ve bugünkü değer karşılaştırması
- Ay bazlı yol haritası ve PDF checklist
- TCMB EVDS ve banka partner feed entegrasyonları
- Upstash Redis tabanlı production storage
- Vercel Analytics ile gizlilik dostu event tracking
- SEO, canonical, Open Graph, Twitter card, sitemap, robots ve manifest desteği

## Mimari

- `src/lib/finance.ts`: finans motoru ve limitler
- `src/lib/validation.ts`: Zod şemaları
- `src/lib/server/loan-market-store.ts`: snapshot akışı ve refresh mantığı
- `src/lib/server/loan-market-storage.ts`: memory / Redis / read-only seed adapter seçimi
- `src/app/`: App Router sayfaları, metadata ve özel route dosyaları
- `src/components/`: hesaplayıcılar, paneller ve ortak UI bileşenleri

## Ortam Değişkenleri

`.env.example` içindeki temel alanlar:

- `NEXT_PUBLIC_SITE_URL`
- `TCMB_EVDS_API_KEY`
- `TCMB_EVDS_SERIES_ENDPOINT_TEMPLATE`
- `TCMB_EVDS_SERIES_PERSONAL`
- `TCMB_EVDS_SERIES_PERSONAL_FIELD`
- `TCMB_EVDS_SERIES_VEHICLE`
- `TCMB_EVDS_SERIES_VEHICLE_FIELD`
- `TCMB_EVDS_SERIES_MORTGAGE`
- `TCMB_EVDS_SERIES_MORTGAGE_FIELD`
- `LOAN_MARKET_AUTO_REFRESH`
- `LOAN_MARKET_REFRESH_HOURS`
- `LOAN_MARKET_REFRESH_TOKEN`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `LOAN_BANK_FEED_<BANKA>_URL`
- `LOAN_BANK_FEED_<BANKA>_TOKEN`

Production ortamında `UPSTASH_REDIS_REST_URL` ve `UPSTASH_REDIS_REST_TOKEN` yoksa uygulama kalıcı storage yerine read-only seed snapshot kullanır.

## Geliştirme

Gereksinim:

- Node.js 20.9+

Kurulum ve geliştirme:

```bash
npm ci
npm run dev
```

Varsayılan adres:

```bash
http://localhost:3000
```

## Doğrulama

Çalıştırılacak komutlar:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Test kapsamı:

- Vitest: efektif yıllık oran dönüşümü, katkı timing'i, Şubat / Temmuz artışları, yıl geçişi, limitler, hedefe ulaşamama nedenleri, kredi taksit yuvarlama ve bugünkü değer
- Playwright: ana sayfa, dört route, kredi tipi değişimi, validation hataları, ödeme planı, PDF indirme, doğrudan route açılışı, mobil yatay taşma ve API fallback

## Deployment

- Uygulama Vercel üzerinde Node.js runtime ile deploy edilir.
- `@upstash/redis` Marketplace entegrasyonu production storage için tercih edilir.
- `@vercel/analytics` client tarafında hafif event tracking için kullanılır.
- `manifest.webmanifest`, `robots.txt`, `sitemap.xml` ve Open Graph image App Router özel dosyaları üzerinden üretilir.

## Sınırlamalar

- Bu uygulama finansal tavsiye vermez.
- Kredi oranları, masraflar ve banka teklifleri yalnızca karşılaştırma amaçlıdır.
- Upstash Redis bağlantısı yoksa production ortamında kalıcı snapshot saklanmaz; uygulama seed snapshot ile çalışır.
- Banka partner feed'leri tanımlı değilse ilgili kartlar link-out snapshot olarak gösterilir.
- Enflasyon ve getiri varsayımları kullanıcı girdisine veya referans veri setine dayanır.
