import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  UserCircle,
  Home,
  GraduationCap,
  BookOpen,
  FileText,
  Phone,
  Package,
  Calendar,
  BarChart3,
  DollarSign,
  UserCheck,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Users,
  CreditCard,
  FileSpreadsheet,
  ScrollText,
  PanelLeftClose,
  PanelLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/useAuthStore"
import { useRole } from "@/hooks/useRole"
import { useUIStore } from "@/stores/useUIStore"

interface SidebarProps {
  className?: string
}

const APP_NAME = "Bits Tutor Connect"

export function Sidebar({ className }: SidebarProps) {
  const { user, logout, hasPermission } = useAuthStore()
  const { isAdmin, isMarketer, isSub, isSuperadmin } = useRole()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(['main'])

  const userName = user?.username || "User"
  const userRole = user?.role || user?.role_name || ""

  // Subscriber menus
  const subscriberMenus = isSub ? [
    { label: "Dashboard", path: "/dashboard", icon: BarChart3 },
    { label: "My Account", path: "/account", icon: User },
  ] : []

  // Marketer menus
  const marketerMenus = isMarketer ? [
    { label: "Dashboard", path: "/marketer-dashboard", icon: BarChart3 },
    { label: "My Referrals", path: "/referrals", icon: UserCheck },
    { label: "My Earnings", path: "/marketer/earnings", icon: DollarSign },
  ] : []

  // Admin menus (with permission filtering)
  const allAdminMenus = [
    { label: "Dashboard", path: "/admin", icon: BarChart3 },
    { label: "Manage Users", path: "/admin/users", permission: "users.list", icon: Users },
    { label: "Transactions", path: "/admin/transactions", permission: "transactions.list", icon: CreditCard },
    { label: "Packages", path: "/admin/packages", permission: "packages.list", icon: Package },
    { label: "Subscriptions", path: "/admin/subscriptions", permission: "subscriptions.list", icon: ScrollText },
    { label: "Marketers", path: "/admin/marketers", permission: "marketers.list", icon: Users },
    { label: "Withdrawals", path: "/admin/withdrawals", icon: DollarSign },
    { label: "Lessons", path: "/admin/lessons", permission: "lessons.list", icon: FileSpreadsheet },
    { label: "Learning Hierarchy", path: "/admin/learning-hierarchy", icon: GraduationCap },
  ]

  const adminMenus = isAdmin || isSuperadmin ? allAdminMenus.filter(menu => !menu.permission || hasPermission(menu.permission)) : []

  // Quick access public pages
  const quickAccessMenus = [
    { label: "Home", path: "/", icon: Home },
    { label: "Subscriptions", path: "/subscriptions", icon: Package },
    { label: "Weekend Lessons", path: "/weekend-tutorials", icon: Calendar },
    { label: "Go to Class", path: "/gotoclass", icon: BookOpen },
    { label: "User Guide", path: "/guide", icon: FileText },
    { label: "Contact", path: "/contactus", icon: Phone },
  ]

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  const NavLink = ({ item }: { item: { label: string; path: string; icon?: any } }) => {
    const Icon = item.icon
    const isActive = location.pathname === item.path
    return (
      <Link
        to={item.path}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground font-medium"
            : "hover:bg-muted text-foreground"
        }`}
      >
        {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
        <span className="truncate">{item.label}</span>
      </Link>
    )
  }

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-4 border-b">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg hidden md:inline bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              {APP_NAME}
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Main Section */}
        {(subscriberMenus.length > 0 || marketerMenus.length > 0 || adminMenus.length > 0) && (
          <div>
            {!collapsed && (
              <button
                onClick={() => toggleSection('main')}
                className="flex items-center justify-between w-full px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                <span>Main Menu</span>
                {expandedSections.includes('main') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            {(!collapsed || !expandedSections.includes('main')) && (
              <div className="space-y-1">
                {subscriberMenus.map(item => (
                  <NavLink key={item.path} item={item} />
                ))}
                {marketerMenus.map(item => (
                  <NavLink key={item.path} item={item} />
                ))}
                {adminMenus.map(item => (
                  <NavLink key={item.path} item={item} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Access Section */}
        <div>
          {!collapsed && (
            <button
              onClick={() => toggleSection('quick')}
              className="flex items-center justify-between w-full px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <span>Quick Access</span>
              {expandedSections.includes('quick') ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {(!collapsed || !expandedSections.includes('quick')) && (
            <div className="space-y-1">
              {quickAccessMenus.map(item => (
                <NavLink key={item.path} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Menu */}
      <div className="border-t p-3">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            <UserCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            {!collapsed && (
              <>
                <div className="flex-1 text-left hidden md:block">
                  <p className="text-sm font-medium truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground capitalize truncate">{userRole}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </>
            )}
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-md border bg-white shadow-lg">
              <div className="p-3 border-b bg-muted/30">
                <p className="font-semibold capitalize">{userName}</p>
                <p className="text-sm text-muted-foreground capitalize">{userRole}</p>
              </div>
              <div className="p-1">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/account">
                    <User className="mr-2 h-4 w-4" />
                    My Account
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-40 md:bg-white md:border-r md:border-border transition-all duration-300 ${sidebarCollapsed ? 'md:w-20' : 'md:w-64'} ${className || ''}`}>
        <SidebarContent collapsed={sidebarCollapsed} />
        {/* Desktop Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-4 top-20 h-8 w-8 rounded-full border-2 border-primary/20 bg-white shadow-md hover:bg-muted z-10"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </Button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-lg transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="md:hidden fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
    </>
  )
}

export default Sidebar
