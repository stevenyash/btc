import { useAuthStore } from "@/stores/useAuthStore";

interface WithPermissionProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function WithPermission({ permission, children, fallback = null }: WithPermissionProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission(permission));

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default WithPermission;
