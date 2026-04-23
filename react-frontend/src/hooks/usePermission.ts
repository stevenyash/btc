import { useAuthStore } from "@/stores/useAuthStore";

export function usePermission(permission: string): boolean {
  return useAuthStore((state) => state.hasPermission(permission));
}

export function usePermissions(): string[] {
  return useAuthStore((state) => state.permissions || state.user?.permissions || []);
}

export default usePermission;
