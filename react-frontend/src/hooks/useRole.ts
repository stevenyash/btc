import { useAuthStore } from "@/stores/useAuthStore";

export function useRole() {
  const user = useAuthStore((state) => state.user);
  
  const userRole = user?.role?.toLowerCase() || user?.role_name?.toLowerCase() || "";
  
   const isAdmin = userRole === "admin" || userRole === "superadmin";
   const isSub = userRole === "subscriber" || userRole === "student" || userRole === "client";
   const isMarketer = userRole === "marketer";
   const isTeacher = userRole === "teacher";
   const isSuperadmin = userRole === "superadmin";

  return {
    isAdmin,
    isSub,
    isSubscriber: isSub,
    isMarketer,
    isTeacher,
    isSuperadmin,
    userRole,
    role: userRole,
  };
}

export default useRole;
