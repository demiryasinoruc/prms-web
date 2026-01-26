# Issue #003: shadcn/ui Import Path Sorunlari

## Tarih
2024-12-19

## Sorun
shadcn/ui componentleri eklendiginde import path'leri yanlis olusturuluyor:

```typescript
// Yanlis
import { cn } from "src/lib/utils"
import { buttonVariants } from "src/components/ui/button"

// Dogru
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
```

## Sebep
`components.json` dosyasindaki alias konfigurasyonu yanlis ayarlanmis olabilir veya shadcn CLI path resolution'da sorun yasayabilir.

## Cozum

### 1. components.json Kontrolu
```json
{
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 2. Manuel Duzeltme (Gerekirse)
Her shadcn component eklemesinden sonra import path'leri kontrol edilmeli:

**PowerShell:**
```powershell
Get-ChildItem -Path src/components/ui/*.tsx | ForEach-Object {
  (Get-Content $_.FullName) -replace 'from "src/lib/utils"', 'from "@/lib/utils"' |
  (Get-Content $_.FullName) -replace 'from "src/components', 'from "@/components' |
  Set-Content $_.FullName
}
```

**Bash/Unix:**
```bash
sed -i 's|from "src/lib/utils"|from "@/lib/utils"|g' src/components/ui/*.tsx
sed -i 's|from "src/components|from "@/components|g' src/components/ui/*.tsx
```

### 3. tsconfig.json Path Alias
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 4. vite.config.ts Alias
```typescript
import path from "path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

## Etkilenen Componentler
Bu sorunu yasayan componentler:
- `button.tsx`
- `alert-dialog.tsx`
- Diger shadcn componentleri

## Oneri
Yeni shadcn component eklendikten sonra:
1. `npm run build` calistir
2. Import hatalari varsa path'leri duzelt
3. Tekrar build et ve dogrula
