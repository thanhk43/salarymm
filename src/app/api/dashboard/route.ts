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

    // Get salary by department
    const departmentSalaries = await prisma.department.findMany({
      select: {
        name: true,
        employees: {
          where: { status: EmployeeStatus.ACTIVE },
          select: {
            salaryStructures: {
              orderBy: { effectiveDate: 'desc' },
              take: 1,
              select: { baseSalary: true },
            },
          },
        },
      },
    })

    const salaryByDepartment = departmentSalaries.map((dept) => {
      const totalSalary = dept.employees.reduce((sum, emp) => {
        const salary = emp.salaryStructures[0]?.baseSalary
        return sum + (salary ? Number(salary) : 0)
      }, 0)
      return {
        department: dept.name,
        totalSalary,
        employeeCount: dept.employees.length,
        avgSalary: dept.employees.length > 0 ? Math.round(totalSalary / dept.employees.length) : 0,
      }
    }).filter((d) => d.employeeCount > 0)
    .sort((a, b) => b.totalSalary - a.totalSalary)

    // Get recent payroll summary
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    const recentPayrolls = await prisma.payroll.groupBy({
      by: ['month', 'year', 'status'],
      _sum: { netSalary: true },
      _count: true,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 12,
    })

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
      salaryByDepartment,
      recentPayrolls,
      recentEmployees,
      pendingBonusList,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json({ error: 'Không thể lấy dữ liệu dashboard' }, { status: 500 })
  }
}
