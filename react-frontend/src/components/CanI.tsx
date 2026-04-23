import { useAuthStore } from "@/stores/useAuthStore";

interface CanIProps {
  action: "list" | "view" | "edit" | "add" | "create" | "delete" | "remove" | "upload";
  resource: string;
  children: (can: boolean) => React.ReactNode;
}

export function CanI({ action, resource, children }: CanIProps) {
   const hasPermission = useAuthStore((state) => {
     const { user, permissions } = state;
     if (!user) return false;
     
     const permKey = `${resource}.${action}`;
     const altPermKey = action === 'add' ? `${resource}.create` : 
                       action === 'delete' ? `${resource}.remove` :
                       `${resource}.${action}`;
     
     if (permissions.length > 0) {
       return permissions.includes(permKey) || permissions.includes(altPermKey);
     }
     
     const userPerms = user.permissions || [];
     return userPerms.includes(permKey) || userPerms.includes(altPermKey);
   });

  return <>{children(hasPermission)}</>;
}

export default CanI;
