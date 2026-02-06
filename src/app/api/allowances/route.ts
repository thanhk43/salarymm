import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

const createAllowanceSchema = z.object({
  employeeId: z.string().min(1, 'Nhân viên không được để trống'),
  type: z.string().min(1, 'Loại phụ cấp không được để trống'),
  amount: z.number().min(0, 'Số tiền phải lớn hơn 0'),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId') || ''
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (employeeId) {
      where.employeeId = employeeId
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const [allowances, total] = await Promise.all([
      prisma.allowance.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.allowance.count({ where }),
    ])

    return NextResponse.json({
      data: allowances,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching allowances:', error)
    return NextResponse.json({ error: 'Không thể lấy danh sách phụ cấp' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createAllowanceSchema.parse(body)

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: validatedData.employeeId },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Không tìm thấy nhân viên' }, { status: 404 })
    }

    const allowance = await prisma.allowance.create({
      data: {
        employeeId: validatedData.employeeId,
        type: validatedData.type,
        amount: validatedData.amount,
        description: validatedData.description,
        isActive: true,
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

    return NextResponse.json(allowance, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error creating allowance:', error)
    return NextResponse.json({ error: 'Không thể tạo phụ cấp' }, { status: 500 })
  }
}
