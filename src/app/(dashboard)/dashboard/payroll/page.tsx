'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calculator, Eye, Check, Loader2, FileText, Trash2, Download, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import { Label } from '@/components/ui/label'

interface Payroll {
  id: string
  month: number
  year: number
  status: 'DRAFT' | 'CONFIRMED' | 'PAID'
  baseSalary: string
  totalAllowances: string
  totalBonus: string
  grossSalary: string
  socialInsurance: string
  healthInsurance: string
  unemploymentInsurance: string
  personalIncomeTax: string
  totalDeductions: string
  netSalary: string
  processedAt: string | null
  createdAt: string
  employee: {
    id: string
    employeeCode: string
    fullName: string
    department: { name: string } | null
    position: { name: string } | null
  }
}

interface PayrollResponse {
  data: Payroll[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  DRAFT: { label: 'Nháp', variant: 'secondary' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'outline' },
  PAID: { label: 'Đã thanh toán', variant: 'default' },
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
const months = Array.from({ length: 12 }, (_, i) => i + 1)

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterMonth, setFilterMonth] = useState(currentMonth.toString())
  const [filterYear, setFilterYear] = useState(currentYear.toString())
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Dialog states
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Generate form
  const [generateMonth, setGenerateMonth] = useState(currentMonth.toString())
  const [generateYear, setGenerateYear] = useState(currentYear.toString())

