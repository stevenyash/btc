import { create } from "zustand";
import { api } from "@/services/api";

interface PermissionState {
  permissions: string[];
  userRole: string | null;
  rolePermissions: Record<string, { list: boolean; view: boolean; edit: boolean; remove: boolean }>;
  loaded: boolean;
  loadPermissions: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  can: (action: "list" | "view" | "edit" | "remove", resource: string) => boolean;
  clearPermissions: () => void;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: [],
  userRole: null,
  rolePermissions: {},
  loaded: false,

  loadPermissions: async () => {
    try {
      const response = await api.get("/auth/permissions");
      const data = response.data;
      set({
        permissions: data.permissions || [],
        userRole: data.role || null,
        rolePermissions: data.rolePermissions || {},
        loaded: true,
      });
    } catch (error) {
      console.error("Failed to load permissions:", error);
      set({ loaded: true });
    }
  },

  hasPermission: (permission: string) => {
    const { permissions } = get();
    return permissions.includes(permission);
  },

  hasRole: (role: string) => {
    const { userRole } = get();
    if (!userRole) return false;
    return userRole.toLowerCase() === role.toLowerCase();
  },

  can: (action: "list" | "view" | "edit" | "remove", resource: string) => {
    const { rolePermissions } = get();
    const resourcePermissions = rolePermissions[resource];
    if (!resourcePermissions) return false;
    return resourcePermissions[action] === true;
  },

  clearPermissions: () => {
    set({
      permissions: [],
      userRole: null,
      rolePermissions: {},
      loaded: false,
    });
  },
}));
