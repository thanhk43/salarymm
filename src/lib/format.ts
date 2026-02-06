/**
 * Format a number as Vietnamese currency (VND)
 */
export function formatCurrency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
}

/**
 * Format a number as compact Vietnamese currency (for large amounts)
 */
export function formatCompactCurrency(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)}B`
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`
  }
  return new Intl.NumberFormat('vi-VN').format(value)
}

/**
 * Format a date string to Vietnamese locale
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('vi-VN')
}

/**
 * Format a date to full Vietnamese format
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleString('vi-VN')
}

/**
 * Parse Vietnamese currency string to number
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols, dots (thousands separator), and replace comma with dot for decimals
  const cleaned = value.replace(/[^\d,-]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

/**
 * Format phone number to Vietnamese format
 */
export function formatPhone(phone: string): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  return phone
}
