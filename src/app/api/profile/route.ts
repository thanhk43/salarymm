import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            email: true,
            phone: true,
            idNumber: true,
            dateOfBirth: true,
            startDate: true,
            bankName: true,
            bankAccount: true,
            socialInsuranceNumber: true,
            status: true,
            department: { select: { name: true } },
            position: { select: { name: true } },
            salaryStructures: {
              orderBy: { effectiveDate: 'desc' },
              take: 1,
              select: {
                baseSalary: true,
                effectiveDate: true,
                hasSocialInsurance: true,
                hasHealthInsurance: true,
                hasUnemploymentInsurance: true,
              },
            },
            allowances: {
              where: { isActive: true },
              select: { type: true, amount: true },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Không thể lấy thông tin hồ sơ' }, { status: 500 })
  }
}
