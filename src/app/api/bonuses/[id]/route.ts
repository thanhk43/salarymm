import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BonusType, BonusStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const updateBonusSchema = z.object({
  type: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'TET', 'PROJECT', 'PERFORMANCE', 'OTHER']).optional(),
  amount: z.number().min(0).optional(),
  reason: z.string().min(1).optional(),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2000).max(2100).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
})

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const bonus = await prisma.bonus.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
            department: { select: { name: true } },
            position: { select: { name: true } },
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!bonus) {
      return NextResponse.json({ error: 'Không tìm thấy thưởng' }, { status: 404 })
    }

    return NextResponse.json(bonus)
  } catch (error) {
    console.error('Error fetching bonus:', error)
    return NextResponse.json({ error: 'Không thể lấy thông tin thưởng' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateBonusSchema.parse(body)

    // Check if bonus exists
    const existingBonus = await prisma.bonus.findUnique({
      where: { id },
    })

    if (!existingBonus) {
      return NextResponse.json({ error: 'Không tìm thấy thưởng' }, { status: 404 })
    }

    // If status is being changed to APPROVED or REJECTED
    const updateData: Record<string, unknown> = { ...validatedData }

    if (validatedData.status === 'APPROVED' || validatedData.status === 'REJECTED') {
      const session = await auth()
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      updateData.approvedById = session.user.id
      updateData.approvedAt = new Date()
    }

    if (validatedData.type) {
      updateData.type = validatedData.type as BonusType
    }

    if (validatedData.status) {
      updateData.status = validatedData.status as BonusStatus
    }

    const bonus = await prisma.bonus.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            employeeCode: true,
            fullName: true,
          },
        },
        approvedBy: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(bonus)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error updating bonus:', error)
    return NextResponse.json({ error: 'Không thể cập nhật thưởng' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Check if bonus exists
    const existingBonus = await prisma.bonus.findUnique({
      where: { id },
    })

    if (!existingBonus) {
      return NextResponse.json({ error: 'Không tìm thấy thưởng' }, { status: 404 })
    }

    // Only allow deleting PENDING bonuses
    if (existingBonus.status !== BonusStatus.PENDING) {
      return NextResponse.json(
        { error: 'Chỉ có thể xóa thưởng đang chờ duyệt' },
        { status: 400 }
      )
    }

    await prisma.bonus.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Đã xóa thưởng thành công' })
  } catch (error) {
    console.error('Error deleting bonus:', error)
    return NextResponse.json({ error: 'Không thể xóa thưởng' }, { status: 500 })
  }
}
