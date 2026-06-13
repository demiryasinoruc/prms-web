// Plan özellik (entitlement) kataloğu — backend EntitlementCatalog.FeatureKeys ile birebir.
// Hem admin plan matrisi hem de nav/route gizleme bu tek kaynaktan beslenir.

export const FEATURE_KEYS = [
  "Maintenance",
  "Notifications",
  "Calendar",
  "QrBarcode",
  "ProductRules",
  "CategoryAttributes",
  "ExtraServices",
  "Certificates",
] as const

export type FeatureKey = (typeof FEATURE_KEYS)[number]

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  Maintenance: "Bakım Yönetimi",
  Notifications: "Bildirimler",
  Calendar: "Takvim",
  QrBarcode: "QR / Barkod",
  ProductRules: "Ürün Kuralları",
  CategoryAttributes: "Kategori Öznitelikleri",
  ExtraServices: "Ek Hizmetler",
  Certificates: "Sertifika Takibi",
}

export interface PlanFeature {
  key: FeatureKey
  enabled: boolean
}
