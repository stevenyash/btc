import { Navigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/stores/useAuthStore"
import { useSubscriptionStore } from "@/stores/useSubscriptionStore"
import { useMarketerStore } from "@/stores/useMarketerStore"
import { useAdminStore } from "@/stores/useAdminStore"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireRole?: "subscriber" | "marketer" | "admin" | "superadmin"
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireRole,
  redirectTo = "/login"
}: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, user, getCurrentUser, isLoading: authLoading } = useAuthStore()
   const { fetchSubscriberDetails } = useSubscriptionStore()
   const { fetchAllData: fetchMarketerData } = useMarketerStore()
   const { fetchAllData: fetchAdminData } = useAdminStore()

  // Check if user is authenticated (client-side check)
  const isAuth = isAuthenticated && user !== null

  // Check role membership
  const userRole = user?.role?.toLowerCase() || user?.role_name?.toLowerCase() || ""
  const isSubscriber = isAuth && (userRole === "subscriber" || userRole === "student")
  const isMarketer = isAuth && userRole === "marketer"
  const isAdmin = isAuth && (userRole === "admin" || userRole === "superadmin" || userRole === "superuser")

  // Fetch user data on mount if authenticated but details not loaded
  useEffect(() => {
    if (isAuth && !user?.role_name) {
      getCurrentUser()
    }
  }, [isAuth, user, getCurrentUser])

  // Fetch role-specific data when accessing protected pages
  useEffect(() => {
    if (isAuth) {
      if (isSubscriber) {
        fetchSubscriberDetails()
      } else if (isMarketer) {
        fetchMarketerData()
      } else if (isAdmin) {
        fetchAdminData()
      }
    }
  }, [isAuth, isSubscriber, isMarketer, isAdmin, fetchSubscriberDetails, fetchMarketerData, fetchAdminData])

  // Show loading state while checking auth
  if (authLoading || (!isAuth && requireAuth)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Redirect to login if authentication required but not authenticated
  if (requireAuth && !isAuth) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Role-based access control
  if (requireRole && isAuth) {
    switch (requireRole) {
      case "subscriber":
        if (!isSubscriber && !isAdmin) {
          // Allow admins to access subscriber pages? No.
          return <Navigate to="/" replace />
        }
        break
      case "marketer":
        if (!isMarketer && !isAdmin) {
          return <Navigate to="/" replace />
        }
        break
      case "admin":
        if (!isAdmin) {
          return <Navigate to="/" replace />
        }
        break
    }
  }

  // All checks passed
  return <>{children}</>
}
