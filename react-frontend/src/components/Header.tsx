import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { 
  Menu, X, User, LogOut, Settings, UserCircle, ChevronDown,
  Home, BookOpen, GraduationCap, Phone, FileText, Package, Calendar, LogIn,
  DollarSign, UserCheck, BarChart3
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/useAuthStore"
import { useRole } from "@/hooks/useRole"

interface MenuItem {
  label: string
  path: string
  icon?: LucideIcon
  permission?: string
}

interface HeaderProps {
  isLoggedIn?: boolean
  userName?: string
  userRole?: string
}

const APP_NAME = "Bits Tutor Connect"

export function Header({
  isLoggedIn: propIsLoggedIn,
  userName: propUserName,
  userRole: propUserRole,
}: HeaderProps) {
  const { isAuthenticated, user, logout, hasPermission } = useAuthStore()
  const { isAdmin, isMarketer, isSub, isSuperadmin } = useRole()
  const isLoggedIn = propIsLoggedIn ?? isAuthenticated
  const userName = propUserName ?? user?.username ?? ""
  const userRole = propUserRole ?? user?.role ?? user?.role_name ?? ""
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()

// Base menus (always visible - public)
  const baseMenus: MenuItem[] = [
    { label: "Home", path: "/", icon: Home },
   

    { label: "Subscriptions", path: "/subscriptions", icon: Package },
    { label: "Packages", path: "/packages", icon: Package },
    { label: "About Us", path: "/aboutus", icon: GraduationCap },
    { label: "Contact Us", path: "/contactus", icon: Phone },
    { label: "User Guide", path: "/guide", icon: FileText },
      { label: "Weekend Lessons", path: "/weekend-tutorials", icon: Calendar },
     { label: "Go to Class", path: "/gotoclass", icon: BookOpen },
  ]

  // Subscriber menus (logged in only)
  const subscriberMenus: MenuItem[] = isLoggedIn ? [
    { label: "My Dashboard", path: "/dashboard", icon: BarChart3 },
    { label: "My Account", path: "/account", icon: User },
  ] : []

  // Marketer menus
  const marketerMenus: MenuItem[] = [
    { label: "Marketer Dashboard", path: "/marketer-dashboard", icon: DollarSign },
    { label: "My Referrals", path: "/referrals", icon: UserCheck },
    { label: "My Earnings", path: "/marketer/earnings", icon: DollarSign },
  ]

  // Admin menus
  const adminMenus: MenuItem[] = [
    { label: "Admin Dashboard", path: "/admin", icon: BarChart3 },
    { label: "Manage Users", path: "/admin/users", permission: "users.list" },
    { label: "Transactions", path: "/admin/transactions", permission: "transactions.list" },
    { label: "Packages", path: "/admin/packages", permission: "packages.list" },
    { label: "Subscriptions", path: "/admin/subscriptions", permission: "subscriptions.list" },
    { label: "Marketers", path: "/admin/marketers", permission: "marketers.list" },
    { label: "Withdrawals", path: "/admin/withdrawals", icon: DollarSign },
    { label: "Lessons", path: "/admin/lessons", permission: "lessons.list" },
    { label: "Learning Hierarchy", path: "/admin/learning-hierarchy" },
  ]

 
  // Filter menus by permission
  const filterByPermission = (menus: MenuItem[]): MenuItem[] => {
    return menus.filter(menu => {
      if (!menu.permission) return true
      return hasPermission(menu.permission)
    })
  }

  // Main navigation menus (always public routes + auth when logged out)
  const allMenus = [...filterByPermission(baseMenus)]

  // Role-specific menus for user dropdown
  const roleMenus: MenuItem[] = [
    ...(isSub ? subscriberMenus : []),
    ...(isMarketer ? marketerMenus : []),
    ...(isAdmin || isSuperadmin ? adminMenus : []),
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-white shadow-sm">
      {/* Top Bar - Logo & Mobile Menu */}
      <div className="mx-auto flex h-14 md:h-16 items-center justify-between px-2 md:px-4 w-full max-w-7xl">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* App Name - Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent hidden sm:inline">
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop Navigation - Icons Above Text */}
        <nav className="hidden lg:flex items-center justify-center flex-1 px-4">
           <div className="flex items-center justify-center gap-1">
             {allMenus.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {Icon && <Icon className="h-5 w-5 mb-1 text-primary" />}
                  <span className="text-xs font-medium whitespace-nowrap">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Tablet Navigation - Icons only */}
        <nav className="hidden md:flex lg:hidden items-center justify-center flex-1 px-2">
          <div className="flex items-center justify-center gap-0.5">
            {allMenus.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {Icon && <Icon className="h-5 w-5 text-primary" />}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Right Side - Auth */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isLoggedIn ? (
            <>
              {/* Logout Button - Always visible for easy access */}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hidden sm:flex"
                onClick={async () => {
                  await logout()
                  navigate("/")
                }}
              >
                <LogOut className="mr-1 h-4 w-4" />
                <span className="hidden md:inline">Logout</span>
              </Button>

              {/* Logout Button - Icon only for small screens */}
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive sm:hidden"
                onClick={async () => {
                  await logout()
                  navigate("/")
                }}
              >
                <LogOut className="h-5 w-5" />
              </Button>

              {/* User Menu Dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 md:gap-2"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <UserCircle className="h-5 w-5" />
                  <span className="hidden sm:inline capitalize text-sm">{userName || "User"}</span>
                  <ChevronDown className="h-4 w-4 hidden sm:inline" />
                </Button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white shadow-lg animate-slide-down">
                    <div className="p-3 border-b bg-muted/30">
                      <p className="font-semibold capitalize">{userName || "User"}</p>
                      {userRole && (
                        <p className="text-sm text-muted-foreground capitalize">{userRole}</p>
                      )}
                    </div>
                    <div className="p-1">
                      {filterByPermission(roleMenus).map((item) => {
                        const Icon = item.icon
                        return (
                          <Button
                            key={item.path}
                            variant="ghost"
                            className="w-full justify-start"
                            asChild
                          >
                            <Link to={item.path}>
                              {Icon && <Icon className="mr-2 h-4 w-4" />}
                              {item.label}
                            </Link>
                          </Button>
                        )
                      })}
                      <div className="border-t my-1" />
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                      >
                        <Link to="/account">
                          <User className="mr-2 h-4 w-4" />
                          My Account
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                      >
                        <Link to="/settings">
                          <Settings className="mr-2 h-4 w-4" />
                          Change usercode
                        </Link>
                      </Button>
                      <div className="border-t my-1 sm:hidden" />
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive sm:hidden"
                        onClick={async () => {
                          await logout()
                          navigate("/")
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Login Button - Prominent on mobile */}
              <Button variant="default" size="sm" className="flex items-center gap-1" asChild>
                <Link to="/login">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white animate-slide-down">
          <nav className="flex flex-col p-4 space-y-1">
            {allMenus.map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className="justify-start"
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link to={item.path} className="flex items-center gap-3">
                    {Icon && <Icon className="h-5 w-5 text-primary" />}
                    {item.label}
                  </Link>
                </Button>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header