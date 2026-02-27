// Shared query keys for lookup/static data used across multiple feature modules.
// Prevents duplicate inline keys and ensures cache consistency.
export const lookupKeys = {
  pricePeriods: () => ["pricePeriods", "select"] as const,
  currencies: () => ["currencies", "select"] as const,
  unitTypes: () => ["unitTypes", "select"] as const,
  lifespanUnitTypes: () => ["lifespanUnitTypes", "select"] as const,
}
