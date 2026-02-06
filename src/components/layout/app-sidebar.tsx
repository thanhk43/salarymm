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
]

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const isAdmin = user.role === 'ADMIN'
  const menuItems = isAdmin ? adminMenuItems : employeeMenuItems

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            S
          </div>
          <span className="text-lg font-semibold">SalaryMM</span>
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
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">
              {user.role === 'ADMIN' ? 'Administrator' : 'Employee'}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
