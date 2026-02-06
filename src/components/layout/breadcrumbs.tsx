'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const pathNameMap: Record<string, string> = {
  dashboard: 'Dashboard',
  employees: 'Nhân viên',
  departments: 'Phòng ban',
  positions: 'Chức vụ',
  allowances: 'Phụ cấp',
  bonuses: 'Thưởng',
  payroll: 'Bảng lương',
  payslips: 'Phiếu lương',
  'my-payslips': 'Phiếu lương của tôi',
  settings: 'Cài đặt',
  new: 'Thêm mới',
  edit: 'Chỉnh sửa',
}

// Check if a segment looks like a CUID (dynamic ID)
function isDynamicId(segment: string): boolean {
  // CUIDs are typically 25 characters and start with 'c'
  return /^c[a-z0-9]{20,}$/i.test(segment)
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Link href="/dashboard" className="hover:text-foreground">
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, index) => {
        const path = '/' + segments.slice(0, index + 1).join('/')
        const isLast = index === segments.length - 1

        // For dynamic IDs, show "Chi tiết" instead of the ID
        let label = pathNameMap[segment]
        if (!label) {
          label = isDynamicId(segment) ? 'Chi tiết' : segment
        }

        return (
          <div key={path} className="flex items-center">
            <ChevronRight className="h-4 w-4" />
            {isLast ? (
              <span className="ml-1 font-medium text-foreground">{label}</span>
            ) : (
              <Link href={path} className="ml-1 hover:text-foreground">
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
