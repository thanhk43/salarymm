'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  Briefcase,
  Users,
  Gift,
  Calculator,
  FileText,
  LayoutDashboard,
  Settings,
  Wallet,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AppSidebarProps {
  user: User
}

const adminMenuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Nhân viên',
    url: '/dashboard/employees',
    icon: Users,
  },
  {
    title: 'Phòng ban',
    url: '/dashboard/departments',
    icon: Building2,
  },
  {
    title: 'Chức vụ',
    url: '/dashboard/positions',
    icon: Briefcase,
  },
  {
    title: 'Phụ cấp',
    url: '/dashboard/allowances',
    icon: Wallet,
  },
  {
    title: 'Thưởng',
    url: '/dashboard/bonuses',
    icon: Gift,
  },
  {
    title: 'Bảng lương',
    url: '/dashboard/payroll',
    icon: Calculator,
  },
  {
    title: 'Phiếu lương',
    url: '/dashboard/payslips',
    icon: FileText,
  },
]

const employeeMenuItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Phiếu lương của tôi',
    url: '/dashboard/my-payslips',
    icon: FileText,
  },
  {
    title: 'Hồ sơ cá nhân',
    url: '/dashboard/profile',
    icon: Users,
  },
]

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const isAdmin = user.role === 'ADMIN'
  const menuItems = isAdmin ? adminMenuItems : employeeMenuItems

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-5">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-sm font-bold text-primary-foreground transition-shadow group-hover:shadow-md group-hover:shadow-primary/20">
            S
          </div>
          <span className="text-lg font-semibold tracking-tight">SalaryMM</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Cài đặt</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/dashboard/settings'}>
                    <Link href="/dashboard/settings">
                      <Settings className="h-4 w-4" />
                      <span>Cài đặt</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-accent">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-xs font-semibold text-primary">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{user.name}</span>
            <span className="text-[11px] text-muted-foreground">
              {user.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
