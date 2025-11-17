"use client"

import Link from "next/link"
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Coffee, ClipboardList, MessageSquareHeart, FileSearch, Library, Users, Settings, ChevronLeft } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Coffee, label: "Coffee Date Demo", href: "/demo" },
  { icon: ClipboardList, label: "AI Readiness Quiz", href: "/quiz" },
  { icon: MessageSquareHeart, label: "Dead Lead Revival", href: "/revival" },
  { icon: FileSearch, label: "AI Audit", href: "/audit" },
  { icon: Library, label: "Prompt Library", href: "/library" },
  { icon: Users, label: "Client Dashboard", href: "/clients" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setIsCollapsed(saved === 'true')
    }
  }, [])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  return (
    <aside className={cn(
      "border-r border-border bg-card h-screen sticky top-0 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "p-6 border-b border-border flex items-center justify-between",
        isCollapsed && "px-2"
      )}>
        {!isCollapsed && (
          <h1 className="text-xl font-bold">
            RE:VIVE <span className="text-primary">by Aether</span>
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className={cn(
            "h-8 w-8 transition-transform duration-300",
            isCollapsed ? "rotate-180" : ""
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent",
                isCollapsed && "justify-center px-0"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
