"use client"

import Link from "next/link"
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Coffee, ClipboardList, MessageSquareHeart, FileSearch, Library, Users, Settings2, ChevronLeft } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import Image from 'next/image'

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Coffee, label: "Coffee Date Demo", href: "/demo" },
  { icon: ClipboardList, label: "AI Readiness Quiz", href: "/quiz" },
  { icon: MessageSquareHeart, label: "GHL Dead Lead Accounts", href: "/revival" },
  { icon: FileSearch, label: "AI Audit", href: "/audit" },
  { icon: Library, label: "Prompt Library", href: "/library" },
  { icon: Users, label: "Clients", href: "/clients" },
  { icon: Settings2, label: "Settings", href: "/settings" },
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
      "border-r border-white/10 bg-black h-screen sticky top-0 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "p-6 border-b border-white/10 flex items-center gap-3",
        isCollapsed ? "px-2 justify-center" : "justify-between"
      )}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3">
              <Image 
                src="/images/aether-logo.png" 
                alt="Aether" 
                width={32} 
                height={32}
                className="flex-shrink-0"
              />
              <h1 className="text-xl font-semibold text-white">
                Aether AI Lab
              </h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="h-8 w-8 text-white hover:bg-white/10 flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Image 
              src="/images/aether-logo.png" 
              alt="Aether" 
              width={28} 
              height={28}
              className="mb-2"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="h-8 w-8 text-white hover:bg-white/10 rotate-180 absolute right-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        )}
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
                  ? "bg-primary text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
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
