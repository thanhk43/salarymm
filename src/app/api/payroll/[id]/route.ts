import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PayrollStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'

const updatePayrollSchema = z.object({
  status: z.enum(['DRAFT', 'CONFIRMED', 'PAID']).optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
            phone: true,
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
        salaryStructure: true,
      },
    })

    // Fetch approved bonuses for this employee in this payroll period
    if (payroll) {
      const bonuses = await prisma.bonus.findMany({
        where: {
          employeeId: payroll.employeeId,
          month: payroll.month,
          year: payroll.year,
          status: 'APPROVED',
        },
        select: {
          type: true,
          amount: true,
          reason: true,
        },
      })
      ;(payroll as Record<string, unknown>).bonusDetails = bonuses
    }

    if (!payroll) {
      return NextResponse.json({ error: 'Không tìm thấy bảng lương' }, { status: 404 })
    }

    return NextResponse.json(payroll)
  } catch (error) {
    console.error('Error fetching payroll:', error)
    return NextResponse.json({ error: 'Không thể lấy thông tin bảng lương' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updatePayrollSchema.parse(body)

    // Check if payroll exists
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id },
    })

    if (!existingPayroll) {
      return NextResponse.json({ error: 'Không tìm thấy bảng lương' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (validatedData.status) {
      updateData.status = validatedData.status as PayrollStatus

      // Set processedAt when confirming
      if (validatedData.status === 'CONFIRMED' || validatedData.status === 'PAID') {
        updateData.processedAt = new Date()
      }
    }

    const payroll = await prisma.payroll.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            employeeCode: true,
            fullName: true,
          },
        },
      },
    })

    return NextResponse.json(payroll)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error updating payroll:', error)
    return NextResponse.json({ error: 'Không thể cập nhật bảng lương' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if payroll exists
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id },
    })

    if (!existingPayroll) {
      return NextResponse.json({ error: 'Không tìm thấy bảng lương' }, { status: 404 })
    }

    // Only allow deleting DRAFT payrolls
    if (existingPayroll.status !== PayrollStatus.DRAFT) {
      return NextResponse.json(
        { error: 'Chỉ có thể xóa bảng lương ở trạng thái nháp' },
        { status: 400 }
      )
    }

    await prisma.payroll.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Đã xóa bảng lương thành công' })
  } catch (error) {
    console.error('Error deleting payroll:', error)
    return NextResponse.json({ error: 'Không thể xóa bảng lương' }, { status: 500 })
  }
}
