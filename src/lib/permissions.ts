// Permission key constants matching backend Permission.Name values
export const Permissions = {
  // Dashboard
  Dashboard: {
    View: "dashboard.view",
  },

  // Ürün Yönetimi (Module 11)
  Product: {
    View: "product.view",
    Create: "product.create",
    Update: "product.update",
    Delete: "product.delete",
  },
  Inventory: {
    View: "inventory.view",
    Create: "inventory.create",
    Update: "inventory.update",
    Delete: "inventory.delete",
  },

  // Kiralama (Module 12)
  Rental: {
    View: "rental.view",
    Create: "rental.create",
    Update: "rental.update",
    Delete: "rental.delete",
  },

  // Müşteri Yönetimi (Module 13)
  Customer: {
    View: "customer.view",
    Create: "customer.create",
    Update: "customer.update",
    Delete: "customer.delete",
  },

  // Depo Yönetimi (Module 14)
  Warehouse: {
    View: "warehouse.view",
    Create: "warehouse.create",
    Update: "warehouse.update",
    Delete: "warehouse.delete",
  },

  // Araç Yönetimi (Module 15)
  Vehicle: {
    View: "vehicle.view",
    Create: "vehicle.create",
    Update: "vehicle.update",
    Delete: "vehicle.delete",
  },

  // Personel Yönetimi (Module 16)
  Employee: {
    View: "employee.view",
    Create: "employee.create",
    Update: "employee.update",
    Delete: "employee.delete",
  },
  Certificates: {
    View: "certificate.view",
    Create: "certificate.create",
    Update: "certificate.update",
    Delete: "certificate.delete",
  },
  MaintenanceSchedule: {
    View: "maintenanceschedule.view",
    Create: "maintenanceschedule.create",
    Update: "maintenanceschedule.update",
    Delete: "maintenanceschedule.delete",
  },
  MaintenanceRecord: {
    View: "maintenancerecord.view",
    Create: "maintenancerecord.create",
    Update: "maintenancerecord.update",
    Delete: "maintenancerecord.delete",
  },

  // Takvim (Module 17)
  Calendar: {
    View: "calendar.view",
    Manage: "calendar.manage",
  },

  // Tanımlar (Module 18)
  Category: {
    View: "category.view",
    Create: "category.create",
    Update: "category.update",
    Delete: "category.delete",
  },
  CategoryAttribute: {
    View: "categoryattribute.view",
    Create: "categoryattribute.create",
    Update: "categoryattribute.update",
    Delete: "categoryattribute.delete",
  },
  Brand: {
    View: "brand.view",
    Create: "brand.create",
    Update: "brand.update",
    Delete: "brand.delete",
  },
  ExtraServices: {
    View: "extraservice.view",
    Create: "extraservice.create",
    Update: "extraservice.update",
    Delete: "extraservice.delete",
  },

  // Ayarlar (Module 19)
  Settings: {
    View: "settings.view",
    Manage: "settings.manage",
  },
  Role: {
    View: "role.view",
    Manage: "role.manage",
  },
  User: {
    View: "user.view",
    Manage: "user.manage",
  },
} as const

// Helper type for permission values
export type PermissionKey = (typeof Permissions)[keyof typeof Permissions][keyof (typeof Permissions)[keyof typeof Permissions]]
