"use client"

import Link from "next/link"
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Coffee, ClipboardList, MessageSquareHeart, FileSearch, Library, Users, Settings } from 'lucide-react'
import { cn } from "@/lib/utils"

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

  return (
    <aside className="w-64 border-r border-border bg-card h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold">
          RE:VIVE <span className="text-primary">by Aether</span>
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
