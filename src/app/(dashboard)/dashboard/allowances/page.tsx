'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2, Loader2, Wallet, Eye } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
}

interface Allowance {
  id: string
  type: string
  amount: string
  description: string | null
  isActive: boolean
  employee: Employee
}

interface AllowanceResponse {
  data: Allowance[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const allowanceSchema = z.object({
  employeeId: z.string().min(1, 'Vui lòng chọn nhân viên'),
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

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

export default function AllowancesPage() {
  const router = useRouter()
  const [allowances, setAllowances] = useState<Allowance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedAllowance, setSelectedAllowance] = useState<Allowance | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees?limit=1000&status=ACTIVE')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.data)
      }
    } catch {
      console.error('Failed to fetch employees')
    }
  }

  const fetchAllowances = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filterEmployee && filterEmployee !== 'all' && { employeeId: filterEmployee }),
        ...(filterStatus && filterStatus !== 'all' && { isActive: filterStatus }),
      })

      const response = await fetch(`/api/allowances?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: AllowanceResponse = await response.json()
      setAllowances(data.data)
      setTotalPages(data.meta.totalPages)
      setTotal(data.meta.total)
    } catch {
      toast.error('Không thể tải danh sách phụ cấp')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, filterEmployee, filterStatus])

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    fetchAllowances()
  }, [fetchAllowances])

  const openCreateDialog = () => {
    setSelectedAllowance(null)
    reset({
      employeeId: '',
      type: '',
      amount: '',
      description: '',
    })
    setIsFormOpen(true)
  }

  const openEditDialog = (allowance: Allowance) => {
    setSelectedAllowance(allowance)
    reset({
      employeeId: allowance.employee.id,
      type: allowance.type,
      amount: allowance.amount,
      description: allowance.description || '',
    })
    setIsFormOpen(true)
  }

  const openDeleteDialog = (allowance: Allowance) => {
    setSelectedAllowance(allowance)
    setIsDeleteOpen(true)
  }

  const onSubmit = async (data: AllowanceFormData) => {
    setIsSubmitting(true)
    try {
      const url = selectedAllowance ? `/api/allowances/${selectedAllowance.id}` : '/api/allowances'

      const payload = {
        ...(selectedAllowance ? {} : { employeeId: data.employeeId }),
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
      setIsFormOpen(false)
      fetchAllowances()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedAllowance) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/allowances/${selectedAllowance.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success('Xóa phụ cấp thành công')
      setIsDeleteOpen(false)
      fetchAllowances()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggleStatus = async (allowance: Allowance) => {
    try {
      const response = await fetch(`/api/allowances/${allowance.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !allowance.isActive }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success(allowance.isActive ? 'Đã ngừng phụ cấp' : 'Đã kích hoạt phụ cấp')
      fetchAllowances()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    }
  }

  // Calculate totals
  const totalActiveAllowances = allowances.filter((a) => a.isActive).reduce((sum, a) => sum + parseFloat(a.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Phụ cấp</h1>
          <p className="text-muted-foreground">Quản lý các khoản phụ cấp của nhân viên</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm phụ cấp
        </Button>
      </div>

      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng số phụ cấp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">khoản phụ cấp đang quản lý</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi phụ cấp/tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalActiveAllowances)}</div>
            <p className="text-xs text-muted-foreground">các phụ cấp đang hoạt động</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Danh sách phụ cấp
          </CardTitle>
          <CardDescription>Tất cả các khoản phụ cấp của nhân viên</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Select value={filterEmployee} onValueChange={(value) => { setFilterEmployee(value); setCurrentPage(1) }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Nhân viên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhân viên</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); setCurrentPage(1) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Đang hoạt động</SelectItem>
                <SelectItem value="false">Đã ngừng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : allowances.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Wallet className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Không có phụ cấp nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Loại phụ cấp</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="w-[120px] text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allowances.map((allowance) => (
                    <TableRow key={allowance.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{allowance.employee.fullName}</p>
                          <p className="text-sm text-muted-foreground">{allowance.employee.employeeCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{allowanceTypeLabels[allowance.type] || allowance.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(allowance.amount)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {allowance.description || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={allowance.isActive ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => handleToggleStatus(allowance)}
                        >
                          {allowance.isActive ? 'Hoạt động' : 'Ngừng'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/dashboard/employees/${allowance.employee.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(allowance)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(allowance)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedAllowance ? 'Chỉnh sửa phụ cấp' : 'Thêm phụ cấp mới'}</DialogTitle>
            <DialogDescription>
              {selectedAllowance ? 'Cập nhật thông tin phụ cấp' : 'Điền thông tin để tạo phụ cấp mới'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!selectedAllowance && (
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
            )}
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
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa phụ cấp <strong>{allowanceTypeLabels[selectedAllowance?.type || '']}</strong> của{' '}
              <strong>{selectedAllowance?.employee.fullName}</strong>? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
