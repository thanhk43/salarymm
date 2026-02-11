import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')

    if (!month || !year) {
      return NextResponse.json({ error: 'Vui lòng chọn tháng và năm' }, { status: 400 })
    }

    const payrolls = await prisma.payroll.findMany({
      where: { month, year },
      include: {
        employee: {
          select: {
            employeeCode: true,
            fullName: true,
            department: { select: { name: true } },
            position: { select: { name: true } },
            bankName: true,
            bankAccount: true,
          },
        },
      },
      orderBy: { employee: { employeeCode: 'asc' } },
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'SalaryMM'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet(`Bang luong T${month}-${year}`)

    // Title
    sheet.mergeCells('A1:O1')
    const titleCell = sheet.getCell('A1')
    titleCell.value = `BẢNG LƯƠNG THÁNG ${month}/${year}`
    titleCell.font = { size: 16, bold: true, color: { argb: '4F46E5' } }
    titleCell.alignment = { horizontal: 'center' }

    sheet.mergeCells('A2:O2')
    const subTitleCell = sheet.getCell('A2')
    subTitleCell.value = `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`
    subTitleCell.font = { size: 10, italic: true }
    subTitleCell.alignment = { horizontal: 'center' }

    // Headers
    const headers = [
      'STT',
      'Mã NV',
      'Họ và tên',
      'Phòng ban',
      'Chức vụ',
      'Lương cơ bản',
      'Phụ cấp',
      'Thưởng',
      'Lương Gross',
      'BHXH',
      'BHYT',
      'BHTN',
      'Thuế TNCN',
      'Tổng khấu trừ',
      'Lương Net',
    ]

    const headerRow = sheet.addRow(headers)
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
    headerRow.height = 28

    // Data rows
    payrolls.forEach((p, index) => {
      const row = sheet.addRow([
        index + 1,
        p.employee.employeeCode,
        p.employee.fullName,
        p.employee.department?.name || '',
        p.employee.position?.name || '',
        Number(p.baseSalary),
        Number(p.totalAllowances),
        Number(p.totalBonus),
        Number(p.grossSalary),
        Number(p.socialInsurance),
        Number(p.healthInsurance),
        Number(p.unemploymentInsurance),
        Number(p.personalIncomeTax),
        Number(p.totalDeductions),
        Number(p.netSalary),
      ])

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
        if (colNumber >= 6) {
          cell.numFmt = '#,##0'
          cell.alignment = { horizontal: 'right' }
        }
      })

      if (index % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } }
        })
      }
    })

    // Totals row
    if (payrolls.length > 0) {
      const totals = payrolls.reduce(
        (acc, p) => ({
          baseSalary: acc.baseSalary + Number(p.baseSalary),
          totalAllowances: acc.totalAllowances + Number(p.totalAllowances),
          totalBonus: acc.totalBonus + Number(p.totalBonus),
          grossSalary: acc.grossSalary + Number(p.grossSalary),
          socialInsurance: acc.socialInsurance + Number(p.socialInsurance),
          healthInsurance: acc.healthInsurance + Number(p.healthInsurance),
          unemploymentInsurance: acc.unemploymentInsurance + Number(p.unemploymentInsurance),
          personalIncomeTax: acc.personalIncomeTax + Number(p.personalIncomeTax),
          totalDeductions: acc.totalDeductions + Number(p.totalDeductions),
          netSalary: acc.netSalary + Number(p.netSalary),
        }),
        {
          baseSalary: 0,
          totalAllowances: 0,
          totalBonus: 0,
          grossSalary: 0,
          socialInsurance: 0,
          healthInsurance: 0,
          unemploymentInsurance: 0,
          personalIncomeTax: 0,
          totalDeductions: 0,
          netSalary: 0,
        }
      )

      const totalRow = sheet.addRow([
        '',
        '',
        `TỔNG CỘNG (${payrolls.length} NV)`,
        '',
        '',
        totals.baseSalary,
        totals.totalAllowances,
        totals.totalBonus,
        totals.grossSalary,
        totals.socialInsurance,
        totals.healthInsurance,
        totals.unemploymentInsurance,
        totals.personalIncomeTax,
        totals.totalDeductions,
        totals.netSalary,
      ])

      totalRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } }
        cell.border = {
          top: { style: 'medium' },
          left: { style: 'thin' },
          bottom: { style: 'medium' },
          right: { style: 'thin' },
        }
        if (colNumber >= 6) {
          cell.numFmt = '#,##0'
          cell.alignment = { horizontal: 'right' }
        }
      })
    }

    // Set column widths
    sheet.columns = [
      { width: 5 },   // STT
      { width: 10 },  // Mã NV
      { width: 22 },  // Họ tên
      { width: 15 },  // Phòng ban
      { width: 18 },  // Chức vụ
      { width: 15 },  // Lương CB
      { width: 12 },  // Phụ cấp
      { width: 12 },  // Thưởng
      { width: 15 },  // Gross
      { width: 12 },  // BHXH
      { width: 12 },  // BHYT
      { width: 12 },  // BHTN
      { width: 12 },  // Thuế TNCN
      { width: 14 },  // Tổng KT
      { width: 15 },  // Net
    ]

    const buffer = await workbook.xlsx.writeBuffer()

    const filename = `bang-luong-T${month}-${year}.xlsx`

    return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating Excel:', error)
    return NextResponse.json({ error: 'Không thể tạo file Excel' }, { status: 500 })
  }
}
