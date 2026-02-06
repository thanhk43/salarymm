import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

const updateDepartmentSchema = z.object({
  code: z.string().min(1).max(10).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: { employees: true },
        },
      },
    })

    if (!department) {
      return NextResponse.json({ error: 'Không tìm thấy phòng ban' }, { status: 404 })
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error('Error fetching department:', error)
    return NextResponse.json({ error: 'Không thể lấy thông tin phòng ban' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateDepartmentSchema.parse(body)

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
    })

    if (!existingDepartment) {
      return NextResponse.json({ error: 'Không tìm thấy phòng ban' }, { status: 404 })
    }

    // Check if new code already exists (if code is being updated)
    if (validatedData.code && validatedData.code !== existingDepartment.code) {
      const codeExists = await prisma.department.findUnique({
        where: { code: validatedData.code },
      })
      if (codeExists) {
        return NextResponse.json({ error: 'Mã phòng ban đã tồn tại' }, { status: 400 })
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(department)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error updating department:', error)
    return NextResponse.json({ error: 'Không thể cập nhật phòng ban' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    })

    if (!existingDepartment) {
      return NextResponse.json({ error: 'Không tìm thấy phòng ban' }, { status: 404 })
    }

    // Check if department has employees
    if (existingDepartment._count.employees > 0) {
      return NextResponse.json(
        { error: 'Không thể xóa phòng ban đang có nhân viên. Vui lòng chuyển nhân viên sang phòng ban khác trước.' },
        { status: 400 }
      )
    }

    await prisma.department.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Đã xóa phòng ban thành công' })
  } catch (error) {
    console.error('Error deleting department:', error)
    return NextResponse.json({ error: 'Không thể xóa phòng ban' }, { status: 500 })
  }
}
