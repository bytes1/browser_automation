"use client"

import { useSidebar } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

export function AppSidebarThemeToggle() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  return <ThemeToggle collapsed={collapsed} />
}
