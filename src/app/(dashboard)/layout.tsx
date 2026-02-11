import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { UserNav } from '@/components/layout/user-nav'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { ThemeToggle } from '@/components/layout/theme-toggle'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 !h-4" />
            <Breadcrumbs />
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserNav user={session.user} />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
