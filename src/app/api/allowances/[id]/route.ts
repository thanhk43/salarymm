import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

const updateAllowanceSchema = z.object({
  type: z.string().min(1).optional(),
  amount: z.number().min(0).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const allowance = await prisma.allowance.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
          },
        },
      },
    })

    if (!allowance) {
      return NextResponse.json({ error: 'Không tìm thấy phụ cấp' }, { status: 404 })
    }

    return NextResponse.json(allowance)
  } catch (error) {
    console.error('Error fetching allowance:', error)
    return NextResponse.json({ error: 'Không thể lấy thông tin phụ cấp' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateAllowanceSchema.parse(body)

    // Check if allowance exists
    const existingAllowance = await prisma.allowance.findUnique({
      where: { id },
    })

    if (!existingAllowance) {
      return NextResponse.json({ error: 'Không tìm thấy phụ cấp' }, { status: 404 })
    }

    const allowance = await prisma.allowance.update({
      where: { id },
      data: validatedData,
      include: {
        employee: {
          select: {
            employeeCode: true,
            fullName: true,
          },
        },
      },
    })

    return NextResponse.json(allowance)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error updating allowance:', error)
    return NextResponse.json({ error: 'Không thể cập nhật phụ cấp' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if allowance exists
    const existingAllowance = await prisma.allowance.findUnique({
      where: { id },
    })

    if (!existingAllowance) {
      return NextResponse.json({ error: 'Không tìm thấy phụ cấp' }, { status: 404 })
    }

    await prisma.allowance.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Đã xóa phụ cấp thành công' })
  } catch (error) {
    console.error('Error deleting allowance:', error)
    return NextResponse.json({ error: 'Không thể xóa phụ cấp' }, { status: 500 })
  }
}
