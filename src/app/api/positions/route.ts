import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

const createPositionSchema = z.object({
  name: z.string().min(1, 'Tên chức vụ không được để trống').max(100),
  baseSalary: z.number().min(0, 'Lương cơ bản phải lớn hơn hoặc bằng 0'),
  description: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = search
      ? {
          name: { contains: search, mode: 'insensitive' as const },
        }
      : {}

    const [positions, total] = await Promise.all([
      prisma.position.findMany({
        where,
        include: {
          _count: {
            select: { employees: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.position.count({ where }),
    ])

    return NextResponse.json({
      data: positions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching positions:', error)
    return NextResponse.json({ error: 'Không thể lấy danh sách chức vụ' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createPositionSchema.parse(body)

    // Check if position name already exists
    const existingPosition = await prisma.position.findUnique({
      where: { name: validatedData.name },
    })

    if (existingPosition) {
      return NextResponse.json({ error: 'Tên chức vụ đã tồn tại' }, { status: 400 })
    }

    const position = await prisma.position.create({
      data: validatedData,
    })

    return NextResponse.json(position, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error creating position:', error)
    return NextResponse.json({ error: 'Không thể tạo chức vụ' }, { status: 500 })
  }
}
