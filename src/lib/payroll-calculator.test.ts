import { describe, it, expect } from 'vitest'

import {
  calculatePIT,
  calculateInsurance,
  calculatePayroll,
  BHXH_RATE,
  BHYT_RATE,
  BHTN_RATE,
  MAX_INSURANCE_SALARY,
  PERSONAL_DEDUCTION,
  DEPENDENT_DEDUCTION,
} from './payroll-calculator'

describe('Payroll Calculator', () => {
  describe('calculatePIT (Personal Income Tax)', () => {
    it('should return 0 for taxable income <= 0', () => {
      expect(calculatePIT(0)).toBe(0)
      expect(calculatePIT(-1000000)).toBe(0)
    })

    it('should calculate 5% for income up to 5 million', () => {
      // 5,000,000 * 5% = 250,000
      expect(calculatePIT(5000000)).toBe(250000)
      // 3,000,000 * 5% = 150,000
      expect(calculatePIT(3000000)).toBe(150000)
    })

    it('should calculate progressive tax for income in second bracket (5-10 million)', () => {
      // 5,000,000 * 5% + 3,000,000 * 10% = 250,000 + 300,000 = 550,000
      expect(calculatePIT(8000000)).toBe(550000)
      // 5,000,000 * 5% + 5,000,000 * 10% = 250,000 + 500,000 = 750,000
      expect(calculatePIT(10000000)).toBe(750000)
    })

    it('should calculate progressive tax for income in third bracket (10-18 million)', () => {
      // 5M * 5% + 5M * 10% + 5M * 15% = 250K + 500K + 750K = 1,500,000
      expect(calculatePIT(15000000)).toBe(1500000)
      // 5M * 5% + 5M * 10% + 8M * 15% = 250K + 500K + 1,200K = 1,950,000
      expect(calculatePIT(18000000)).toBe(1950000)
    })

    it('should calculate progressive tax for high income (above 32 million)', () => {
      // 5M*5% + 5M*10% + 8M*15% + 14M*20% = 250K + 500K + 1,200K + 2,800K = 4,750,000
      expect(calculatePIT(32000000)).toBe(4750000)
    })

    it('should calculate progressive tax for very high income (above 80 million)', () => {
      // Full calculation for 100 million VND
      // 5M*5% + 5M*10% + 8M*15% + 14M*20% + 20M*25% + 28M*30% + 20M*35%
      // = 250K + 500K + 1,200K + 2,800K + 5,000K + 8,400K + 7,000K = 25,150,000
      expect(calculatePIT(100000000)).toBe(25150000)
    })
  })

  describe('calculateInsurance', () => {
    const fullInsurance = {
      hasSocialInsurance: true,
      hasHealthInsurance: true,
      hasUnemploymentInsurance: true,
    }

    it('should calculate insurance for normal salary', () => {
      const result = calculateInsurance(20000000, fullInsurance)

      expect(result.socialInsurance).toBe(20000000 * BHXH_RATE) // 1,600,000
      expect(result.healthInsurance).toBe(20000000 * BHYT_RATE) // 300,000
      expect(result.unemploymentInsurance).toBe(20000000 * BHTN_RATE) // 200,000
      expect(result.totalInsurance).toBe(2100000) // 10.5% of 20M
    })

    it('should cap insurance at MAX_INSURANCE_SALARY', () => {
      const highSalary = 60000000 // 60 million
      const result = calculateInsurance(highSalary, fullInsurance)

      // Should be capped at 46,800,000
      expect(result.socialInsurance).toBe(Math.round(MAX_INSURANCE_SALARY * BHXH_RATE))
      expect(result.healthInsurance).toBe(Math.round(MAX_INSURANCE_SALARY * BHYT_RATE))
      expect(result.unemploymentInsurance).toBe(Math.round(MAX_INSURANCE_SALARY * BHTN_RATE))
    })

    it('should return 0 for disabled insurance types', () => {
      const result = calculateInsurance(20000000, {
        hasSocialInsurance: false,
        hasHealthInsurance: false,
        hasUnemploymentInsurance: false,
      })

      expect(result.socialInsurance).toBe(0)
      expect(result.healthInsurance).toBe(0)
      expect(result.unemploymentInsurance).toBe(0)
      expect(result.totalInsurance).toBe(0)
    })

    it('should handle partial insurance', () => {
      const result = calculateInsurance(20000000, {
        hasSocialInsurance: true,
        hasHealthInsurance: false,
        hasUnemploymentInsurance: true,
      })

      expect(result.socialInsurance).toBe(1600000)
      expect(result.healthInsurance).toBe(0)
      expect(result.unemploymentInsurance).toBe(200000)
      expect(result.totalInsurance).toBe(1800000)
    })
  })

  describe('calculatePayroll', () => {
    it('should calculate complete payroll correctly', () => {
      const input = {
        baseSalary: 20000000,
        totalAllowances: 2000000,
        totalBonus: 1000000,
        hasSocialInsurance: true,
        hasHealthInsurance: true,
        hasUnemploymentInsurance: true,
      }

      const result = calculatePayroll(input)

      // Gross = 20M + 2M + 1M = 23M
      expect(result.grossSalary).toBe(23000000)

      // Insurance = 20M * 10.5% = 2,100,000
      expect(result.socialInsurance).toBe(1600000)
      expect(result.healthInsurance).toBe(300000)
      expect(result.unemploymentInsurance).toBe(200000)

      // Taxable income = 23M - 2.1M - 11M = 9.9M
      // PIT = 5M * 5% + 4.9M * 10% = 250K + 490K = 740,000
      expect(result.personalIncomeTax).toBe(740000)

      // Total deductions = 2.1M + 740K = 2,840,000
      expect(result.totalDeductions).toBe(2840000)

      // Net = 23M - 2.84M = 20,160,000
      expect(result.netSalary).toBe(20160000)
    })

    it('should return 0 PIT when income is below personal deduction', () => {
      const input = {
        baseSalary: 10000000,
        totalAllowances: 0,
        totalBonus: 0,
        hasSocialInsurance: true,
        hasHealthInsurance: true,
        hasUnemploymentInsurance: true,
      }

      const result = calculatePayroll(input)

      // Gross = 10M
      // Insurance = 10M * 10.5% = 1,050,000
      // Taxable = 10M - 1.05M - 11M = -2,050,000 (negative, so 0)
      expect(result.personalIncomeTax).toBe(0)
    })

    it('should handle dependents deduction', () => {
      const withoutDependents = calculatePayroll({
        baseSalary: 30000000,
        totalAllowances: 0,
        totalBonus: 0,
        hasSocialInsurance: true,
        hasHealthInsurance: true,
        hasUnemploymentInsurance: true,
        dependents: 0,
      })

      const withDependents = calculatePayroll({
        baseSalary: 30000000,
        totalAllowances: 0,
        totalBonus: 0,
        hasSocialInsurance: true,
        hasHealthInsurance: true,
        hasUnemploymentInsurance: true,
        dependents: 2, // 2 dependents = 8.8M additional deduction
      })

      // With dependents should pay less tax
      expect(withDependents.personalIncomeTax).toBeLessThan(withoutDependents.personalIncomeTax)

      // The difference should be related to the tax on 8.8M additional deduction
      const taxDifference = withoutDependents.personalIncomeTax - withDependents.personalIncomeTax
      expect(taxDifference).toBeGreaterThan(0)
    })

    it('should handle no insurance', () => {
      const result = calculatePayroll({
        baseSalary: 20000000,
        totalAllowances: 0,
        totalBonus: 0,
        hasSocialInsurance: false,
        hasHealthInsurance: false,
        hasUnemploymentInsurance: false,
      })

      expect(result.socialInsurance).toBe(0)
      expect(result.healthInsurance).toBe(0)
      expect(result.unemploymentInsurance).toBe(0)

      // Without insurance deduction, taxable income is higher
      // Taxable = 20M - 11M = 9M
      // PIT = 5M * 5% + 4M * 10% = 250K + 400K = 650,000
      expect(result.personalIncomeTax).toBe(650000)
    })
  })

  describe('Constants', () => {
    it('should have correct insurance rates', () => {
      expect(BHXH_RATE).toBe(0.08)
      expect(BHYT_RATE).toBe(0.015)
      expect(BHTN_RATE).toBe(0.01)
    })

    it('should have correct deduction amounts', () => {
      expect(PERSONAL_DEDUCTION).toBe(11000000)
      expect(DEPENDENT_DEDUCTION).toBe(4400000)
    })

    it('should have correct max insurance salary', () => {
      expect(MAX_INSURANCE_SALARY).toBe(46800000)
    })
  })
})
