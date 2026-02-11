import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PayslipData {
  employeeName: string
  employeeCode: string
  department: string
  position: string
  month: number
  year: number
  baseSalary: number
  totalAllowances: number
  totalBonus: number
  grossSalary: number
  socialInsurance: number
  healthInsurance: number
  unemploymentInsurance: number
  personalIncomeTax: number
  totalDeductions: number
  netSalary: number
  bankName?: string
  bankAccount?: string
  allowances?: { type: string; amount: number }[]
  bonuses?: { type: string; amount: number; reason: string }[]
}

const allowanceTypeLabels: Record<string, string> = {
  lunch: 'An trua',
  transport: 'Di lai',
  phone: 'Dien thoai',
  housing: 'Nha o',
}

const bonusTypeLabels: Record<string, string> = {
  MONTHLY: 'Hang thang',
  QUARTERLY: 'Quy',
  ANNUAL: 'Nam',
  TET: 'Tet',
  PROJECT: 'Du an',
  PERFORMANCE: 'Hieu suat',
  OTHER: 'Khac',
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND'
}

export function generatePayslipPDF(data: PayslipData): Buffer {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('PHIEU LUONG', 105, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Ky luong: Thang ${data.month}/${data.year}`, 105, 28, { align: 'center' })

  // Company Info
  doc.setFontSize(10)
  doc.text('CONG TY SALARYMM', 105, 36, { align: 'center' })

  // Divider
  doc.setDrawColor(79, 70, 229)
  doc.setLineWidth(0.5)
  doc.line(14, 40, 196, 40)

  // Employee Info
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('THONG TIN NHAN VIEN', 14, 48)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const infoY = 54
  doc.text(`Ho va ten: ${data.employeeName}`, 14, infoY)
  doc.text(`Ma NV: ${data.employeeCode}`, 120, infoY)
  doc.text(`Phong ban: ${data.department}`, 14, infoY + 6)
  doc.text(`Chuc vu: ${data.position}`, 120, infoY + 6)
  if (data.bankName && data.bankAccount) {
    doc.text(`Ngan hang: ${data.bankName} - ${data.bankAccount}`, 14, infoY + 12)
  }

  // Earnings Table
  const earningsStartY = data.bankName ? infoY + 22 : infoY + 16

  const earningsBody: (string | number)[][] = [
    ['Luong co ban', formatVND(data.baseSalary)],
    ['Phu cap', formatVND(data.totalAllowances)],
  ]

  if (data.allowances && data.allowances.length > 0) {
    data.allowances.forEach((a) => {
      earningsBody.push([`  - ${allowanceTypeLabels[a.type] || a.type}`, formatVND(a.amount)])
    })
  }

  earningsBody.push(['Thuong', formatVND(data.totalBonus)])

  if (data.bonuses && data.bonuses.length > 0) {
    data.bonuses.forEach((b) => {
      earningsBody.push([`  - ${bonusTypeLabels[b.type] || b.type}: ${b.reason}`, formatVND(b.amount)])
    })
  }

  autoTable(doc, {
    startY: earningsStartY,
    head: [['THU NHAP', 'SO TIEN']],
    body: earningsBody,
    foot: [['TONG THU NHAP (GROSS)', formatVND(data.grossSalary)]],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 240, 255], textColor: [79, 70, 229], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  // Deductions Table
  const deductionsStartY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  autoTable(doc, {
    startY: deductionsStartY,
    head: [['KHAU TRU', 'SO TIEN']],
    body: [
      ['BHXH (8%)', formatVND(data.socialInsurance)],
      ['BHYT (1.5%)', formatVND(data.healthInsurance)],
      ['BHTN (1%)', formatVND(data.unemploymentInsurance)],
      ['Thue TNCN', formatVND(data.personalIncomeTax)],
    ],
    foot: [['TONG KHAU TRU', formatVND(data.totalDeductions)]],
    theme: 'grid',
    headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [255, 240, 240], textColor: [220, 38, 38], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  // Net Salary
  const netY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  doc.setFillColor(240, 253, 244)
  doc.roundedRect(14, netY - 2, 182, 14, 2, 2, 'F')

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(22, 163, 74)
  doc.text('THUC NHAN (NET)', 20, netY + 7)
  doc.text(formatVND(data.netSalary), 190, netY + 7, { align: 'right' })

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Footer
  const footerY = netY + 24
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    'Day la phieu luong tu dong. Neu co thac mac, vui long lien he phong Nhan su.',
    105,
    footerY,
    { align: 'center' }
  )

  doc.setFontSize(8)
  doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 105, footerY + 5, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}
