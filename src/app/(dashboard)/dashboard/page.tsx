'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Users, Building2, Briefcase, Gift, TrendingUp, Clock, ArrowRight } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

interface DashboardData {
  stats: {
    totalEmployees: number
    activeEmployees: number
    inactiveEmployees: number
    totalDepartments: number
    totalPositions: number
    pendingBonuses: number
    totalSalaryExpenses: number
  }
  departmentStats: {
    id: string
    code: string
    name: string
    employeeCount: number
  }[]
  recentEmployees: {
    id: string
    employeeCode: string
    fullName: string
    email: string
    startDate: string
    department: { name: string } | null
    position: { name: string } | null
  }[]
  pendingBonusList: {
    id: string
    type: string
    amount: string
    reason: string
    employee: {
      fullName: string
      employeeCode: string
    }
  }[]
}

function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`
  }
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const bonusTypeLabels: Record<string, string> = {
  MONTHLY: 'Hàng tháng',
  QUARTERLY: 'Quý',
  ANNUAL: 'Năm',
  TET: 'Tết',
  PROJECT: 'Dự án',
  PERFORMANCE: 'Hiệu suất',
  OTHER: 'Khác',
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard')
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Chào mừng trở lại, {session?.user?.name || 'Admin'}!
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng nhân viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.totalEmployees || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{data?.stats.activeEmployees || 0}</span> đang làm ·{' '}
              <span className="text-gray-500">{data?.stats.inactiveEmployees || 0}</span> nghỉ việc
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng quỹ lương</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(data?.stats.totalSalaryExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground">VNĐ / tháng</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phòng ban</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.totalDepartments || 0}</div>
            <p className="text-xs text-muted-foreground">phòng ban hoạt động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thưởng chờ duyệt</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{data?.stats.pendingBonuses || 0}</div>
            <p className="text-xs text-muted-foreground">đề xuất đang chờ</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Department Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Nhân viên theo phòng ban
            </CardTitle>
            <CardDescription>Top 5 phòng ban có nhiều nhân viên nhất</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.departmentStats && data.departmentStats.length > 0 ? (
              <div className="space-y-4">
                {data.departmentStats.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{dept.code}</Badge>
                      <span className="text-sm font-medium">{dept.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${Math.min(
                              100,
                              (dept.employeeCount / (data?.stats.totalEmployees || 1)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-medium">{dept.employeeCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Building2 className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Chưa có dữ liệu phòng ban</p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <Link href="/dashboard/departments">
                <Button variant="ghost" size="sm" className="w-full">
                  Xem tất cả phòng ban
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Employees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Nhân viên mới
            </CardTitle>
            <CardDescription>Nhân viên được thêm gần đây</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.recentEmployees && data.recentEmployees.length > 0 ? (
              <div className="space-y-4">
                {data.recentEmployees.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{emp.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {emp.department?.name || 'Chưa có phòng ban'} · {emp.position?.name || 'Chưa có chức vụ'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{emp.employeeCode}</Badge>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(emp.startDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Chưa có nhân viên nào</p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <Link href="/dashboard/employees">
                <Button variant="ghost" size="sm" className="w-full">
                  Xem tất cả nhân viên
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Pending Bonuses */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Thưởng chờ duyệt
            </CardTitle>
            <CardDescription>Các đề xuất thưởng đang chờ phê duyệt</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.pendingBonusList && data.pendingBonusList.length > 0 ? (
              <div className="space-y-4">
                {data.pendingBonusList.map((bonus) => (
                  <div key={bonus.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                        <Gift className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {bonus.employee.fullName}{' '}
                          <span className="text-muted-foreground">({bonus.employee.employeeCode})</span>
                        </p>
                        <p className="text-sm text-muted-foreground">{bonus.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">{bonusTypeLabels[bonus.type] || bonus.type}</Badge>
                      <p className="mt-1 font-mono text-sm font-medium">{formatFullCurrency(Number(bonus.amount))}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Gift className="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Không có thưởng chờ duyệt</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
