'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Building2,
  Briefcase,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Employee {
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
  status: 'ACTIVE' | 'INACTIVE'
  department: { id: string; code: string; name: string } | null
  position: { id: string; name: string; baseSalary: string } | null
  user: { id: string; email: string; role: string } | null
  salaryStructures: {
    id: string
    baseSalary: string
    effectiveDate: string
    hasSocialInsurance: boolean
    hasHealthInsurance: boolean
    hasUnemploymentInsurance: boolean
  }[]
  allowances: {
    id: string
    type: string
    amount: string
    description: string | null
    isActive: boolean
  }[]
  bonuses: {
    id: string
    type: string
    amount: string
    reason: string
    month: number
    year: number
    status: string
  }[]
}

interface Allowance {
  id: string
  type: string
  amount: string
  description: string | null
  isActive: boolean
}

const allowanceSchema = z.object({
  type: z.string().min(1, 'Loại phụ cấp không được để trống'),
  amount: z.string().min(1, 'Số tiền không được để trống'),
  description: z.string().optional(),
})

type AllowanceFormData = z.infer<typeof allowanceSchema>

const allowanceTypes = [
  { value: 'lunch', label: 'Phụ cấp ăn trưa' },
  { value: 'transport', label: 'Phụ cấp xăng xe' },
  { value: 'phone', label: 'Phụ cấp điện thoại' },
  { value: 'housing', label: 'Phụ cấp nhà ở' },
  { value: 'responsibility', label: 'Phụ cấp trách nhiệm' },
  { value: 'toxic', label: 'Phụ cấp độc hại' },
  { value: 'other', label: 'Phụ cấp khác' },
]

