import {
  BarChart3,
  CalendarClock,
  CheckSquare,
  HeartHandshake,
  LayoutDashboard,
  type LucideIcon,
  Repeat,
  Settings,
  SmilePlus,
} from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "오늘", icon: LayoutDashboard },
  { href: "/todos", label: "할 일", icon: CheckSquare },
  { href: "/planner", label: "시간 계획", icon: CalendarClock },
  { href: "/habits", label: "습관", icon: Repeat },
  { href: "/gratitude", label: "감사 일기", icon: HeartHandshake },
  { href: "/mood", label: "무드", icon: SmilePlus },
  { href: "/stats", label: "통계", icon: BarChart3 },
  { href: "/settings", label: "설정", icon: Settings },
]
