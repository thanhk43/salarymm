import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

const updatePositionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  baseSalary: z.number().min(0).optional(),
  description: z.string().optional().nullable(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const position = await prisma.position.findUnique({
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

    if (!position) {
      return NextResponse.json({ error: 'Không tìm thấy chức vụ' }, { status: 404 })
    }

    return NextResponse.json(position)
  } catch (error) {
    console.error('Error fetching position:', error)
    return NextResponse.json({ error: 'Không thể lấy thông tin chức vụ' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updatePositionSchema.parse(body)

    // Check if position exists
    const existingPosition = await prisma.position.findUnique({
      where: { id },
    })

    if (!existingPosition) {
      return NextResponse.json({ error: 'Không tìm thấy chức vụ' }, { status: 404 })
    }

    // Check if new name already exists (if name is being updated)
    if (validatedData.name && validatedData.name !== existingPosition.name) {
      const nameExists = await prisma.position.findUnique({
        where: { name: validatedData.name },
      })
      if (nameExists) {
        return NextResponse.json({ error: 'Tên chức vụ đã tồn tại' }, { status: 400 })
      }
    }

    const position = await prisma.position.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json(position)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error updating position:', error)
    return NextResponse.json({ error: 'Không thể cập nhật chức vụ' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if position exists
    const existingPosition = await prisma.position.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    })

    if (!existingPosition) {
      return NextResponse.json({ error: 'Không tìm thấy chức vụ' }, { status: 404 })
    }

    // Check if position has employees
    if (existingPosition._count.employees > 0) {
      return NextResponse.json(
        { error: 'Không thể xóa chức vụ đang có nhân viên. Vui lòng chuyển nhân viên sang chức vụ khác trước.' },
        { status: 400 }
      )
    }

    await prisma.position.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Đã xóa chức vụ thành công' })
  } catch (error) {
    console.error('Error deleting position:', error)
    return NextResponse.json({ error: 'Không thể xóa chức vụ' }, { status: 500 })
  }
}
