import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PayrollStatus, EmployeeStatus, BonusStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { calculatePayroll } from '@/lib/payroll-calculator'

const generatePayrollSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') || ''
    const year = searchParams.get('year') || ''
    const status = searchParams.get('status') || ''
    const employeeId = searchParams.get('employeeId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)
    if (status) where.status = status as PayrollStatus
    if (employeeId) where.employeeId = employeeId

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              department: { select: { name: true } },
              position: { select: { name: true } },
            },
          },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.payroll.count({ where }),
    ])

    return NextResponse.json({
      data: payrolls,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching payrolls:', error)
    return NextResponse.json({ error: 'Không thể lấy danh sách bảng lương' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, year } = generatePayrollSchema.parse(body)

    // Get all active employees with their salary structures and allowances
    const employees = await prisma.employee.findMany({
      where: { status: EmployeeStatus.ACTIVE },
      include: {
        salaryStructures: {
          where: {
            effectiveDate: {
              lte: new Date(year, month - 1, 28), // End of month
            },
          },
          orderBy: { effectiveDate: 'desc' },
          take: 1,
        },
        allowances: {
          where: { isActive: true },
        },
        bonuses: {
          where: {
            month,
            year,
            status: BonusStatus.APPROVED,
          },
        },
      },
    })

    if (employees.length === 0) {
      return NextResponse.json({ error: 'Không có nhân viên nào để tính lương' }, { status: 400 })
    }

    const payrollResults = []
    const errors = []

    for (const employee of employees) {
      // Check if payroll already exists
      const existingPayroll = await prisma.payroll.findUnique({
        where: {
          employeeId_month_year: {
            employeeId: employee.id,
            month,
            year,
          },
        },
      })

      if (existingPayroll) {
        errors.push(`${employee.fullName}: Đã có bảng lương tháng ${month}/${year}`)
        continue
      }

      const salaryStructure = employee.salaryStructures[0]
      if (!salaryStructure) {
        errors.push(`${employee.fullName}: Chưa có cấu trúc lương`)
        continue
      }

      const baseSalary = Number(salaryStructure.baseSalary)

      // Calculate allowances
      const totalAllowances = employee.allowances.reduce((sum, a) => sum + Number(a.amount), 0)

      // Calculate bonuses
      const totalBonus = employee.bonuses.reduce((sum, b) => sum + Number(b.amount), 0)

      // Use the payroll calculator utility
      const payrollCalc = calculatePayroll({
        baseSalary,
        totalAllowances,
        totalBonus,
        hasSocialInsurance: salaryStructure.hasSocialInsurance,
        hasHealthInsurance: salaryStructure.hasHealthInsurance,
        hasUnemploymentInsurance: salaryStructure.hasUnemploymentInsurance,
      })

      // Create payroll record
      const payroll = await prisma.payroll.create({
        data: {
          employeeId: employee.id,
          salaryStructureId: salaryStructure.id,
          month,
          year,
          status: PayrollStatus.DRAFT,
          baseSalary: payrollCalc.baseSalary,
          totalAllowances: payrollCalc.totalAllowances,
          totalBonus: payrollCalc.totalBonus,
          grossSalary: payrollCalc.grossSalary,
          socialInsurance: payrollCalc.socialInsurance,
          healthInsurance: payrollCalc.healthInsurance,
          unemploymentInsurance: payrollCalc.unemploymentInsurance,
          personalIncomeTax: payrollCalc.personalIncomeTax,
          totalDeductions: payrollCalc.totalDeductions,
          netSalary: payrollCalc.netSalary,
        },
        include: {
          employee: {
            select: {
              employeeCode: true,
              fullName: true,
            },
          },
        },
      })

      payrollResults.push(payroll)
    }

    return NextResponse.json(
      {
        message: `Đã tạo ${payrollResults.length} bảng lương`,
        data: payrollResults,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error generating payroll:', error)
    return NextResponse.json({ error: 'Không thể tạo bảng lương' }, { status: 500 })
  }
}
