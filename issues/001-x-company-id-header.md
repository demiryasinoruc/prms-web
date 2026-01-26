# Issue #001: X-Company-ID Header Eksikligi

## Tarih
2024-12-19

## Sorun
Customer olusturulurken Entity Framework'te foreign key hatasi alindi:

```
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes.
---> Microsoft.Data.SqlClient.SqlException: The INSERT statement conflicted with the FOREIGN KEY constraint "FK_Customer_Company_CompanyId".
```

## Sebep
Backend, multi-tenant mimaride calistigindan her istekte `X-Company-ID` header'i bekliyor. Bu header:

1. `CompanyEnrichmentBehavior` middleware'i tarafindan okunuyor
2. `ICompanyAware` interface'ini implement eden command'lara `CompanyId` olarak set ediliyor
3. Bu sayede her entity dogru company'ye baglaniyor

Frontend bu header'i gondermiyordu, dolayisiyla `CompanyId` bos/gecersiz kaliyordu.

## Cozum

### 1. Auth Store Guncellendi (`src/stores/auth.ts`)
```typescript
interface AuthState {
  // ... existing fields
  company: Company | null
  setCompany: (company: Company) => void
}

// setCompany action eklendi
setCompany: (company) => {
  localStorage.setItem("companyId", company.id)
  set({ company })
},
```

### 2. Axios Interceptor Guncellendi (`src/lib/axios.ts`)
```typescript
api.interceptors.request.use((config) => {
  // ... token handling

  const companyId = localStorage.getItem("companyId")
  if (companyId) {
    config.headers["X-Company-ID"] = companyId
  }

  return config
})
```

### 3. Login Flow Guncellendi (`src/features/auth/login.tsx`)
```typescript
const onSubmit = async (data: LoginFormData) => {
  // Step 1: Login ve token al
  const authResponse = await api.post<AuthResponse>("/auth/login", {
    eMail: data.email,
    password: data.password,
  })

  // Token'i hemen kaydet (sonraki istek icin)
  localStorage.setItem("token", token)

  // Step 2: Kullanicinin company'sini al
  const companyResponse = await api.get<CompanyResponse>("/company/get-company-by-user")

  // Step 3: State'e kaydet
  setCompany(company)
}
```

## Ilgili Backend Dosyalari
- `PRMS.Application/Behaviors/CompanyEnrichmentBehavior.cs` - Header'i okuyup CompanyId set ediyor
- `PRMS.Infrastructure/Middlewares/CompanyValidationMiddleware.cs` - Kullanicinin company'ye erisim yetkisini kontrol ediyor
- `PRMS.Application/Interfaces/ICompanyAware.cs` - CompanyId gerektiren command'lar icin interface

## Test
1. Login yap
2. `/company/get-company-by-user` endpoint'inin cagrildigini kontrol et
3. Sonraki API isteklerinde `X-Company-ID` header'inin oldugunu kontrol et
4. Customer olusturmayi dene - basarili olmali
