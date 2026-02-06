import { NextRequest, NextResponse } from 'next/server'
import { PayrollStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the employee associated with this user
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin nhân viên' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    // Only show CONFIRMED or PAID payrolls to employees
    const payrolls = await prisma.payroll.findMany({
      where: {
        employeeId: employee.id,
        year: parseInt(year),
        status: {
          in: [PayrollStatus.CONFIRMED, PayrollStatus.PAID],
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    return NextResponse.json({
      data: payrolls,
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
      },
    })
  } catch (error) {
    console.error('Error fetching my payslips:', error)
    return NextResponse.json({ error: 'Không thể lấy danh sách phiếu lương' }, { status: 500 })
  }
}
