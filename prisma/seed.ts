import 'dotenv/config'

import { PrismaClient, UserRole, EmployeeStatus, BonusType, BonusStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Create Departments
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: 'IT' },
      update: {},
      create: {
        code: 'IT',
        name: 'Phòng Công nghệ thông tin',
        description: 'Information Technology Department',
      },
    }),
    prisma.department.upsert({
      where: { code: 'HR' },
      update: {},
      create: {
        code: 'HR',
        name: 'Phòng Nhân sự',
        description: 'Human Resources Department',
      },
    }),
    prisma.department.upsert({
      where: { code: 'SALES' },
      update: {},
      create: {
        code: 'SALES',
        name: 'Phòng Kinh doanh',
        description: 'Sales Department',
      },
    }),
    prisma.department.upsert({
      where: { code: 'FIN' },
      update: {},
      create: {
        code: 'FIN',
        name: 'Phòng Tài chính Kế toán',
        description: 'Finance & Accounting Department',
      },
    }),
  ])

  console.log(`Created ${departments.length} departments`)

  // Create Positions
  const positions = await Promise.all([
    prisma.position.upsert({
      where: { name: 'Developer' },
      update: {},
      create: {
        name: 'Developer',
        baseSalary: 15000000,
        description: 'Software Developer',
      },
    }),
    prisma.position.upsert({
      where: { name: 'Senior Developer' },
      update: {},
      create: {
        name: 'Senior Developer',
        baseSalary: 25000000,
        description: 'Senior Software Developer',
      },
    }),
    prisma.position.upsert({
      where: { name: 'Manager' },
      update: {},
      create: {
        name: 'Manager',
        baseSalary: 30000000,
        description: 'Department Manager',
      },
    }),
    prisma.position.upsert({
      where: { name: 'Accountant' },
      update: {},
      create: {
        name: 'Accountant',
        baseSalary: 12000000,
        description: 'Accountant',
      },
    }),
    prisma.position.upsert({
      where: { name: 'Sales Executive' },
      update: {},
      create: {
        name: 'Sales Executive',
        baseSalary: 10000000,
        description: 'Sales Executive',
      },
    }),
    prisma.position.upsert({
      where: { name: 'HR Specialist' },
      update: {},
      create: {
        name: 'HR Specialist',
        baseSalary: 12000000,
        description: 'HR Specialist',
      },
    }),
  ])

  console.log(`Created ${positions.length} positions`)

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@salarymm.com' },
    update: {},
    create: {
      email: 'admin@salarymm.com',
      password: adminPassword,
      name: 'System Admin',
      role: UserRole.ADMIN,
    },
  })

  console.log(`Created admin user: ${adminUser.email}`)

  // Create Sample Employees with Users
  const employeePassword = await bcrypt.hash('employee123', 10)

  const employeeData = [
    {
      employeeCode: 'NV001',
      fullName: 'Nguyen Van A',
      email: 'nguyenvana@salarymm.com',
      phone: '0901234567',
      idNumber: '001234567890',
      dateOfBirth: new Date('1990-05-15'),
      startDate: new Date('2023-01-15'),
      bankName: 'Vietcombank',
      bankAccount: '1234567890123',
      socialInsuranceNumber: 'BHXH001',
      departmentCode: 'IT',
      positionName: 'Senior Developer',
      baseSalary: 25000000,
    },
    {
      employeeCode: 'NV002',
      fullName: 'Tran Thi B',
      email: 'tranthib@salarymm.com',
      phone: '0902345678',
      idNumber: '001234567891',
      dateOfBirth: new Date('1992-08-20'),
      startDate: new Date('2023-03-01'),
      bankName: 'Techcombank',
      bankAccount: '2345678901234',
      socialInsuranceNumber: 'BHXH002',
      departmentCode: 'HR',
      positionName: 'Manager',
      baseSalary: 30000000,
    },
    {
      employeeCode: 'NV003',
      fullName: 'Le Van C',
      email: 'levanc@salarymm.com',
      phone: '0903456789',
      idNumber: '001234567892',
      dateOfBirth: new Date('1995-01-10'),
      startDate: new Date('2024-01-01'),
      bankName: 'MB Bank',
      bankAccount: '3456789012345',
      socialInsuranceNumber: 'BHXH003',
      departmentCode: 'SALES',
      positionName: 'Sales Executive',
      baseSalary: 10000000,
    },
    {
      employeeCode: 'NV004',
      fullName: 'Pham Thi D',
      email: 'phamthid@salarymm.com',
      phone: '0904567890',
      idNumber: '001234567893',
      dateOfBirth: new Date('1993-11-25'),
      startDate: new Date('2023-06-15'),
      bankName: 'BIDV',
      bankAccount: '4567890123456',
      socialInsuranceNumber: 'BHXH004',
      departmentCode: 'IT',
      positionName: 'Developer',
      baseSalary: 15000000,
    },
    {
      employeeCode: 'NV005',
      fullName: 'Hoang Van E',
      email: 'hoangvane@salarymm.com',
      phone: '0905678901',
      idNumber: '001234567894',
      dateOfBirth: new Date('1988-03-30'),
      startDate: new Date('2022-09-01'),
      bankName: 'ACB',
      bankAccount: '5678901234567',
      socialInsuranceNumber: 'BHXH005',
      departmentCode: 'FIN',
      positionName: 'Accountant',
      baseSalary: 12000000,
    },
  ]

  for (const emp of employeeData) {
    const department = departments.find((d) => d.code === emp.departmentCode)
    const position = positions.find((p) => p.name === emp.positionName)

    // Create user for employee
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        password: employeePassword,
        name: emp.fullName,
        role: UserRole.EMPLOYEE,
      },
    })

    // Create employee
    const employee = await prisma.employee.upsert({
      where: { employeeCode: emp.employeeCode },
      update: {},
      create: {
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        email: emp.email,
        phone: emp.phone,
        idNumber: emp.idNumber,
        dateOfBirth: emp.dateOfBirth,
        startDate: emp.startDate,
        bankName: emp.bankName,
        bankAccount: emp.bankAccount,
        socialInsuranceNumber: emp.socialInsuranceNumber,
        status: EmployeeStatus.ACTIVE,
        departmentId: department?.id,
        positionId: position?.id,
        userId: user.id,
      },
    })

    // Create salary structure
    await prisma.salaryStructure.upsert({
      where: {
        id: `salary-${emp.employeeCode}`,
      },
      update: {},
      create: {
        id: `salary-${emp.employeeCode}`,
        employeeId: employee.id,
        baseSalary: emp.baseSalary,
        effectiveDate: emp.startDate,
        hasSocialInsurance: true,
        hasHealthInsurance: true,
        hasUnemploymentInsurance: true,
      },
    })

    // Create allowances
    await Promise.all([
      prisma.allowance.create({
        data: {
          employeeId: employee.id,
          type: 'lunch',
          amount: 730000,
          description: 'Phụ cấp ăn trưa',
        },
      }),
      prisma.allowance.create({
        data: {
          employeeId: employee.id,
          type: 'transport',
          amount: 500000,
          description: 'Phụ cấp xăng xe',
        },
      }),
      prisma.allowance.create({
        data: {
          employeeId: employee.id,
          type: 'phone',
          amount: 200000,
          description: 'Phụ cấp điện thoại',
        },
      }),
    ])

    console.log(`Created employee: ${emp.fullName}`)
  }

  // Create some sample bonuses
  const employees = await prisma.employee.findMany()

  for (const employee of employees.slice(0, 3)) {
    await prisma.bonus.create({
      data: {
        employeeId: employee.id,
        type: BonusType.PERFORMANCE,
        amount: 2000000,
        reason: 'Hoàn thành xuất sắc công việc Q4/2025',
        month: 1,
        year: 2026,
        status: BonusStatus.APPROVED,
        approvedById: adminUser.id,
        approvedAt: new Date(),
      },
    })
  }

  console.log('Created sample bonuses')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
