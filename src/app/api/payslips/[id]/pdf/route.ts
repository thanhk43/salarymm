import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'
import { generatePayslipPDF } from '@/lib/pdf-generator'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            employeeCode: true,
            fullName: true,
            bankName: true,
            bankAccount: true,
            department: { select: { name: true } },
            position: { select: { name: true } },
            allowances: {
              where: { isActive: true },
              select: { type: true, amount: true },
            },
          },
        },
      },
    })

    if (!payroll) {
      return NextResponse.json({ error: 'Không tìm thấy bảng lương' }, { status: 404 })
    }

    // Fetch bonuses for this period
    const bonuses = await prisma.bonus.findMany({
      where: {
        employeeId: payroll.employeeId,
        month: payroll.month,
        year: payroll.year,
        status: 'APPROVED',
      },
      select: { type: true, amount: true, reason: true },
    })

    const pdfBuffer = generatePayslipPDF({
      employeeName: payroll.employee.fullName,
      employeeCode: payroll.employee.employeeCode,
      department: payroll.employee.department?.name || 'N/A',
      position: payroll.employee.position?.name || 'N/A',
      month: payroll.month,
      year: payroll.year,
      baseSalary: Number(payroll.baseSalary),
      totalAllowances: Number(payroll.totalAllowances),
      totalBonus: Number(payroll.totalBonus),
      grossSalary: Number(payroll.grossSalary),
      socialInsurance: Number(payroll.socialInsurance),
      healthInsurance: Number(payroll.healthInsurance),
      unemploymentInsurance: Number(payroll.unemploymentInsurance),
      personalIncomeTax: Number(payroll.personalIncomeTax),
      totalDeductions: Number(payroll.totalDeductions),
      netSalary: Number(payroll.netSalary),
      bankName: payroll.employee.bankName || undefined,
      bankAccount: payroll.employee.bankAccount || undefined,
      allowances: payroll.employee.allowances.map((a) => ({
        type: a.type,
        amount: Number(a.amount),
      })),
      bonuses: bonuses.map((b) => ({
        type: b.type,
        amount: Number(b.amount),
        reason: b.reason,
      })),
    })

    const filename = `phieu-luong-${payroll.employee.employeeCode}-T${payroll.month}-${payroll.year}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating payslip PDF:', error)
    return NextResponse.json({ error: 'Không thể tạo file PDF' }, { status: 500 })
  }
}
