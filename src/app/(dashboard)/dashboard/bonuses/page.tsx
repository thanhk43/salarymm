'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Check, X, Loader2, Gift, Eye } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Employee {
  id: string
  employeeCode: string
  fullName: string
  department: { name: string } | null
}

interface Bonus {
  id: string
  type: string
  amount: string
  reason: string
  month: number
  year: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedAt: string | null
  createdAt: string
  employee: {
    id: string
    employeeCode: string
    fullName: string
    department: { name: string } | null
  }
  approvedBy: {
    id: string
    name: string
  } | null
}

interface BonusResponse {
  data: Bonus[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const bonusSchema = z.object({
  employeeId: z.string().min(1, 'Vui lòng chọn nhân viên'),
  type: z.string().min(1, 'Vui lòng chọn loại thưởng'),
  amount: z.string().min(1, 'Số tiền không được để trống'),
  reason: z.string().min(1, 'Lý do không được để trống'),
  month: z.string().min(1, 'Vui lòng chọn tháng'),
  year: z.string().min(1, 'Vui lòng chọn năm'),
})

type BonusFormData = z.infer<typeof bonusSchema>

const bonusTypes = [
  { value: 'MONTHLY', label: 'Thưởng hàng tháng' },
  { value: 'QUARTERLY', label: 'Thưởng quý' },
  { value: 'ANNUAL', label: 'Thưởng năm' },
  { value: 'TET', label: 'Thưởng Tết' },
  { value: 'PROJECT', label: 'Thưởng dự án' },
  { value: 'PERFORMANCE', label: 'Thưởng hiệu suất' },
  { value: 'OTHER', label: 'Khác' },
]

const bonusTypeLabels: Record<string, string> = {
  MONTHLY: 'Hàng tháng',
  QUARTERLY: 'Quý',
  ANNUAL: 'Năm',
  TET: 'Tết',
  PROJECT: 'Dự án',
  PERFORMANCE: 'Hiệu suất',
  OTHER: 'Khác',
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  PENDING: { label: 'Chờ duyệt', variant: 'secondary' },
  APPROVED: { label: 'Đã duyệt', variant: 'default' },
  REJECTED: { label: 'Từ chối', variant: 'destructive' },
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
const months = Array.from({ length: 12 }, (_, i) => i + 1)

export default function BonusesPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterYear, setFilterYear] = useState(currentYear.toString())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedBonus, setSelectedBonus] = useState<Bonus | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApproving, setIsApproving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BonusFormData>({
    resolver: zodResolver(bonusSchema),
    defaultValues: {
      month: (new Date().getMonth() + 1).toString(),
      year: currentYear.toString(),
    },
  })

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees?limit=100&status=ACTIVE')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.data)
      }
    } catch {
      console.error('Failed to fetch employees')
    }
  }

  const fetchBonuses = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filterStatus && filterStatus !== 'all' && { status: filterStatus }),
        ...(filterType && filterType !== 'all' && { type: filterType }),
        ...(filterYear && { year: filterYear }),
      })

      const response = await fetch(`/api/bonuses?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: BonusResponse = await response.json()
      setBonuses(data.data)
      setTotalPages(data.meta.totalPages)
      setTotal(data.meta.total)
    } catch {
      toast.error('Không thể tải danh sách thưởng')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, filterStatus, filterType, filterYear])

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    fetchBonuses()
  }, [fetchBonuses])

  const openCreateDialog = () => {
    setSelectedBonus(null)
    reset({
      employeeId: '',
      type: '',
      amount: '',
      reason: '',
      month: (new Date().getMonth() + 1).toString(),
      year: currentYear.toString(),
    })
    setIsFormOpen(true)
  }

  const openViewDialog = (bonus: Bonus) => {
    setSelectedBonus(bonus)
    setIsViewOpen(true)
  }

  const onSubmit = async (data: BonusFormData) => {
    setIsSubmitting(true)
    try {
      const payload = {
        employeeId: data.employeeId,
        type: data.type,
        amount: parseFloat(data.amount.replace(/[^\d]/g, '')),
        reason: data.reason,
        month: parseInt(data.month),
        year: parseInt(data.year),
      }

      const response = await fetch('/api/bonuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success('Thêm thưởng thành công')
      setIsFormOpen(false)
      fetchBonuses()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async (bonusId: string, status: 'APPROVED' | 'REJECTED') => {
    setIsApproving(true)
    try {
      const response = await fetch(`/api/bonuses/${bonusId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success(status === 'APPROVED' ? 'Đã phê duyệt thưởng' : 'Đã từ chối thưởng')
      setIsViewOpen(false)
      fetchBonuses()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Thưởng</h1>
          <p className="text-muted-foreground">Quản lý các khoản thưởng cho nhân viên</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm thưởng
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {bonuses.filter((b) => b.status === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">khoản thưởng đang chờ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {bonuses.filter((b) => b.status === 'APPROVED').length}
            </div>
            <p className="text-xs text-muted-foreground">khoản thưởng đã phê duyệt</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng tiền thưởng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {formatCurrency(
                bonuses
                  .filter((b) => b.status === 'APPROVED')
                  .reduce((sum, b) => sum + parseFloat(b.amount), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">đã duyệt trong kỳ</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Danh sách thưởng
          </CardTitle>
          <CardDescription>Tổng cộng {total} khoản thưởng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                <SelectItem value="REJECTED">Từ chối</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại thưởng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {bonusTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={(v) => { setFilterYear(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bonuses.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Gift className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Không có khoản thưởng nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Loại thưởng</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead>Tháng/Năm</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bonuses.map((bonus) => (
                    <TableRow key={bonus.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{bonus.employee.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            {bonus.employee.employeeCode} · {bonus.employee.department?.name || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{bonusTypeLabels[bonus.type]}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(bonus.amount)}</TableCell>
                      <TableCell>
                        {bonus.month}/{bonus.year}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusLabels[bonus.status].variant}>
                          {statusLabels[bonus.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openViewDialog(bonus)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {bonus.status === 'PENDING' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleApprove(bonus.id, 'APPROVED')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleApprove(bonus.id, 'REJECTED')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Trang {currentPage} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm thưởng mới</DialogTitle>
            <DialogDescription>Tạo đề xuất thưởng cho nhân viên</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Nhân viên *</Label>
              <Select
                value={watch('employeeId')}
                onValueChange={(value) => setValue('employeeId', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employeeId && <p className="text-sm text-destructive">{errors.employeeId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Loại thưởng *</Label>
                <Select
                  value={watch('type')}
                  onValueChange={(value) => setValue('type', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {bonusTypes.map((type) => (
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
                  placeholder="VD: 2000000"
                  {...register('amount')}
                  disabled={isSubmitting}
                />
                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Tháng *</Label>
                <Select
                  value={watch('month')}
                  onValueChange={(value) => setValue('month', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tháng" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        Tháng {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Năm *</Label>
                <Select
                  value={watch('year')}
                  onValueChange={(value) => setValue('year', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn năm" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Lý do *</Label>
              <Textarea
                id="reason"
                placeholder="VD: Hoàn thành xuất sắc công việc Q4/2025"
                {...register('reason')}
                disabled={isSubmitting}
              />
              {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Thêm mới
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết thưởng</DialogTitle>
          </DialogHeader>
          {selectedBonus && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nhân viên</p>
                  <p className="font-medium">{selectedBonus.employee.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedBonus.employee.employeeCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phòng ban</p>
                  <p className="font-medium">{selectedBonus.employee.department?.name || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Loại thưởng</p>
                  <Badge variant="outline">{bonusTypeLabels[selectedBonus.type]}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số tiền</p>
                  <p className="font-mono font-medium">{formatCurrency(selectedBonus.amount)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tháng/Năm</p>
                  <p className="font-medium">
                    {selectedBonus.month}/{selectedBonus.year}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <Badge variant={statusLabels[selectedBonus.status].variant}>
                    {statusLabels[selectedBonus.status].label}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lý do</p>
                <p className="font-medium">{selectedBonus.reason}</p>
              </div>
              {selectedBonus.approvedBy && (
                <div>
                  <p className="text-sm text-muted-foreground">Người duyệt</p>
                  <p className="font-medium">{selectedBonus.approvedBy.name}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedBonus?.status === 'PENDING' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleApprove(selectedBonus.id, 'REJECTED')}
                  disabled={isApproving}
                >
                  {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <X className="mr-2 h-4 w-4" />
                  Từ chối
                </Button>
                <Button onClick={() => handleApprove(selectedBonus.id, 'APPROVED')} disabled={isApproving}>
                  {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Check className="mr-2 h-4 w-4" />
                  Phê duyệt
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                Đóng
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
