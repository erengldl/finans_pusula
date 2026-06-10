# Finansal Hesaplama Araçları

Modern, sade ve mobil uyumlu bir finansal hesaplama sitesi. V1 kapsamı; kullanıcının siteye girip 30 saniye içinde bir finansal hesaplama yapmasını, sonucu büyük kartlar ve sade grafiklerle anlamasını hedefler.

## Proje Amacı

Bu proje karmaşık bir finans uygulaması değildir. Üyelik, portföy takibi veya AI danışmanlığı içermez. Odağı hızlı, anlaşılır ve güven veren hesaplama deneyimidir. Kredi tarafında opsiyonel TCMB EVDS referans akışı ve banka partner feed katmanı desteklenir.

## Modüller

- Bileşik Faiz Hesaplama
- Basit Faiz Hesaplama
- Yatırım Getirisi Hesaplama
- Kredi Hesaplama

Tüm yatırım, faiz ve birikim modüllerinde iki mod vardır:

- Düzenli Birikim / Düzenli Yatırım
- Birikim Hedefi: hedef tutarı bugünün alım gücüyle kabul eder ve aylık birikim temposuna göre hedefe ulaşma süresini hesaplar.

Kredi modülü şu tipleri destekler:

- İhtiyaç Kredisi
- Taşıt Kredisi
- Konut Kredisi

## Özellikler

- Türkçe arayüz
- TL ve yüzde odaklı input yapısı
- Opsiyonel enflasyon etkisi
- Enflasyon aktifken hedef tutarın gelecekteki nominal karşılığını büyütme
- Takvim ayına bağlı aylık birikim artışı:
  - Artış yok
  - Yılda 1 kez Şubat ayında artış
  - Yılda 2 kez Şubat ve Temmuz aylarında artış
- Sonuç kartları
- Recharts ile sade grafikler
- Ay bazlı "Aylık Birikim Yol Haritası"
- Yazdırılabilir PDF birikim checklist'i
- Kredi ödeme planı tablosu
- TCMB EVDS ile opsiyonel referans kredi oranı yenileme
- Banka bazlı partner feed adapter katmanı
- Otomatik kredi snapshot yenileme ve kalıcı JSON depo
- Mobile-first responsive tasarım
- TypeScript tabanlı finans hesaplama motoru
- Zod validation ve React Hook Form
- @react-pdf/renderer ile gerçek PDF çıktısı

## Teknik Yapı

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui tarzı lokal component yapısı
- Recharts
- React Hook Form
- Zod

Önemli dosyalar:

- `src/lib/finance.ts`: Finansal hesaplama fonksiyonları
- `src/lib/validation.ts`: Form validation şemaları
- `src/components/calculators/GrowthCalculator.tsx`: Faiz/yatırım hesaplayıcıları
- `src/components/calculators/LoanCalculator.tsx`: Kredi hesaplayıcı
- `src/components/MonthlyRoadmap.tsx`: Ay bazlı birikim yol haritası
- `src/components/SavingsChecklistPdf.tsx`: A4 yazdırılabilir PDF checklist üretimi
- `src/components/`: Ortak layout, input, chart ve tablo componentleri

## Nasıl Çalıştırılır?

Minimum gereksinim:

- Node.js 20.9+

```bash
npm install
npm run dev
```

Varsayılan adres:

```bash
http://localhost:3000
```

Port doluysa Next.js farklı bir port önerebilir.

## Canlı Kredi Verisi

Kredi ekranı seed snapshot ile açılır. Aşağıdaki opsiyonel env alanları tanımlandığında uygulama kredi tarafında otomatik güncelleme yapar:

- `TCMB_EVDS_API_KEY`
- `TCMB_EVDS_SERIES_PERSONAL`
- `TCMB_EVDS_SERIES_VEHICLE`
- `TCMB_EVDS_SERIES_MORTGAGE`
- `LOAN_MARKET_AUTO_REFRESH`
- `LOAN_MARKET_REFRESH_HOURS`
- `LOAN_BANK_FEED_<BANKA>_URL`

Örnek tüm değişkenler için `.env.example` dosyasına bak.

Sunucu route'ları:

- `GET /api/reference/loan-market`: güncel kredi snapshot'ını döner, gerekiyorsa otomatik yeniler.
- `POST /api/reference/loan-market/refresh`: `x-finans-pusula-refresh-token` başlığı ile zorunlu yenileme yapar.

## GitHub ve Deploy

GitHub'a ilk yayın için tipik akış:

```bash
git init
git add .
git commit -m "Initial commit"
```

Sonrasında ya GitHub üzerinde boş repo açıp `origin` remote'u ekleyebilir, ya da `gh` CLI kullanıyorsan `gh repo create` ile push edebilirsin.

Deploy notları:

- Bu proje static export için uygun değildir; App Router API route'ları ve `nodejs` runtime kullandığı için Vercel veya başka bir Node.js host üzerinde çalıştırılmalıdır.
- Canlı kredi yenilemesi için `.env.example` içindeki opsiyonel değişkenleri deploy platformunda tanımlaman gerekir.
- Read-only dosya sistemi kullanan serverless ortamlarda yenilenen kredi snapshot'ı kalıcı diske yazılamaz. Uygulama bu durumda yanıtı üretmeye devam eder ve veriyi aktif instance belleğinde tutar.
- Kalıcı ve paylaşılan kredi snapshot saklama ihtiyacı varsa bu `data/` dosyası yerine veritabanı, blob storage veya KV store kullanılmalıdır.

## Doğrulama

```bash
npm run lint
npm run build
```

Manuel test senaryoları:

- Ana sayfadan 4 hesaplama modülüne gidilebilmeli.
- Bileşik faiz modülünde düzenli birikim hesaplanabilmeli.
- Birikim hedefi modunda kullanıcı aylık birikim girip hedefe kaç ay/yılda ulaşacağını görebilmeli.
- Enflasyon aktifken hedef tutar bugünün parasıyla kabul edilmeli ve gelecekteki nominal hedef büyümeli.
- Aylık birikim artışı başlangıç ayına göre takvim bazlı çalışmalı; ilk ayda otomatik zam uygulanmamalı.
- Aylık Birikim Yol Haritası açıldığında ay ay plan satırları görülebilmeli.
- PDF Checklist İndir butonu gerçek PDF dosyası indirmeli.
- Enflasyon checkbox'ı açıldığında bugünün parasıyla değer gösterilmeli.
- Kredi modülünde kredi tipi değiştirilebilmeli.
- Ödeme planı açılıp ay bazında kalan borç görülebilmeli.
- Mobil ekranda sayfa seviyesinde yatay taşma olmamalı.

## Varsayımlar ve Sınırlar

- Hesaplamalar tahminidir ve finansal tavsiye değildir.
- Enflasyon oranı kullanıcı tarafından girilir.
- Yatırım getirisi, kullanıcının girdiği yıllık tahmini kâr oranına dayanır.
- Kredi faiz oranı aylık girilir.
- EVDS serileri ve banka feed'leri tanımlı değilse kredi tarafı seed snapshot ile çalışır.
- Gerçek banka teklifleri, masraf detayları ve kampanya koşulları son aşamada yine banka kanalında netleşir.

## Gelecek Geliştirmeler

- Banka teklifleri için entegrasyon katmanı
- Tahmini enflasyon önerisi
- Canlı piyasa verisiyle opsiyonel senaryolar
- Daha detaylı SEO içerikleri
- Hesaplama sonuçlarını paylaşılabilir URL query state ile saklama
