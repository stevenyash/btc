export function checkPermission(
  permissions: string[],
  required: string
): boolean {
  return permissions.includes(required);
}

export function checkRole(
  role: string | null,
  required: string[]
): boolean {
  if (!role) return false;
  return required.some(r => r.toLowerCase() === role.toLowerCase());
}

export function parsePermission(
  permission: string
): { action: string; resource: string } {
  const [action, resource] = permission.split(":");
  return { action, resource };
}

export function combinePermissions(
  ...permissionArrays: string[][]
): string[] {
  return [...new Set(permissionArrays.flat())];
}