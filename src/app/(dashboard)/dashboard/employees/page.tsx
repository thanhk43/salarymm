'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2, Loader2, Users, Eye } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'

interface Department {
  id: string
  code: string
  name: string
}

interface Position {
  id: string
  name: string
  baseSalary: string
}

interface Employee {
  id: string
  employeeCode: string
  fullName: string
  email: string
  phone: string | null
  status: 'ACTIVE' | 'INACTIVE'
  startDate: string
  department: Department | null
  position: Position | null
  salaryStructures: { baseSalary: string }[]
}

interface EmployeeResponse {
  data: Employee[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const employeeSchema = z.object({
  employeeCode: z.string().min(1, 'Mã nhân viên không được để trống'),
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  idNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  startDate: z.string().min(1, 'Ngày bắt đầu không được để trống'),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  socialInsuranceNumber: z.string().optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  baseSalary: z.string().optional(),
  createAccount: z.boolean().optional(),
})

type EmployeeFormData = z.infer<typeof employeeSchema>

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('vi-VN')
}

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      createAccount: true,
    },
  })

  const createAccount = watch('createAccount')

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments?limit=100')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.data)
      }
    } catch {
      console.error('Failed to fetch departments')
    }
  }

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/positions?limit=100')
      if (response.ok) {
        const data = await response.json()
        setPositions(data.data)
      }
    } catch {
      console.error('Failed to fetch positions')
    }
  }

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery }),
        ...(filterDepartment && { departmentId: filterDepartment }),
        ...(filterStatus && { status: filterStatus }),
      })

      const response = await fetch(`/api/employees?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: EmployeeResponse = await response.json()
      setEmployees(data.data)
      setTotalPages(data.meta.totalPages)
      setTotal(data.meta.total)
    } catch {
      toast.error('Không thể tải danh sách nhân viên')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchQuery, filterDepartment, filterStatus])

  useEffect(() => {
    fetchDepartments()
    fetchPositions()
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchEmployees()
  }

  const openCreateDialog = () => {
    setSelectedEmployee(null)
    reset({
      employeeCode: '',
      fullName: '',
      email: '',
      phone: '',
      idNumber: '',
      dateOfBirth: '',
      startDate: new Date().toISOString().split('T')[0],
      bankName: '',
      bankAccount: '',
      socialInsuranceNumber: '',
      departmentId: '',
      positionId: '',
      baseSalary: '',
      createAccount: true,
    })
    setIsFormOpen(true)
  }

  const openEditDialog = async (employee: Employee) => {
    setSelectedEmployee(employee)
    // Fetch full employee details
    try {
      const response = await fetch(`/api/employees/${employee.id}`)
      if (response.ok) {
        const fullEmployee = await response.json()
        reset({
          employeeCode: fullEmployee.employeeCode,
          fullName: fullEmployee.fullName,
          email: fullEmployee.email,
          phone: fullEmployee.phone || '',
          idNumber: fullEmployee.idNumber || '',
          dateOfBirth: fullEmployee.dateOfBirth?.split('T')[0] || '',
          startDate: fullEmployee.startDate?.split('T')[0] || '',
          bankName: fullEmployee.bankName || '',
          bankAccount: fullEmployee.bankAccount || '',
          socialInsuranceNumber: fullEmployee.socialInsuranceNumber || '',
          departmentId: fullEmployee.departmentId || '',
          positionId: fullEmployee.positionId || '',
          baseSalary: fullEmployee.salaryStructures?.[0]?.baseSalary || '',
          createAccount: false,
        })
        setIsFormOpen(true)
      }
    } catch {
      toast.error('Không thể tải thông tin nhân viên')
    }
  }

  const openDeleteDialog = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsDeleteOpen(true)
  }

  const onSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true)
    try {
      const url = selectedEmployee ? `/api/employees/${selectedEmployee.id}` : '/api/employees'

      const payload = {
        ...data,
        baseSalary: data.baseSalary ? parseFloat(data.baseSalary.replace(/[^\d]/g, '')) : undefined,
        departmentId: data.departmentId || undefined,
        positionId: data.positionId || undefined,
      }

      const response = await fetch(url, {
        method: selectedEmployee ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success(selectedEmployee ? 'Cập nhật nhân viên thành công' : 'Thêm nhân viên thành công')
      setIsFormOpen(false)
      fetchEmployees()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedEmployee) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success('Xóa nhân viên thành công')
      setIsDeleteOpen(false)
      fetchEmployees()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Nhân viên</h1>
          <p className="text-muted-foreground">Quản lý thông tin nhân viên trong công ty</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm nhân viên
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Danh sách nhân viên
          </CardTitle>
          <CardDescription>Tổng cộng {total} nhân viên</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-4 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã, tên, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Phòng ban" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="ACTIVE">Đang làm</SelectItem>
                <SelectItem value="INACTIVE">Nghỉ việc</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary">
              Tìm kiếm
            </Button>
          </form>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Không có nhân viên nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Mã NV</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Phòng ban</TableHead>
                    <TableHead>Chức vụ</TableHead>
                    <TableHead className="text-right">Lương cơ bản</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="w-[120px] text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <Badge variant="outline">{emp.employeeCode}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{emp.fullName}</p>
                          <p className="text-sm text-muted-foreground">{emp.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{emp.department?.name || '-'}</TableCell>
                      <TableCell>{emp.position?.name || '-'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {emp.salaryStructures?.[0]?.baseSalary
                          ? formatCurrency(emp.salaryStructures[0].baseSalary)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={emp.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {emp.status === 'ACTIVE' ? 'Đang làm' : 'Nghỉ việc'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/employees/${emp.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(emp)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(emp)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEmployee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}</DialogTitle>
            <DialogDescription>
              {selectedEmployee ? 'Cập nhật thông tin nhân viên' : 'Điền thông tin để tạo nhân viên mới'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeCode">Mã nhân viên *</Label>
                <Input
                  id="employeeCode"
                  placeholder="VD: NV001"
                  {...register('employeeCode')}
                  disabled={isSubmitting}
                />
                {errors.employeeCode && <p className="text-sm text-destructive">{errors.employeeCode.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên *</Label>
                <Input
                  id="fullName"
                  placeholder="VD: Nguyễn Văn A"
                  {...register('fullName')}
                  disabled={isSubmitting}
                />
                {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="VD: nguyen.a@company.com"
                  {...register('email')}
                  disabled={isSubmitting}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  placeholder="VD: 0901234567"
                  {...register('phone')}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idNumber">Số CCCD/CMND</Label>
                <Input
                  id="idNumber"
                  placeholder="VD: 001234567890"
                  {...register('idNumber')}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth')}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Ngày bắt đầu làm việc *</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                  disabled={isSubmitting}
                />
                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="socialInsuranceNumber">Mã số BHXH</Label>
                <Input
                  id="socialInsuranceNumber"
                  placeholder="VD: BHXH001"
                  {...register('socialInsuranceNumber')}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departmentId">Phòng ban</Label>
                <Select
                  value={watch('departmentId') || ''}
                  onValueChange={(value) => setValue('departmentId', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="positionId">Chức vụ</Label>
                <Select
                  value={watch('positionId') || ''}
                  onValueChange={(value) => setValue('positionId', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chức vụ" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((pos) => (
                      <SelectItem key={pos.id} value={pos.id}>
                        {pos.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Ngân hàng</Label>
                <Input
                  id="bankName"
                  placeholder="VD: Vietcombank"
                  {...register('bankName')}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankAccount">Số tài khoản</Label>
                <Input
                  id="bankAccount"
                  placeholder="VD: 1234567890123"
                  {...register('bankAccount')}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {!selectedEmployee && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="baseSalary">Lương cơ bản (VNĐ)</Label>
                  <Input
                    id="baseSalary"
                    placeholder="VD: 15000000"
                    {...register('baseSalary')}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="createAccount"
                    checked={createAccount}
                    onCheckedChange={(checked) => setValue('createAccount', checked as boolean)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="createAccount" className="text-sm font-normal">
                    Tạo tài khoản đăng nhập cho nhân viên (mật khẩu mặc định: employee123)
                  </Label>
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedEmployee ? 'Cập nhật' : 'Thêm mới'}
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
              Bạn có chắc chắn muốn xóa nhân viên <strong>{selectedEmployee?.fullName}</strong>? Tất cả dữ liệu liên quan
              (lương, phụ cấp, thưởng) cũng sẽ bị xóa. Hành động này không thể hoàn tác.
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
