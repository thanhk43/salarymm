import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

const createDepartmentSchema = z.object({
  code: z.string().min(1, 'Mã phòng ban không được để trống').max(10),
  name: z.string().min(1, 'Tên phòng ban không được để trống').max(100),
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
          OR: [
            { code: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
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
      prisma.department.count({ where }),
    ])

    return NextResponse.json({
      data: departments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json({ error: 'Không thể lấy danh sách phòng ban' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createDepartmentSchema.parse(body)

    // Check if department code already exists
    const existingDepartment = await prisma.department.findUnique({
      where: { code: validatedData.code },
    })

    if (existingDepartment) {
      return NextResponse.json({ error: 'Mã phòng ban đã tồn tại' }, { status: 400 })
    }

    const department = await prisma.department.create({
      data: validatedData,
    })

    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error creating department:', error)
    return NextResponse.json({ error: 'Không thể tạo phòng ban' }, { status: 500 })
  }
}
