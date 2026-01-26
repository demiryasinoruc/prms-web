# PRMS Web - Bilinen Sorunlar ve Cozumleri

Bu klasor, prms-web gelistirme surecinde karsilasilan sorunlari ve cozumlerini dokumante eder.

## Sorun Listesi

| # | Baslik | Durum | Oncelik |
|---|--------|-------|---------|
| [001](./001-x-company-id-header.md) | X-Company-ID Header Eksikligi | Cozuldu | Yuksek |
| [002](./002-api-response-mapping.md) | API Response Yapisinin Frontend ile Uyumsuzlugu | Cozuldu | Yuksek |
| [003](./003-shadcn-import-paths.md) | shadcn/ui Import Path Sorunlari | Cozuldu | Orta |
| [004](./004-typescript-config-issues.md) | TypeScript Konfigurasyon Sorunlari | Cozuldu | Orta |
| [005](./005-api-field-name-mismatch.md) | API Request Field Name Uyumsuzlugu | Cozuldu | Yuksek |

## Hizli Basvuru

### Multi-Tenant Yapi
Backend multi-tenant mimaride calisiyor. Her API isteginde `X-Company-ID` header'i gerekli. Bu header axios interceptor'da otomatik ekleniyor (`src/lib/axios.ts`).

### API Response Donusumu
Backend response yapisi frontend type'lariyla birebir uyusmayabilir. Her feature icin `api.ts` dosyasinda transformation layer kullanilmali.

### shadcn/ui Ekleme
Yeni component eklerken:
```bash
npx shadcn@latest add <component-name>
```
Sonrasinda import path'leri kontrol edilmeli.

### TypeScript Hatalari
Form library'leri ile type sorunlari yasanirsa `strictFunctionTypes: false` kullanilabilir.

## Yeni Sorun Ekleme

Yeni bir sorun dokumante ederken:
1. Sonraki numara ile dosya olustur: `00X-kisa-baslik.md`
2. Bu README'yi guncelle
3. Asagidaki template'i kullan:

```markdown
# Issue #00X: Baslik

## Tarih
YYYY-MM-DD

## Sorun
[Sorunun aciklamasi]

## Sebep
[Kok neden analizi]

## Cozum
[Uygulanan cozum]

## Test
[Nasil test edilecegi]
```
