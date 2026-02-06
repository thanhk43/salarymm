'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Pencil, Trash2, Loader2, Building2 } from 'lucide-react'
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

interface Department {
  id: string
  code: string
  name: string
  description: string | null
  createdAt: string
  _count: {
    employees: number
  }
}

interface DepartmentResponse {
  data: Department[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const departmentSchema = z.object({
  code: z.string().min(1, 'Mã phòng ban không được để trống').max(10, 'Mã phòng ban tối đa 10 ký tự'),
  name: z.string().min(1, 'Tên phòng ban không được để trống').max(100, 'Tên phòng ban tối đa 100 ký tự'),
  description: z.string().optional(),
})

type DepartmentFormData = z.infer<typeof departmentSchema>

export default function DepartmentsPage() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
  })

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await fetch(`/api/departments?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: DepartmentResponse = await response.json()
      setDepartments(data.data)
      setTotalPages(data.meta.totalPages)
      setTotal(data.meta.total)
    } catch {
      toast.error('Không thể tải danh sách phòng ban')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchQuery])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchDepartments()
  }

  const openCreateDialog = () => {
    setSelectedDepartment(null)
    reset({ code: '', name: '', description: '' })
    setIsFormOpen(true)
  }

  const openEditDialog = (department: Department) => {
    setSelectedDepartment(department)
    reset({
      code: department.code,
      name: department.name,
      description: department.description || '',
    })
    setIsFormOpen(true)
  }

  const openDeleteDialog = (department: Department) => {
    setSelectedDepartment(department)
    setIsDeleteOpen(true)
  }

  const onSubmit = async (data: DepartmentFormData) => {
    setIsSubmitting(true)
    try {
      const url = selectedDepartment ? `/api/departments/${selectedDepartment.id}` : '/api/departments'

      const response = await fetch(url, {
        method: selectedDepartment ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success(selectedDepartment ? 'Cập nhật phòng ban thành công' : 'Thêm phòng ban thành công')
      setIsFormOpen(false)
      fetchDepartments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedDepartment) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/departments/${selectedDepartment.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success('Xóa phòng ban thành công')
      setIsDeleteOpen(false)
      fetchDepartments()
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
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Phòng ban</h1>
          <p className="text-muted-foreground">Quản lý danh sách các phòng ban trong công ty</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm phòng ban
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Danh sách phòng ban
          </CardTitle>
          <CardDescription>Tổng cộng {total} phòng ban</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã hoặc tên phòng ban..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
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
          ) : departments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Building2 className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Không có phòng ban nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Mã</TableHead>
                    <TableHead>Tên phòng ban</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="text-center">Nhân viên</TableHead>
                    <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell>
                        <Badge variant="outline">{dept.code}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-muted-foreground">
                        {dept.description || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{dept._count.employees}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(dept)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(dept)}
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
            <DialogTitle>{selectedDepartment ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}</DialogTitle>
            <DialogDescription>
              {selectedDepartment
                ? 'Cập nhật thông tin phòng ban'
                : 'Điền thông tin để tạo phòng ban mới'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Mã phòng ban</Label>
              <Input
                id="code"
                placeholder="VD: HR, IT, SALES..."
                {...register('code')}
                disabled={isSubmitting}
              />
              {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Tên phòng ban</Label>
              <Input
                id="name"
                placeholder="VD: Phòng Nhân sự"
                {...register('name')}
                disabled={isSubmitting}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả về phòng ban (tùy chọn)"
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
                {selectedDepartment ? 'Cập nhật' : 'Thêm mới'}
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
              Bạn có chắc chắn muốn xóa phòng ban <strong>{selectedDepartment?.name}</strong>? Hành động này không thể
              hoàn tác.
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
