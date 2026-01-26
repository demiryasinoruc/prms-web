# Issue #005: API Request Field Name Uyumsuzlugu

## Tarih
2024-12-19

## Sorun
Musteri olusturulurken veya guncellenirken musteri tipi (customerType) backend'e dogru iletilmiyor. Tum musteriler `type: 0` olarak kaydediliyor.

## Sebep
Frontend ve backend arasinda field name uyumsuzlugu var:

### Frontend Gonderiyor:
```json
{
  "customerType": 1,
  "name": "...",
  "email": "...",
  "contactNumber": "..."
}
```

### Backend Bekliyor:
```json
{
  "type": 1,
  "name": "...",
  "eMail": "...",
  "contactNumber": "..."
}
```

### Field Mapping:
| Frontend | Backend |
|----------|---------|
| `customerType` | `type` |
| `email` | `eMail` |

## Cozum

`src/features/customers/api.ts` dosyasinda create ve update fonksiyonlarinda transformation eklendi:

```typescript
create: async (data: CustomerCreateRequest) => {
  // Transform to backend format
  const requestBody = {
    type: data.customerType,
    name: data.name,
    eMail: data.email || "",
    contactNumber: data.contactNumber || "",
    identityNumber: data.identityNumber || "",
    taxNumber: data.taxNumber || "",
    taxOffice: data.taxOffice || "",
    notes: data.notes || "",
  }
  const response = await api.post<Customer>("/customer", requestBody)
  return response.data
},
```

## Etkilenen Islemler
- Musteri olusturma
- Musteri guncelleme

## Backend DTO Referansi
`PRMS.Application/Features/Customers/DTOs/Requests/CustomerCreateRequestDTO.cs`:
```csharp
public record CustomerCreateRequestDTO(
    CustomerType Type,
    string Name,
    string EMail,
    string ContactNumber,
    string? IdentityNumber,
    string? TaxNumber,
    string? TaxOffice,
    string? Notes);
```

## Oneri
Diger entity'ler icin de ayni kontrol yapilmali. Backend DTO'lari ile frontend request type'lari karsilastirilmali:
- Products
- Rentals
- Inventory
- Warehouses
- Vehicles
- Employees
