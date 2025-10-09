"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  BarChart3,
  CreditCard,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  User,
} from "lucide-react"
import { useState, useEffect } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Gastos", href: "/expenses", icon: Receipt },
  { name: "Lista de Mercado", href: "/shopping", icon: ShoppingCart },
  { name: "Reportes", href: "/reports", icon: BarChart3 },
  { name: "Deudas", href: "/debts", icon: CreditCard },
]

interface SidebarProps {
  userName: string
}

export function Sidebar({ userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const isDark = savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    setIsDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    if (newTheme) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-background"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-card border-r border-border transform transition-all duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-20" : "w-64",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo and User Info */}
          <div className="px-6 py-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold text-xl shrink-0">
                M
              </div>
              {!isCollapsed && (
                <div className="min-w-0 flex-1">
                  <h1 className="font-bold text-lg truncate">MarketApp</h1>
                  <p className="text-xs text-muted-foreground truncate">Control de Gastos</p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium truncate">{userName}</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    isCollapsed && "justify-center",
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Bottom actions */}
          <div className="p-4 border-t border-border space-y-2">
            <Button
              variant="outline"
              className={cn("w-full gap-3 bg-transparent", isCollapsed ? "justify-center px-0" : "justify-start")}
              onClick={toggleTheme}
              title={isCollapsed ? (isDarkMode ? "Modo Claro" : "Modo Oscuro") : undefined}
            >
              {isDarkMode ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
              {!isCollapsed && <span>{isDarkMode ? "Modo Claro" : "Modo Oscuro"}</span>}
            </Button>

            <Button
              variant="outline"
              className={cn("w-full gap-3 bg-transparent", isCollapsed ? "justify-center px-0" : "justify-start")}
              onClick={handleLogout}
              title={isCollapsed ? "Cerrar Sesión" : undefined}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Cerrar Sesión</span>}
            </Button>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 items-center justify-center rounded-full bg-primary text-primary-foreground border-2 border-background shadow-md hover:scale-110 transition-transform z-50"
            aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
