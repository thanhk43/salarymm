'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  CreditCard,
  Shield,
  Calendar,
  Wallet,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

interface ProfileData {
  id: string
  email: string
  name: string
  role: string
  employee: {
    id: string
    employeeCode: string
    fullName: string
    email: string
    phone: string | null
    idNumber: string | null
    dateOfBirth: string | null
    startDate: string
    bankName: string | null
    bankAccount: string | null
    socialInsuranceNumber: string | null
    status: string
    department: { name: string } | null
    position: { name: string } | null
    salaryStructures: {
      baseSalary: string
      effectiveDate: string
      hasSocialInsurance: boolean
      hasHealthInsurance: boolean
      hasUnemploymentInsurance: boolean
    }[]
    allowances: { type: string; amount: string }[]
  } | null
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const allowanceTypeLabels: Record<string, string> = {
  lunch: 'Ăn trưa',
  transport: 'Đi lại',
  phone: 'Điện thoại',
  housing: 'Nhà ở',
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          setProfile(data)
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Không thể tải thông tin hồ sơ
      </div>
    )
  }

  const emp = profile.employee
  const salary = emp?.salaryStructures?.[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-muted-foreground">Thông tin cá nhân và tài khoản</p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {profile.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{emp?.fullName || profile.name}</h2>
              <p className="text-muted-foreground">{emp?.employeeCode || profile.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={emp?.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {emp?.status === 'ACTIVE' ? 'Đang làm việc' : 'Nghỉ việc'}
                </Badge>
                <Badge variant="outline">{profile.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={emp?.email || profile.email} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Số điện thoại" value={emp?.phone || 'Chưa cập nhật'} />
            <InfoRow icon={<Shield className="h-4 w-4" />} label="CCCD/CMND" value={emp?.idNumber || 'Chưa cập nhật'} />
            <InfoRow
              icon={<Calendar className="h-4 w-4" />}
              label="Ngày sinh"
              value={emp?.dateOfBirth ? formatDate(emp.dateOfBirth) : 'Chưa cập nhật'}
            />
            <InfoRow
              icon={<Calendar className="h-4 w-4" />}
              label="Ngày vào làm"
              value={emp?.startDate ? formatDate(emp.startDate) : 'Chưa cập nhật'}
            />
          </CardContent>
        </Card>

        {/* Work Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Thông tin công việc
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={<Building2 className="h-4 w-4" />} label="Phòng ban" value={emp?.department?.name || 'Chưa phân bổ'} />
            <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Chức vụ" value={emp?.position?.name || 'Chưa phân bổ'} />
            <InfoRow icon={<Shield className="h-4 w-4" />} label="Mã BHXH" value={emp?.socialInsuranceNumber || 'Chưa cập nhật'} />

            <Separator />

            <InfoRow icon={<CreditCard className="h-4 w-4" />} label="Ngân hàng" value={emp?.bankName || 'Chưa cập nhật'} />
            <InfoRow icon={<CreditCard className="h-4 w-4" />} label="Số tài khoản" value={emp?.bankAccount || 'Chưa cập nhật'} />
          </CardContent>
        </Card>

        {/* Salary Info */}
        {salary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Thông tin lương
              </CardTitle>
              <CardDescription>Cấu trúc lương hiện tại</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Lương cơ bản</span>
                <span className="font-mono font-medium">{formatCurrency(salary.baseSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ngày hiệu lực</span>
                <span className="text-sm">{formatDate(salary.effectiveDate)}</span>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Bảo hiểm</p>
                <div className="flex items-center gap-2">
                  <Badge variant={salary.hasSocialInsurance ? 'default' : 'secondary'}>
                    BHXH {salary.hasSocialInsurance ? '8%' : 'Không'}
                  </Badge>
                  <Badge variant={salary.hasHealthInsurance ? 'default' : 'secondary'}>
                    BHYT {salary.hasHealthInsurance ? '1.5%' : 'Không'}
                  </Badge>
                  <Badge variant={salary.hasUnemploymentInsurance ? 'default' : 'secondary'}>
                    BHTN {salary.hasUnemploymentInsurance ? '1%' : 'Không'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Allowances */}
        {emp?.allowances && emp.allowances.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Phụ cấp
              </CardTitle>
              <CardDescription>Các khoản phụ cấp đang hưởng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {emp.allowances.map((a, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-sm">{allowanceTypeLabels[a.type] || a.type}</span>
                  <span className="font-mono text-sm font-medium">{formatCurrency(a.amount)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Tổng phụ cấp</span>
                <span className="font-mono">
                  {formatCurrency(emp.allowances.reduce((sum, a) => sum + parseFloat(a.amount), 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
