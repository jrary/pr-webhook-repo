"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { NAV_ITEMS } from "./nav-items"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

const STORAGE_KEY = "d-log-sidebar-collapsed"

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1")
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
      return next
    })
  }

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r bg-card transition-[width] duration-200 ease-in-out md:flex",
        collapsed ? "w-[4.75rem]" : "w-60"
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center px-3",
          collapsed ? "justify-center" : "justify-between pl-6 pr-3"
        )}
      >
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="font-serif text-sm font-semibold italic">d</span>
            </div>
            <div className="leading-tight">
              <span className="block font-serif text-lg font-semibold italic tracking-tight">
                d-log
              </span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Daily Record
              </span>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
          title={collapsed ? "펼치기" : "접기"}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? item.label : null}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-2 py-2",
            collapsed && "justify-center px-0"
          )}
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback>나</AvatarFallback>
          </Avatar>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">나의 플래너</p>
              <p className="truncate text-xs text-muted-foreground">shine@softsquared.com</p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
