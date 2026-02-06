'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Loader2, Briefcase } from 'lucide-react'
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

interface Position {
  id: string
  name: string
  baseSalary: string
  description: string | null
  createdAt: string
  _count: {
    employees: number
  }
}

interface PositionResponse {
  data: Position[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const positionSchema = z.object({
  name: z.string().min(1, 'Tên chức vụ không được để trống').max(100, 'Tên chức vụ tối đa 100 ký tự'),
  baseSalary: z.string().min(1, 'Lương cơ bản không được để trống'),
  description: z.string().optional(),
})

type PositionFormData = z.infer<typeof positionSchema>

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

function parseCurrency(value: string): number {
  return parseFloat(value.replace(/[^\d]/g, '')) || 0
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PositionFormData>({
    resolver: zodResolver(positionSchema),
  })

  const fetchPositions = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await fetch(`/api/positions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: PositionResponse = await response.json()
      setPositions(data.data)
      setTotalPages(data.meta.totalPages)
      setTotal(data.meta.total)
    } catch {
      toast.error('Không thể tải danh sách chức vụ')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, searchQuery])

  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchPositions()
  }

  const openCreateDialog = () => {
    setSelectedPosition(null)
    reset({ name: '', baseSalary: '', description: '' })
    setIsFormOpen(true)
  }

  const openEditDialog = (position: Position) => {
    setSelectedPosition(position)
    reset({
      name: position.name,
      baseSalary: position.baseSalary,
      description: position.description || '',
    })
    setIsFormOpen(true)
  }

  const openDeleteDialog = (position: Position) => {
    setSelectedPosition(position)
    setIsDeleteOpen(true)
  }

  const onSubmit = async (data: PositionFormData) => {
    setIsSubmitting(true)
    try {
      const url = selectedPosition ? `/api/positions/${selectedPosition.id}` : '/api/positions'

      const payload = {
        ...data,
        baseSalary: parseCurrency(data.baseSalary),
      }

      const response = await fetch(url, {
        method: selectedPosition ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success(selectedPosition ? 'Cập nhật chức vụ thành công' : 'Thêm chức vụ thành công')
      setIsFormOpen(false)
      fetchPositions()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedPosition) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/positions/${selectedPosition.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success('Xóa chức vụ thành công')
      setIsDeleteOpen(false)
      fetchPositions()
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
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Chức vụ</h1>
          <p className="text-muted-foreground">Quản lý danh sách các chức vụ trong công ty</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm chức vụ
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Danh sách chức vụ
          </CardTitle>
          <CardDescription>Tổng cộng {total} chức vụ</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên chức vụ..."
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
          ) : positions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Briefcase className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Không có chức vụ nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên chức vụ</TableHead>
                    <TableHead className="text-right">Lương cơ bản</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="text-center">Nhân viên</TableHead>
                    <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((pos) => (
                    <TableRow key={pos.id}>
                      <TableCell className="font-medium">{pos.name}</TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(pos.baseSalary)}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-muted-foreground">
                        {pos.description || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{pos._count.employees}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(pos)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(pos)}
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
            <DialogTitle>{selectedPosition ? 'Chỉnh sửa chức vụ' : 'Thêm chức vụ mới'}</DialogTitle>
            <DialogDescription>
              {selectedPosition ? 'Cập nhật thông tin chức vụ' : 'Điền thông tin để tạo chức vụ mới'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên chức vụ</Label>
              <Input
                id="name"
                placeholder="VD: Developer, Manager..."
                {...register('name')}
                disabled={isSubmitting}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseSalary">Lương cơ bản (VNĐ)</Label>
              <Input
                id="baseSalary"
                placeholder="VD: 15000000"
                {...register('baseSalary')}
                disabled={isSubmitting}
              />
              {errors.baseSalary && <p className="text-sm text-destructive">{errors.baseSalary.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả về chức vụ (tùy chọn)"
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
                {selectedPosition ? 'Cập nhật' : 'Thêm mới'}
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
              Bạn có chắc chắn muốn xóa chức vụ <strong>{selectedPosition?.name}</strong>? Hành động này không thể hoàn
              tác.
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
