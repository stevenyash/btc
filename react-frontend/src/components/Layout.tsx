import type { ReactNode } from "react"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"
import { Footer } from "./Footer"
import { useAuthStore } from "@/stores/useAuthStore"
import { useUIStore } from "@/stores/useUIStore"

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuthStore()
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {isAuthenticated ? (
        <>
          <Sidebar />
          <main className={`flex-1 pt-14 md:pt-16 md:ml-64 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
            {children}
          </main>
        </>
      ) : (
        <>
          <main className="flex-1 pt-14 md:pt-16">
            {children}
          </main>
        </>
      )}
      <Footer />
    </div>
  )
}

export default Layout