import { describe, it, expect } from 'vitest'

import {
  formatCurrency,
  formatCompactCurrency,
  formatDate,
  formatDateTime,
  parseCurrency,
  formatPhone,
} from './format'

describe('Format Utilities', () => {
  describe('formatCurrency', () => {
    it('should format number as VND currency', () => {
      const result = formatCurrency(1000000)
      expect(result).toContain('1.000.000')
      expect(result).toContain('₫')
    })

    it('should handle string input', () => {
      const result = formatCurrency('2500000')
      expect(result).toContain('2.500.000')
    })

    it('should handle zero', () => {
      const result = formatCurrency(0)
      expect(result).toContain('0')
    })

    it('should handle invalid input', () => {
      expect(formatCurrency('invalid')).toBe('0 ₫')
      expect(formatCurrency(NaN)).toBe('0 ₫')
    })

    it('should handle negative numbers', () => {
      const result = formatCurrency(-500000)
      expect(result).toContain('500.000')
    })
  })

  describe('formatCompactCurrency', () => {
    it('should format billions as B', () => {
      expect(formatCompactCurrency(1500000000)).toBe('1.5B')
      expect(formatCompactCurrency(2000000000)).toBe('2.0B')
    })

    it('should format millions as M', () => {
      expect(formatCompactCurrency(15000000)).toBe('15M')
      expect(formatCompactCurrency(1500000)).toBe('2M') // rounds up
    })

    it('should format smaller numbers normally', () => {
      expect(formatCompactCurrency(500000)).toContain('500')
    })
  })

  describe('formatDate', () => {
    it('should format date to Vietnamese locale', () => {
      const result = formatDate('2025-02-05')
      // Vietnamese format: DD/MM/YYYY
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })

    it('should handle ISO date strings', () => {
      const result = formatDate('2025-12-25T00:00:00Z')
      expect(result).toContain('2025')
    })

    it('should return empty string for invalid date', () => {
      expect(formatDate('invalid')).toBe('')
      expect(formatDate('')).toBe('')
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time', () => {
      const result = formatDateTime('2025-02-05T14:30:00Z')
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
      // Should include time component
      expect(result.length).toBeGreaterThan(10)
    })

    it('should return empty string for invalid date', () => {
      expect(formatDateTime('invalid')).toBe('')
    })
  })

  describe('parseCurrency', () => {
    it('should parse Vietnamese currency format', () => {
      expect(parseCurrency('1.000.000 ₫')).toBe(1000000)
      expect(parseCurrency('2.500.000')).toBe(2500000)
    })

    it('should handle plain numbers', () => {
      expect(parseCurrency('1000000')).toBe(1000000)
    })

    it('should handle decimal values with comma', () => {
      expect(parseCurrency('1000,50')).toBe(1000.5)
    })

    it('should return 0 for invalid input', () => {
      expect(parseCurrency('')).toBe(0)
      expect(parseCurrency('abc')).toBe(0)
    })
  })

  describe('formatPhone', () => {
    it('should format 10-digit phone number', () => {
      expect(formatPhone('0901234567')).toBe('0901 234 567')
    })

    it('should handle phone with existing formatting', () => {
      expect(formatPhone('090-123-4567')).toBe('0901 234 567')
    })

    it('should return original for non-10-digit numbers', () => {
      expect(formatPhone('123')).toBe('123')
      expect(formatPhone('12345678901')).toBe('12345678901')
    })

    it('should handle empty input', () => {
      expect(formatPhone('')).toBe('')
    })
  })
})