  const fetchPayrolls = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filterMonth && { month: filterMonth }),
        ...(filterYear && { year: filterYear }),
        ...(filterStatus && filterStatus !== 'all' && { status: filterStatus }),
      })

      const response = await fetch(`/api/payroll?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: PayrollResponse = await response.json()
      setPayrolls(data.data)
      setTotalPages(data.meta.totalPages)
      setTotal(data.meta.total)
    } catch {
      toast.error('Không thể tải danh sách bảng lương')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, filterMonth, filterYear, filterStatus])

  useEffect(() => {
    fetchPayrolls()
  }, [fetchPayrolls])

  const openGenerateDialog = () => {
    setGenerateMonth(currentMonth.toString())
    setGenerateYear(currentYear.toString())
    setIsGenerateOpen(true)
  }

  const openViewDialog = async (payroll: Payroll) => {
    try {
      const response = await fetch(`/api/payroll/${payroll.id}`)
      if (response.ok) {
        const fullPayroll = await response.json()
        setSelectedPayroll(fullPayroll)
        setIsViewOpen(true)
      }
    } catch {
      toast.error('Không thể tải thông tin bảng lương')
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: parseInt(generateMonth),
          year: parseInt(generateYear),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success(result.message)
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((err: string) => toast.warning(err))
      }
      setIsGenerateOpen(false)
      setFilterMonth(generateMonth)
      setFilterYear(generateYear)
      fetchPayrolls()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUpdateStatus = async (payrollId: string, status: 'CONFIRMED' | 'PAID') => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/payroll/${payrollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success(status === 'CONFIRMED' ? 'Đã xác nhận bảng lương' : 'Đã đánh dấu thanh toán')
      setIsViewOpen(false)
      fetchPayrolls()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (payrollId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bảng lương này?')) return

    try {
      const response = await fetch(`/api/payroll/${payrollId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Có lỗi xảy ra')
      }

      toast.success('Đã xóa bảng lương')
      fetchPayrolls()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra')
    }
  }

  // Calculate totals
  const totalNetSalary = payrolls.reduce((sum, p) => sum + parseFloat(p.netSalary), 0)
  const totalGrossSalary = payrolls.reduce((sum, p) => sum + parseFloat(p.grossSalary), 0)

  // Export to CSV
  const handleExportCSV = async () => {
    try {
      // Fetch all payrolls for the month (without pagination)
      const params = new URLSearchParams({
        limit: '1000',
        ...(filterMonth && { month: filterMonth }),
        ...(filterYear && { year: filterYear }),
      })

      const response = await fetch(`/api/payroll?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: PayrollResponse = await response.json()

      // Create CSV content
      const headers = [
        'Mã NV',
        'Họ tên',
        'Phòng ban',
        'Chức vụ',
        'Lương cơ bản',
        'Phụ cấp',
        'Thưởng',
        'Lương Gross',
        'BHXH',
        'BHYT',
        'BHTN',
        'Thuế TNCN',
        'Tổng khấu trừ',
        'Lương Net',
        'Trạng thái',
      ]

      const rows = data.data.map((p) => [
        p.employee.employeeCode,
        p.employee.fullName,
        p.employee.department?.name || '',
        p.employee.position?.name || '',
        p.baseSalary,
        p.totalAllowances,
        p.totalBonus,
        p.grossSalary,
        p.socialInsurance,
        p.healthInsurance,
        p.unemploymentInsurance,
        p.personalIncomeTax,
        p.totalDeductions,
        p.netSalary,
        statusLabels[p.status].label,
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n')

      // Add BOM for UTF-8 support in Excel
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bang-luong-thang-${filterMonth}-${filterYear}.csv`
      link.click()
      URL.revokeObjectURL(url)

      toast.success('Đã xuất file Excel thành công')
    } catch {
      toast.error('Không thể xuất file')
    }
  }

  // Batch confirm all draft payrolls
  const handleBatchConfirm = async () => {
    const draftPayrolls = payrolls.filter((p) => p.status === 'DRAFT')
    if (draftPayrolls.length === 0) {
      toast.info('Không có bảng lương nào cần xác nhận')
      return
    }

    if (!confirm(`Xác nhận ${draftPayrolls.length} bảng lương?`)) return

    setIsUpdating(true)
    try {
      const results = await Promise.all(
        draftPayrolls.map((p) =>
          fetch(`/api/payroll/${p.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'CONFIRMED' }),
          })
        )
      )

      const successCount = results.filter((r) => r.ok).length
      toast.success(`Đã xác nhận ${successCount}/${draftPayrolls.length} bảng lương`)
      fetchPayrolls()
    } catch {
      toast.error('Có lỗi xảy ra khi xác nhận')
    } finally {
      setIsUpdating(false)
    }
  }

  const draftCount = payrolls.filter((p) => p.status === 'DRAFT').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bảng lương</h1>
          <p className="text-muted-foreground">Tính toán và quản lý bảng lương hàng tháng</p>
        </div>
        <div className="flex gap-2">
          {payrolls.length > 0 && (
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Xuất Excel
            </Button>
          )}
          {draftCount > 0 && (
            <Button variant="outline" onClick={handleBatchConfirm} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <CheckSquare className="mr-2 h-4 w-4" />
              Xác nhận tất cả ({draftCount})
            </Button>
          )}
          <Button onClick={openGenerateDialog}>
            <Calculator className="mr-2 h-4 w-4" />
            Tính lương tháng
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng nhân viên</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              Tháng {filterMonth}/{filterYear}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng lương Gross</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{formatCurrency(totalGrossSalary)}</div>
            <p className="text-xs text-muted-foreground">Trước thuế và bảo hiểm</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng lương Net</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-green-600">{formatCurrency(totalNetSalary)}</div>
            <p className="text-xs text-muted-foreground">Thực nhận</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Chi tiết bảng lương
          </CardTitle>
          <CardDescription>Danh sách bảng lương nhân viên</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Select value={filterMonth} onValueChange={(v) => { setFilterMonth(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Tháng" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    Tháng {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterYear} onValueChange={(v) => { setFilterYear(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[100px]">
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
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="DRAFT">Nháp</SelectItem>
                <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                <SelectItem value="PAID">Đã thanh toán</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payrolls.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Chưa có bảng lương nào</p>
              <Button variant="outline" className="mt-4" onClick={openGenerateDialog}>
                Tính lương tháng này
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead className="text-right">Lương cơ bản</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Khấu trừ</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="w-[120px] text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls.map((payroll) => (
                    <TableRow key={payroll.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payroll.employee.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            {payroll.employee.employeeCode} · {payroll.employee.department?.name || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(payroll.baseSalary)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(payroll.grossSalary)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-600">
                        -{formatCurrency(payroll.totalDeductions)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium text-green-600">
                        {formatCurrency(payroll.netSalary)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={statusLabels[payroll.status].variant}>
                          {statusLabels[payroll.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openViewDialog(payroll)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payroll.status === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(payroll.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      {/* Generate Dialog */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tính lương tháng</DialogTitle>
            <DialogDescription>
              Hệ thống sẽ tự động tính lương cho tất cả nhân viên đang hoạt động
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Tháng</Label>
              <Select value={generateMonth} onValueChange={setGenerateMonth}>
                <SelectTrigger>
                  <SelectValue />
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
              <Label>Năm</Label>
              <Select value={generateYear} onValueChange={setGenerateYear}>
                <SelectTrigger>
                  <SelectValue />
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
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium">Công thức tính:</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>• BHXH: 8% lương cơ bản</li>
              <li>• BHYT: 1.5% lương cơ bản</li>
              <li>• BHTN: 1% lương cơ bản</li>
              <li>• Thuế TNCN: Theo biểu lũy tiến</li>
              <li>• Giảm trừ bản thân: 11,000,000 VNĐ</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)} disabled={isGenerating}>
              Hủy
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Calculator className="mr-2 h-4 w-4" />
              Tính lương
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết bảng lương</DialogTitle>
            <DialogDescription>
              {selectedPayroll?.employee.fullName} - Tháng {selectedPayroll?.month}/{selectedPayroll?.year}
            </DialogDescription>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nhân viên</p>
                  <p className="font-medium">{selectedPayroll.employee.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayroll.employee.employeeCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phòng ban / Chức vụ</p>
                  <p className="font-medium">
                    {selectedPayroll.employee.department?.name || 'N/A'} /{' '}
                    {selectedPayroll.employee.position?.name || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-medium">Thu nhập</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Lương cơ bản</span>
                    <span className="font-mono">{formatCurrency(selectedPayroll.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phụ cấp</span>
                    <span className="font-mono">{formatCurrency(selectedPayroll.totalAllowances)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thưởng</span>
                    <span className="font-mono">{formatCurrency(selectedPayroll.totalBonus)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-medium">
                    <span>Tổng thu nhập (Gross)</span>
                    <span className="font-mono">{formatCurrency(selectedPayroll.grossSalary)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-medium">Khấu trừ</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>BHXH (8%)</span>
                    <span className="font-mono text-red-600">-{formatCurrency(selectedPayroll.socialInsurance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BHYT (1.5%)</span>
                    <span className="font-mono text-red-600">-{formatCurrency(selectedPayroll.healthInsurance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BHTN (1%)</span>
                    <span className="font-mono text-red-600">
                      -{formatCurrency(selectedPayroll.unemploymentInsurance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thuế TNCN</span>
                    <span className="font-mono text-red-600">-{formatCurrency(selectedPayroll.personalIncomeTax)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-medium">
                    <span>Tổng khấu trừ</span>
                    <span className="font-mono text-red-600">-{formatCurrency(selectedPayroll.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-green-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Thực nhận (Net)</span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(selectedPayroll.netSalary)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <Badge variant={statusLabels[selectedPayroll.status].variant}>
                    {statusLabels[selectedPayroll.status].label}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedPayroll?.status === 'DRAFT' && (
              <Button
                onClick={() => handleUpdateStatus(selectedPayroll.id, 'CONFIRMED')}
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Check className="mr-2 h-4 w-4" />
                Xác nhận
              </Button>
            )}
            {selectedPayroll?.status === 'CONFIRMED' && (
              <Button
                onClick={() => handleUpdateStatus(selectedPayroll.id, 'PAID')}
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Check className="mr-2 h-4 w-4" />
                Đánh dấu đã thanh toán
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
