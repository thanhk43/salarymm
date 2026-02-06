import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BonusType, BonusStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const createBonusSchema = z.object({
  employeeId: z.string().min(1, 'Nhân viên không được để trống'),
  type: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'TET', 'PROJECT', 'PERFORMANCE', 'OTHER']),
  amount: z.number().min(0, 'Số tiền phải lớn hơn 0'),
  reason: z.string().min(1, 'Lý do không được để trống'),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const month = searchParams.get('month') || ''
    const year = searchParams.get('year') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (employeeId) {
      where.employeeId = employeeId
    }

    if (status) {
      where.status = status as BonusStatus
    }

    if (type) {
      where.type = type as BonusType
    }

    if (month) {
      where.month = parseInt(month)
    }

    if (year) {
      where.year = parseInt(year)
    }

    const [bonuses, total] = await Promise.all([
      prisma.bonus.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              department: { select: { name: true } },
            },
          },
          approvedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bonus.count({ where }),
    ])

    return NextResponse.json({
      data: bonuses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching bonuses:', error)
    return NextResponse.json({ error: 'Không thể lấy danh sách thưởng' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createBonusSchema.parse(body)

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: validatedData.employeeId },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Không tìm thấy nhân viên' }, { status: 404 })
    }

    // Check for duplicate bonus
    const existingBonus = await prisma.bonus.findUnique({
      where: {
        employeeId_type_month_year: {
          employeeId: validatedData.employeeId,
          type: validatedData.type as BonusType,
          month: validatedData.month,
          year: validatedData.year,
        },
      },
    })

    if (existingBonus) {
      return NextResponse.json(
        { error: 'Nhân viên đã có thưởng loại này trong tháng/năm được chọn' },
        { status: 400 }
      )
    }

    const bonus = await prisma.bonus.create({
      data: {
        employeeId: validatedData.employeeId,
        type: validatedData.type as BonusType,
        amount: validatedData.amount,
        reason: validatedData.reason,
        month: validatedData.month,
        year: validatedData.year,
        status: BonusStatus.PENDING,
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

    return NextResponse.json(bonus, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error creating bonus:', error)
    return NextResponse.json({ error: 'Không thể tạo thưởng' }, { status: 500 })
  }
}
