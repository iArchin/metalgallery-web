/**
 * Converts Western numerals to Persian numerals
 * Handles numbers in strings, including percentages and other formats
 */
export function toPersianNumber(num: string | number): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const englishDigits = '0123456789';
  
  const numStr = num.toString();
  return numStr.replace(/\d/g, (digit) => {
    return persianDigits[englishDigits.indexOf(digit)];
  });
}

/**
 * Formats a number with Persian numerals and thousand separators
 */
export function formatPersianNumber(num: number | string): string {
  const numStr = typeof num === 'number' ? num.toString() : num;
  // Remove any existing commas
  const cleanNum = numStr.replace(/,/g, '');
  // Add thousand separators
  const formatted = cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, '،');
  // Convert to Persian numerals
  return toPersianNumber(formatted);
}

