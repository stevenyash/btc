import { useAuthStore } from "@/stores/useAuthStore";

interface WithRoleProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function WithRole({ roles, children, fallback = null }: WithRoleProps) {
  const hasRole = useAuthStore((state) => {
    const { user } = state;
    if (!user) return false;
    const userRole = user.role?.toLowerCase() || user.role_name?.toLowerCase();
    return roles.some(r => userRole === r.toLowerCase());
  });

  if (!hasRole) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default WithRole;
