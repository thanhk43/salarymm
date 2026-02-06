'use client'

import { useState, useEffect, useCallback } from 'react'
import { Eye, FileText, Download } from 'lucide-react'
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

interface Payroll {
  id: string
  month: number
  year: number
  status: 'CONFIRMED' | 'PAID'
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
}

interface EmployeeInfo {
  id: string
  employeeCode: string
  fullName: string
}

interface MyPayslipsResponse {
  data: Payroll[]
  employee: EmployeeInfo
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'outline' }> = {
  CONFIRMED: { label: 'Đã xác nhận', variant: 'outline' },
  PAID: { label: 'Đã thanh toán', variant: 'default' },
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

export default function MyPayslipsPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [employee, setEmployee] = useState<EmployeeInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterYear, setFilterYear] = useState(currentYear.toString())

  // Dialog states
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null)

  const fetchMyPayslips = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        year: filterYear,
      })

      const response = await fetch(`/api/my-payslips?${params}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch')
      }

      const data: MyPayslipsResponse = await response.json()
      setPayrolls(data.data)
      setEmployee(data.employee)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải phiếu lương')
    } finally {
      setIsLoading(false)
    }
  }, [filterYear])

  useEffect(() => {
    fetchMyPayslips()
  }, [fetchMyPayslips])

  const openViewDialog = (payroll: Payroll) => {
    setSelectedPayroll(payroll)
    setIsViewOpen(true)
  }

  // Calculate yearly totals
  const yearlyTotal = payrolls.reduce((sum, p) => sum + parseFloat(p.netSalary), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Phiếu lương của tôi</h1>
          <p className="text-muted-foreground">
            {employee ? `${employee.fullName} (${employee.employeeCode})` : 'Xem lịch sử phiếu lương'}
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tổng thu nhập năm {filterYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 tabular-nums">{formatCurrency(yearlyTotal)}</div>
          <p className="text-xs text-muted-foreground">{payrolls.length} kỳ lương</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lịch sử phiếu lương
          </CardTitle>
          <CardDescription>Các kỳ lương đã được xác nhận</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    Năm {year}
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
              <p>Không có phiếu lương nào trong năm {filterYear}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kỳ lương</TableHead>
                  <TableHead className="text-right">Lương Gross</TableHead>
                  <TableHead className="text-right">Khấu trừ</TableHead>
                  <TableHead className="text-right">Thực nhận</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="w-[80px] text-right">Xem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrolls.map((payroll) => (
                  <TableRow key={payroll.id}>
                    <TableCell className="font-medium">
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
          )}
        </CardContent>
      </Card>

      {/* Payslip View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Phiếu lương</DialogTitle>
            <DialogDescription>
              Tháng {selectedPayroll?.month}/{selectedPayroll?.year}
            </DialogDescription>
          </DialogHeader>
          {selectedPayroll && employee && (
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
                  <p className="font-medium">{employee.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mã nhân viên</p>
                  <p className="font-medium">{employee.employeeCode}</p>
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
