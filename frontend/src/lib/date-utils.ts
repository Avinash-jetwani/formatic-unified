/**
 * Converts a UTC date to local date format for input elements
 * @param utcDate - Date in UTC format or ISO string
 * @returns A string in YYYY-MM-DD format for date inputs
 */
export function utcToLocalInputFormat(utcDate: Date | string | null | undefined): string {
  if (!utcDate) return '';
  
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  // Format as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Converts a local date input value to UTC date
 * @param localDate - String in YYYY-MM-DD format from date input
 * @returns A Date object in UTC
 */
export function localInputToUTC(localDate?: string): Date | null {
  if (!localDate) return null;
  
  // Parse the date parts
  const [year, month, day] = localDate.split('-').map(Number);
  
  // Create a Date object (will be in local timezone)
  const date = new Date(year, month - 1, day);
  
  // Convert to UTC
  return new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0, 0, 0, 0
  ));
}

/**
 * Creates a future date for input elements
 * @param daysFromNow - Number of days from now
 * @returns A string in YYYY-MM-DD format
 */
export function createFutureDateForInput(daysFromNow: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return utcToLocalInputFormat(date);
} 