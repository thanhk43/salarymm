// Vietnam insurance rates (from July 2025)
export const BHXH_RATE = 0.08 // 8% Social Insurance
export const BHYT_RATE = 0.015 // 1.5% Health Insurance
export const BHTN_RATE = 0.01 // 1% Unemployment Insurance
export const MAX_INSURANCE_SALARY = 46800000 // Maximum salary for insurance calculation (20x base salary)

// Personal Income Tax brackets (Vietnam 2025)
export const PIT_BRACKETS = [
  { min: 0, max: 5000000, rate: 0.05 },
  { min: 5000000, max: 10000000, rate: 0.1 },
  { min: 10000000, max: 18000000, rate: 0.15 },
  { min: 18000000, max: 32000000, rate: 0.2 },
  { min: 32000000, max: 52000000, rate: 0.25 },
  { min: 52000000, max: 80000000, rate: 0.3 },
  { min: 80000000, max: Infinity, rate: 0.35 },
]

export const PERSONAL_DEDUCTION = 11000000 // 11 million VND personal deduction
export const DEPENDENT_DEDUCTION = 4400000 // 4.4 million VND per dependent

/**
 * Calculate Personal Income Tax using Vietnam progressive tax brackets
 */
export function calculatePIT(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0

  let tax = 0
  let remainingIncome = taxableIncome

  for (const bracket of PIT_BRACKETS) {
    if (remainingIncome <= 0) break

    const bracketWidth = bracket.max - bracket.min
    const taxableInBracket = Math.min(remainingIncome, bracketWidth)
    tax += taxableInBracket * bracket.rate
    remainingIncome -= taxableInBracket
  }

  return Math.round(tax)
}

/**
 * Calculate insurance deductions
 */
export function calculateInsurance(
  baseSalary: number,
  options: {
    hasSocialInsurance: boolean
    hasHealthInsurance: boolean
    hasUnemploymentInsurance: boolean
  }
) {
  const insuranceSalary = Math.min(baseSalary, MAX_INSURANCE_SALARY)

  const socialInsurance = options.hasSocialInsurance ? Math.round(insuranceSalary * BHXH_RATE) : 0
  const healthInsurance = options.hasHealthInsurance ? Math.round(insuranceSalary * BHYT_RATE) : 0
  const unemploymentInsurance = options.hasUnemploymentInsurance ? Math.round(insuranceSalary * BHTN_RATE) : 0

  return {
    socialInsurance,
    healthInsurance,
    unemploymentInsurance,
    totalInsurance: socialInsurance + healthInsurance + unemploymentInsurance,
  }
}

export interface PayrollInput {
  baseSalary: number
  totalAllowances: number
  totalBonus: number
  hasSocialInsurance: boolean
  hasHealthInsurance: boolean
  hasUnemploymentInsurance: boolean
  dependents?: number
}

export interface PayrollResult {
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
}

/**
 * Calculate full payroll for an employee
 */
export function calculatePayroll(input: PayrollInput): PayrollResult {
  const { baseSalary, totalAllowances, totalBonus, dependents = 0 } = input

  // Gross salary
  const grossSalary = baseSalary + totalAllowances + totalBonus

  // Calculate insurance deductions
  const insurance = calculateInsurance(baseSalary, {
    hasSocialInsurance: input.hasSocialInsurance,
    hasHealthInsurance: input.hasHealthInsurance,
    hasUnemploymentInsurance: input.hasUnemploymentInsurance,
  })

  // Calculate taxable income (after personal deduction, dependents, and insurance)
  const totalDeductionForTax = PERSONAL_DEDUCTION + dependents * DEPENDENT_DEDUCTION
  const incomeAfterDeductions = grossSalary - insurance.totalInsurance - totalDeductionForTax
  const personalIncomeTax = calculatePIT(incomeAfterDeductions)

  // Total deductions
  const totalDeductions = insurance.totalInsurance + personalIncomeTax

  // Net salary
  const netSalary = grossSalary - totalDeductions

  return {
    baseSalary,
    totalAllowances,
    totalBonus,
    grossSalary,
    socialInsurance: insurance.socialInsurance,
    healthInsurance: insurance.healthInsurance,
    unemploymentInsurance: insurance.unemploymentInsurance,
    personalIncomeTax,
    totalDeductions,
    netSalary,
  }
}