const allowanceTypeLabels: Record<string, string> = {
  lunch: 'Ăn trưa',
  transport: 'Xăng xe',
  phone: 'Điện thoại',
  housing: 'Nhà ở',
  responsibility: 'Trách nhiệm',
  toxic: 'Độc hại',
  other: 'Khác',
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

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.id as string

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Allowance dialog states
  const [isAllowanceOpen, setIsAllowanceOpen] = useState(false)
  const [isDeleteAllowanceOpen, setIsDeleteAllowanceOpen] = useState(false)
  const [selectedAllowance, setSelectedAllowance] = useState<Allowance | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AllowanceFormData>({
    resolver: zodResolver(allowanceSchema),
  })

  const fetchEmployee = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/employees/${employeeId}`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Không tìm thấy nhân viên')
          router.push('/dashboard/employees')
          return
        }
        throw new Error('Failed to fetch')
      }
      const data = await response.json()
      setEmployee(data)
    } catch {
      toast.error('Không thể tải thông tin nhân viên')
    } finally {
      setIsLoading(false)
    }
  }, [employeeId, router])

  useEffect(() => {
    fetchEmployee()
  }, [fetchEmployee])

  const openAddAllowance = () => {
    setSelectedAllowance(null)
    reset({ type: '', amount: '', description: '' })
    setIsAllowanceOpen(true)
  }

  const openEditAllowance = (allowance: Allowance) => {
    setSelectedAllowance(allowance)
    reset({
      type: allowance.type,
      amount: allowance.amount,
      description: allowance.description || '',
    })
    setIsAllowanceOpen(true)
  }

  const openDeleteAllowance = (allowance: Allowance) => {
    setSelectedAllowance(allowance)
    setIsDeleteAllowanceOpen(true)
  }

  const onSubmitAllowance = async (data: AllowanceFormData) => {
    setIsSubmitting(true)
    try {
      const url = selectedAllowance
        ? `/api/allowances/${selectedAllowance.id}`
        : '/api/allowances'

      const payload = {
        ...(selectedAllowance ? {} : { employeeId }),
        type: data.type,
        amount: parseFloat(data.amount.replace(/[^\d]/g, '')),
        description: data.description || undefined,
      }

      const response = await fetch(url, {
        method: selectedAllowance ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success(selectedAllowance ? 'Cập nhật phụ cấp thành công' : 'Thêm phụ cấp thành công')
      setIsAllowanceOpen(false)
      fetchEmployee()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAllowance = async () => {
    if (!selectedAllowance) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/allowances/${selectedAllowance.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success('Xóa phụ cấp thành công')
      setIsDeleteAllowanceOpen(false)
      fetchEmployee()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!employee) {
    return null
  }

  const currentSalary = employee.salaryStructures[0]
  const totalAllowances = employee.allowances
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + parseFloat(a.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{employee.fullName}</h1>
          <p className="text-muted-foreground">
            {employee.employeeCode} · {employee.department?.name || 'Chưa có phòng ban'}
          </p>
        </div>
        <div className="ml-auto">
          <Badge variant={employee.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {employee.status === 'ACTIVE' ? 'Đang làm' : 'Nghỉ việc'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Employee Info Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin cá nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {employee.fullName.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{employee.fullName}</p>
                <p className="text-sm text-muted-foreground">{employee.position?.name || 'Chưa có chức vụ'}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{employee.email}</span>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{employee.department?.name || 'Chưa có phòng ban'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{employee.position?.name || 'Chưa có chức vụ'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Bắt đầu: {formatDate(employee.startDate)}</span>
              </div>
              {employee.idNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>CCCD: {employee.idNumber}</span>
                </div>
              )}
            </div>

            {employee.bankAccount && (
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium">Thông tin ngân hàng</p>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {employee.bankName} - {employee.bankAccount}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="salary" className="space-y-4">
            <TabsList>
              <TabsTrigger value="salary">Lương & Phụ cấp</TabsTrigger>
              <TabsTrigger value="bonuses">Thưởng</TabsTrigger>
            </TabsList>

            <TabsContent value="salary" className="space-y-4">
              {/* Current Salary */}
              <Card>
                <CardHeader>
                  <CardTitle>Cấu trúc lương hiện tại</CardTitle>
                  <CardDescription>
                    {currentSalary
                      ? `Có hiệu lực từ ${formatDate(currentSalary.effectiveDate)}`
                      : 'Chưa có cấu trúc lương'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {currentSalary ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-muted/50 p-4">
                          <p className="text-sm text-muted-foreground">Lương cơ bản</p>
                          <p className="text-2xl font-bold font-mono">{formatCurrency(currentSalary.baseSalary)}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-4">
                          <p className="text-sm text-muted-foreground">Tổng phụ cấp</p>
                          <p className="text-2xl font-bold font-mono text-green-600">
                            +{formatCurrency(totalAllowances)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {currentSalary.hasSocialInsurance && <Badge variant="outline">BHXH</Badge>}
                        {currentSalary.hasHealthInsurance && <Badge variant="outline">BHYT</Badge>}
                        {currentSalary.hasUnemploymentInsurance && <Badge variant="outline">BHTN</Badge>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Chưa thiết lập cấu trúc lương</p>
                  )}
                </CardContent>
              </Card>

              {/* Allowances */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Phụ cấp</CardTitle>
                    <CardDescription>Danh sách các khoản phụ cấp của nhân viên</CardDescription>
                  </div>
                  <Button size="sm" onClick={openAddAllowance}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm phụ cấp
                  </Button>
                </CardHeader>
                <CardContent>
                  {employee.allowances.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Chưa có phụ cấp nào</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loại phụ cấp</TableHead>
                          <TableHead className="text-right">Số tiền</TableHead>
                          <TableHead>Mô tả</TableHead>
                          <TableHead className="text-center">Trạng thái</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employee.allowances.map((allowance) => (
                          <TableRow key={allowance.id}>
                            <TableCell className="font-medium">
                              {allowanceTypeLabels[allowance.type] || allowance.type}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(allowance.amount)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{allowance.description || '-'}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={allowance.isActive ? 'default' : 'secondary'}>
                                {allowance.isActive ? 'Hoạt động' : 'Ngừng'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEditAllowance(allowance)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  onClick={() => openDeleteAllowance(allowance)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bonuses">
              <Card>
                <CardHeader>
                  <CardTitle>Lịch sử thưởng</CardTitle>
                  <CardDescription>Các khoản thưởng gần đây</CardDescription>
                </CardHeader>
                <CardContent>
                  {employee.bonuses.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Chưa có khoản thưởng nào</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loại thưởng</TableHead>
                          <TableHead>Tháng/Năm</TableHead>
                          <TableHead className="text-right">Số tiền</TableHead>
                          <TableHead>Lý do</TableHead>
                          <TableHead className="text-center">Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employee.bonuses.map((bonus) => (
                          <TableRow key={bonus.id}>
                            <TableCell>
                              <Badge variant="outline">{bonusTypeLabels[bonus.type]}</Badge>
                            </TableCell>
                            <TableCell>
                              {bonus.month}/{bonus.year}
                            </TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(bonus.amount)}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{bonus.reason}</TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  bonus.status === 'APPROVED'
                                    ? 'default'
                                    : bonus.status === 'REJECTED'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                              >
                                {bonus.status === 'APPROVED'
                                  ? 'Đã duyệt'
                                  : bonus.status === 'REJECTED'
                                    ? 'Từ chối'
                                    : 'Chờ duyệt'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Add/Edit Allowance Dialog */}
      <Dialog open={isAllowanceOpen} onOpenChange={setIsAllowanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAllowance ? 'Chỉnh sửa phụ cấp' : 'Thêm phụ cấp'}</DialogTitle>
            <DialogDescription>
              {selectedAllowance ? 'Cập nhật thông tin phụ cấp' : 'Thêm phụ cấp mới cho nhân viên'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitAllowance)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Loại phụ cấp *</Label>
              <Select
                value={watch('type')}
                onValueChange={(value) => setValue('type', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại phụ cấp" />
                </SelectTrigger>
                <SelectContent>
                  {allowanceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền (VNĐ) *</Label>
              <Input
                id="amount"
                placeholder="VD: 500000"
                {...register('amount')}
                disabled={isSubmitting}
              />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                placeholder="Mô tả phụ cấp (tùy chọn)"
                {...register('description')}
                disabled={isSubmitting}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAllowanceOpen(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedAllowance ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Allowance Dialog */}
      <Dialog open={isDeleteAllowanceOpen} onOpenChange={setIsDeleteAllowanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa phụ cấp này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteAllowanceOpen(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllowance} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
