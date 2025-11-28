"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Coffee,
  ClipboardList,
  MessageSquareHeart,
  FileSearch,
  Library,
  Settings2,
  ChevronLeft,
  Target,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const menuSections = [
  {
    label: "Core",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
      { icon: Target, label: "Opportunities", href: "/revival/opportunities" },
    ],
  },
  {
    label: "Tools",
    items: [
      { icon: Coffee, label: "Coffee Date Demo", href: "/demo" },
      { icon: ClipboardList, label: "AI Readiness Quiz", href: "/quiz" },
      { icon: MessageSquareHeart, label: "GHL Dead Lead Accounts", href: "/revival", exact: true },
      { icon: FileSearch, label: "AI Audit", href: "/audit" },
    ],
  },
  {
    label: "Resources",
    items: [{ icon: Library, label: "Prompt Library", href: "/library" }],
  },
  {
    label: "Account",
    items: [{ icon: Settings2, label: "Settings", href: "/settings" }],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setIsCollapsed(saved === "true")
    }
  }, [])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", String(newState))
  }

  const isActiveLink = (href: string, exact?: boolean) => {
    if (!pathname) return false

    // Special handling for /revival routes to prevent double-highlighting
    if (href === "/revival" && exact) {
      // Only highlight GHL Dead Leads when exactly on /revival (not /revival/opportunities)
      return pathname === "/revival" || pathname === "/revival/"
    }

    if (href === "/revival/opportunities") {
      // Highlight Opportunities for /revival/opportunities and its sub-routes
      return pathname.startsWith("/revival/opportunities")
    }

    // Default behavior for other routes
    if (exact) {
      return pathname === href || pathname === href + "/"
    }

    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside
      className={cn(
        "border-r border-white/10 bg-black h-screen sticky top-0 flex flex-col transition-all duration-300 relative overflow-visible",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "border-b border-white/10 flex items-center h-[73px] relative",
          isCollapsed ? "px-3 justify-center" : "px-6 justify-between",
        )}
      >
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-3">
              <Image src="/images/aether-logo.png" alt="Aether" width={32} height={32} className="flex-shrink-0" />
              <h1 className="text-xl font-semibold text-white">Aether AI Lab</h1>
            </div>
          </>
        ) : (
          <Image src="/images/aether-logo.png" alt="Aether" width={32} height={32} />
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="absolute -right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black border-2 border-white/20 text-white hover:!border-[#00A8FF] hover:!text-white dark:hover:!border-[#00A8FF] dark:hover:!text-white shadow-lg z-[100] transition-all duration-200 group"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className="h-4 w-4 text-white group-hover:text-white" />
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {menuSections.map((section) => (
          <div key={section.label} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive = isActiveLink(item.href, (item as any).exact)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
                    isActive
                      ? "bg-[#00A8FF] text-white shadow-lg shadow-[#00A8FF]/20"
                      : "text-white/70 hover:bg-white/5 hover:text-white",
                    isCollapsed && "justify-center px-0",
                  )}
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0 transition-colors", isActive && "text-white")} />
                  {!isCollapsed && item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
