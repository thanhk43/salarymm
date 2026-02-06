import { NextResponse } from 'next/server'
import { EmployeeStatus, BonusStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get counts
    const [
      totalEmployees,
      activeEmployees,
      totalDepartments,
      totalPositions,
      pendingBonuses,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: EmployeeStatus.ACTIVE } }),
      prisma.department.count(),
      prisma.position.count(),
      prisma.bonus.count({ where: { status: BonusStatus.PENDING } }),
    ])

    // Get department statistics
    const departmentStats = await prisma.department.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        _count: {
          select: { employees: true },
        },
      },
      orderBy: {
        employees: { _count: 'desc' },
      },
      take: 5,
    })

    // Get recent employees
    const recentEmployees = await prisma.employee.findMany({
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        email: true,
        startDate: true,
        department: { select: { name: true } },
        position: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Get pending bonuses
    const pendingBonusList = await prisma.bonus.findMany({
      where: { status: BonusStatus.PENDING },
      select: {
        id: true,
        type: true,
        amount: true,
        reason: true,
        employee: {
          select: {
            fullName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Calculate total salary expenses (from latest salary structures)
    const salaryStructures = await prisma.salaryStructure.findMany({
      where: {
        employee: { status: EmployeeStatus.ACTIVE },
      },
      distinct: ['employeeId'],
      orderBy: { effectiveDate: 'desc' },
      select: {
        baseSalary: true,
      },
    })

    const totalSalaryExpenses = salaryStructures.reduce(
      (sum, s) => sum + Number(s.baseSalary),
      0
    )

    return NextResponse.json({
      stats: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees: totalEmployees - activeEmployees,
        totalDepartments,
        totalPositions,
        pendingBonuses,
        totalSalaryExpenses,
      },
      departmentStats: departmentStats.map((d) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        employeeCount: d._count.employees,
      })),
      recentEmployees,
      pendingBonusList,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Không thể lấy dữ liệu dashboard' }, { status: 500 })
  }
}
