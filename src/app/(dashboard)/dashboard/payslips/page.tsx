'use client'

import { useState, useEffect, useCallback } from 'react'
import { Eye, FileText, Download, Search } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  employee: {
    id: string
    employeeCode: string
    fullName: string
    email: string
    bankName: string | null
    bankAccount: string | null
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

export default function PayslipsPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMonth, setFilterMonth] = useState(currentMonth.toString())
  const [filterYear, setFilterYear] = useState(currentYear.toString())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Dialog states
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)

  const fetchPayrolls = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        month: filterMonth,
        year: filterYear,
        status: 'CONFIRMED',
      })

      const response = await fetch(`/api/payroll?${params}`)
      if (!response.ok) throw new Error('Failed to fetch')

      const data: PayrollResponse = await response.json()

      // Filter by search query if provided
      let filteredData = data.data
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filteredData = data.data.filter(
          (p) =>
            p.employee.fullName.toLowerCase().includes(query) ||
            p.employee.employeeCode.toLowerCase().includes(query)
        )
      }

      setPayrolls(filteredData)
      setTotalPages(data.meta.totalPages)
      setTotal(data.meta.total)
    } catch {
      toast.error('Không thể tải danh sách phiếu lương')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, filterMonth, filterYear, searchQuery])

  useEffect(() => {
    fetchPayrolls()
  }, [fetchPayrolls])

  const openViewDialog = async (payroll: Payroll) => {
    try {
      const response = await fetch(`/api/payroll/${payroll.id}`)
      if (response.ok) {
        const fullPayroll = await response.json()
        setSelectedPayroll(fullPayroll)
        setIsViewOpen(true)
      }
    } catch {
      toast.error('Không thể tải thông tin phiếu lương')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Phiếu lương</h1>
          <p className="text-muted-foreground">Xem và in phiếu lương nhân viên</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Danh sách phiếu lương
          </CardTitle>
          <CardDescription>Tổng cộng {total} phiếu lương</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc mã nhân viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
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
              <p>Không có phiếu lương nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Kỳ lương</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">Khấu trừ</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="w-[80px] text-right">Xem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrolls.map((payroll) => (
                    <TableRow key={payroll.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payroll.employee.fullName}</p>
                          <p className="text-sm text-muted-foreground">{payroll.employee.employeeCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        Tháng {payroll.month}/{payroll.year}
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
                        <Button variant="ghost" size="icon" onClick={() => openViewDialog(payroll)}>
                          <Eye className="h-4 w-4" />
                        </Button>
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

      {/* Payslip View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl print:max-w-full print:shadow-none">
          <DialogHeader>
            <DialogTitle>Phiếu lương</DialogTitle>
            <DialogDescription>
              {selectedPayroll?.employee.fullName} - Tháng {selectedPayroll?.month}/{selectedPayroll?.year}
            </DialogDescription>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-4" id="payslip-content">
              {/* Header */}
              <div className="border-b pb-4 text-center">
                <h2 className="text-xl font-bold">PHIẾU LƯƠNG</h2>
                <p className="text-muted-foreground">
                  Kỳ lương: Tháng {selectedPayroll.month}/{selectedPayroll.year}
                </p>
              </div>

              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-4">
                <div>
                  <p className="text-sm text-muted-foreground">Họ và tên</p>
                  <p className="font-medium">{selectedPayroll.employee.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mã nhân viên</p>
                  <p className="font-medium">{selectedPayroll.employee.employeeCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phòng ban</p>
                  <p className="font-medium">{selectedPayroll.employee.department?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chức vụ</p>
                  <p className="font-medium">{selectedPayroll.employee.position?.name || 'N/A'}</p>
                </div>
              </div>

              {/* Earnings */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-medium text-green-700">Thu nhập</h4>
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
                    <span>Tổng thu nhập</span>
                    <span className="font-mono">{formatCurrency(selectedPayroll.grossSalary)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="rounded-lg border p-4">
                <h4 className="mb-3 font-medium text-red-700">Khấu trừ</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>BHXH (8%)</span>
                    <span className="font-mono">{formatCurrency(selectedPayroll.socialInsurance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BHYT (1.5%)</span>
                    <span className="font-mono">{formatCurrency(selectedPayroll.healthInsurance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>BHTN (1%)</span>
                    <span className="font-mono">{formatCurrency(selectedPayroll.unemploymentInsurance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thuế TNCN</span>
                    <span className="font-mono">{formatCurrency(selectedPayroll.personalIncomeTax)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-medium">
                    <span>Tổng khấu trừ</span>
                    <span className="font-mono">{formatCurrency(selectedPayroll.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="rounded-lg bg-green-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">THỰC NHẬN</span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(selectedPayroll.netSalary)}</span>
                </div>
              </div>

              {/* Bank Info */}
              {selectedPayroll.employee.bankAccount && (
                <div className="rounded-lg bg-muted/50 p-4 text-sm">
                  <p className="text-muted-foreground">Thông tin chuyển khoản</p>
                  <p className="font-medium">
                    {selectedPayroll.employee.bankName} - {selectedPayroll.employee.bankAccount}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" />
              In phiếu lương
            </Button>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
