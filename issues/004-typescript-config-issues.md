# Issue #004: TypeScript Konfigurasyon Sorunlari

## Tarih
2024-12-19

## Sorun 1: react-hook-form Type Uyumsuzlugu

### Hata
```
Type 'Resolver<CustomerFormData>' is not assignable to type 'Resolver<CustomerFormData, any>'
```

### Sebep
`@hookform/resolvers` ve `react-hook-form` arasinda strict type checking sorunlari.

### Cozum
`tsconfig.app.json` dosyasinda:
```json
{
  "compilerOptions": {
    "strictFunctionTypes": false
  }
}
```

Ve zodResolver kullanirken:
```typescript
const form = useForm<CustomerFormData>({
  resolver: zodResolver(customerSchema) as any,
  // ...
})
```

---

## Sorun 2: Enum Kullanimi ve erasableSyntaxOnly

### Hata
```
error TS1274: 'enum' declarations can only be used in TypeScript files.
```

veya Vite ile:
```
This syntax requires the 'erasableSyntaxOnly' option to be disabled.
```

### Sebep
Vite/esbuild varsayilan olarak TypeScript enum'lari desteklemiyor (performans nedeniyle).

### Cozum
`tsconfig.app.json` dosyasindan `erasableSyntaxOnly` kaldirmak veya `false` yapmak:
```json
{
  "compilerOptions": {
    // "erasableSyntaxOnly": true  // Bu satiri kaldir veya false yap
  }
}
```

---

## Sorun 3: Unused Variables Hatalari

### Hata
```
error TS6133: 'xxx' is declared but its value is never read.
```

### Cozum
Gelistirme asamasinda rahatlik icin:
```json
{
  "compilerOptions": {
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

**Not:** Production'da bu ayarlar `true` yapilabilir.

---

## Tam tsconfig.app.json Ornegi

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,

    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "strictFunctionTypes": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,

    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

## Oneriler
1. `strictFunctionTypes: false` sadece form library uyumsuzluklari icin gerekli
2. Production build'de `noUnusedLocals` ve `noUnusedParameters` acilabilir
3. Enum yerine `const` objects kullanmak daha performansli olabilir:

```typescript
// Enum yerine
export const CustomerType = {
  Individual: 1,
  Corporate: 2,
} as const

export type CustomerType = typeof CustomerType[keyof typeof CustomerType]
```
