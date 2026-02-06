import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { UserRole, EmployeeStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'

const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1, 'Mã nhân viên không được để trống'),
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional(),
  idNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  startDate: z.string().min(1, 'Ngày bắt đầu không được để trống'),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  socialInsuranceNumber: z.string().optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  baseSalary: z.number().min(0).optional(),
  createAccount: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const departmentId = searchParams.get('departmentId') || ''
    const positionId = searchParams.get('positionId') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (departmentId) {
      where.departmentId = departmentId
    }

    if (positionId) {
      where.positionId = positionId
    }

    if (status) {
      where.status = status as EmployeeStatus
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: { select: { id: true, code: true, name: true } },
          position: { select: { id: true, name: true, baseSalary: true } },
          user: { select: { id: true, email: true, role: true } },
          salaryStructures: {
            orderBy: { effectiveDate: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ])

    return NextResponse.json({
      data: employees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ error: 'Không thể lấy danh sách nhân viên' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createEmployeeSchema.parse(body)

    // Check if employee code already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { employeeCode: validatedData.employeeCode },
    })

    if (existingEmployee) {
      return NextResponse.json({ error: 'Mã nhân viên đã tồn tại' }, { status: 400 })
    }

    // Check if email already exists
    const existingEmail = await prisma.employee.findUnique({
      where: { email: validatedData.email },
    })

    if (existingEmail) {
      return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 400 })
    }

    let userId: string | undefined

    // Create user account if requested
    if (validatedData.createAccount) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Email đã có tài khoản' }, { status: 400 })
      }

      const defaultPassword = await bcrypt.hash('employee123', 10)
      const user = await prisma.user.create({
        data: {
          email: validatedData.email,
          password: defaultPassword,
          name: validatedData.fullName,
          role: UserRole.EMPLOYEE,
        },
      })
      userId = user.id
    }

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        employeeCode: validatedData.employeeCode,
        fullName: validatedData.fullName,
        email: validatedData.email,
        phone: validatedData.phone,
        idNumber: validatedData.idNumber,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
        startDate: new Date(validatedData.startDate),
        bankName: validatedData.bankName,
        bankAccount: validatedData.bankAccount,
        socialInsuranceNumber: validatedData.socialInsuranceNumber,
        departmentId: validatedData.departmentId || undefined,
        positionId: validatedData.positionId || undefined,
        userId,
        status: EmployeeStatus.ACTIVE,
      },
      include: {
        department: true,
        position: true,
      },
    })

    // Create salary structure if baseSalary is provided
    if (validatedData.baseSalary && validatedData.baseSalary > 0) {
      await prisma.salaryStructure.create({
        data: {
          employeeId: employee.id,
          baseSalary: validatedData.baseSalary,
          effectiveDate: new Date(validatedData.startDate),
          hasSocialInsurance: true,
          hasHealthInsurance: true,
          hasUnemploymentInsurance: true,
        },
      })
    }

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    console.error('Error creating employee:', error)
    return NextResponse.json({ error: 'Không thể tạo nhân viên' }, { status: 500 })
  }
}
