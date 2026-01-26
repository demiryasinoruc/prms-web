import { useAuthStore } from "@/stores/auth"

/**
 * Hook to check if user has a specific permission
 * @param permissionKey - The permission key to check (e.g., "warehouse.create")
 * @returns boolean - Whether the user has the permission
 */
export function usePermission(permissionKey: string): boolean {
  return useAuthStore((state) => state.permissions.includes(permissionKey))
}

/**
 * Hook to check if user has any of the specified permissions
 * @param permissionKeys - Array of permission keys to check
 * @returns boolean - Whether the user has any of the permissions
 */
export function useAnyPermission(permissionKeys: string[]): boolean {
  return useAuthStore((state) =>
    permissionKeys.some(key => state.permissions.includes(key))
  )
}

/**
 * Hook to check if user has all of the specified permissions
 * @param permissionKeys - Array of permission keys to check
 * @returns boolean - Whether the user has all permissions
 */
export function useAllPermissions(permissionKeys: string[]): boolean {
  return useAuthStore((state) =>
    permissionKeys.every(key => state.permissions.includes(key))
  )
}

/**
 * Hook to get all user permissions
 * @returns string[] - Array of permission keys
 */
export function usePermissions(): string[] {
  return useAuthStore((state) => state.permissions)
}
