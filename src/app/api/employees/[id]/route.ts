import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { EmployeeStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'

const updateEmployeeSchema = z.object({
  employeeCode: z.string().min(1).optional(),
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
  idNumber: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  startDate: z.string().optional(),
  bankName: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  socialInsuranceNumber: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  positionId: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        user: { select: { id: true, email: true, role: true } },
        salaryStructures: {
          orderBy: { effectiveDate: 'desc' },
        },
        allowances: {
          where: { isActive: true },
        },
        bonuses: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Không tìm thấy nhân viên' }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json({ error: 'Không thể lấy thông tin nhân viên' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateEmployeeSchema.parse(body)

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
    })

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Không tìm thấy nhân viên' }, { status: 404 })
    }

    // Check if new employee code already exists
    if (validatedData.employeeCode && validatedData.employeeCode !== existingEmployee.employeeCode) {
      const codeExists = await prisma.employee.findUnique({
        where: { employeeCode: validatedData.employeeCode },
      })
      if (codeExists) {
        return NextResponse.json({ error: 'Mã nhân viên đã tồn tại' }, { status: 400 })
      }
    }

    // Check if new email already exists
    if (validatedData.email && validatedData.email !== existingEmployee.email) {
      const emailExists = await prisma.employee.findUnique({
        where: { email: validatedData.email },
      })
      if (emailExists) {
        return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = { ...validatedData }

    // Convert date strings to Date objects
    if (validatedData.dateOfBirth) {
      updateData.dateOfBirth = new Date(validatedData.dateOfBirth)
    }
    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate)
    }
    if (validatedData.status) {
      updateData.status = validatedData.status as EmployeeStatus
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
        position: true,
      },
    })

    return NextResponse.json(employee)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error updating employee:', error)
    return NextResponse.json({ error: 'Không thể cập nhật nhân viên' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Không tìm thấy nhân viên' }, { status: 404 })
    }

    // Delete related records first (cascade should handle this, but being explicit)
    await prisma.$transaction([
      prisma.allowance.deleteMany({ where: { employeeId: id } }),
      prisma.bonus.deleteMany({ where: { employeeId: id } }),
      prisma.payroll.deleteMany({ where: { employeeId: id } }),
      prisma.salaryStructure.deleteMany({ where: { employeeId: id } }),
      prisma.employee.delete({ where: { id } }),
    ])

    // Optionally delete user account
    if (existingEmployee.userId) {
      await prisma.user.delete({ where: { id: existingEmployee.userId } })
    }

    return NextResponse.json({ message: 'Đã xóa nhân viên thành công' })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json({ error: 'Không thể xóa nhân viên' }, { status: 500 })
  }
}
