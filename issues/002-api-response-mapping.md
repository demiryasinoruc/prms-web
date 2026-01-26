# Issue #002: API Response Yapisinin Frontend ile Uyumsuzlugu

## Tarih
2024-12-19

## Sorun
Musteriler sayfasinda veri gorunmuyor. API yanit donuyor ancak tablo bos.

## Sebep
Backend API response yapisi ile frontend'in bekledigi yapi farkli:

### Backend Donuyor:
```json
{
  "totalCount": 3,
  "currentPage": 1,
  "pageSize": 10,
  "pageCount": 1,
  "data": [
    {
      "id": "...",
      "type": 0,
      "name": "...",
      "eMail": "...",
      "contactNumber": "...",
      "identityNumber": "...",
      "taxNumber": "...",
      "taxOffice": ""
    }
  ]
}
```

### Frontend Bekliyor:
```json
{
  "totalCount": 3,
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 1,
  "items": [
    {
      "id": "...",
      "customerType": 0,
      "name": "...",
      "email": "...",
      "contactNumber": "...",
      "identityNumber": "...",
      "taxNumber": "...",
      "taxOffice": ""
    }
  ]
}
```

### Farklar:
| Backend | Frontend | Aciklama |
|---------|----------|----------|
| `data` | `items` | Liste property adi |
| `currentPage` | `pageNumber` | Mevcut sayfa |
| `pageCount` | `totalPages` | Toplam sayfa sayisi |
| `type` | `customerType` | Musteri tipi |
| `eMail` | `email` | Email field adi |

## Cozum

`src/features/customers/api.ts` dosyasinda transformation layer eklendi:

```typescript
// API response types (matching backend)
interface ApiCustomerListResponse {
  totalCount: number
  currentPage: number
  pageSize: number
  pageCount: number
  data: ApiCustomer[]
}

interface ApiCustomer {
  id: string
  type: number
  name: string
  eMail: string
  contactNumber: string
  identityNumber: string
  taxNumber: string
  taxOffice: string
  isActive?: boolean
  addresses?: CustomerAddress[]
}

// Transform API response to frontend format
function transformCustomer(apiCustomer: ApiCustomer): Customer {
  return {
    id: apiCustomer.id,
    name: apiCustomer.name,
    customerType: apiCustomer.type,
    email: apiCustomer.eMail,
    contactNumber: apiCustomer.contactNumber,
    identityNumber: apiCustomer.identityNumber,
    taxNumber: apiCustomer.taxNumber,
    taxOffice: apiCustomer.taxOffice,
    isActive: apiCustomer.isActive ?? true,
    addresses: apiCustomer.addresses || [],
  }
}

export const customerApi = {
  getAll: async (params: CustomerListParams = {}) => {
    const response = await api.get<ApiCustomerListResponse>("/customer", { params })

    // Transform to frontend format
    const apiData = response.data
    return {
      items: apiData.data.map(transformCustomer),
      totalCount: apiData.totalCount,
      pageNumber: apiData.currentPage,
      pageSize: apiData.pageSize,
      totalPages: apiData.pageCount,
      hasPreviousPage: apiData.currentPage > 1,
      hasNextPage: apiData.currentPage < apiData.pageCount,
    } as PaginatedResponse<Customer>
  },
}
```

## Oneriler
Diger entity'ler icin de ayni pattern uygulanmali:
- Products
- Rentals
- Inventory
- Warehouses
- Vehicles
- Employees

Her feature icin `api.ts` dosyasinda:
1. Backend response type'i tanimla (`ApiXxxResponse`)
2. Transform fonksiyonu yaz (`transformXxx`)
3. API fonksiyonlarinda donusumu uygula

## Not
Backend'de .NET, property isimlendirmesi PascalCase veya camelCase olabilir. API response'larda `eMail` gibi tutarsizliklar olabilir. Her endpoint icin response yapisini kontrol etmek gerekiyor.
