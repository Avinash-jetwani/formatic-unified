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
 * Converts a UTC date to local datetime format for datetime-local input elements
 * @param utcDate - Date in UTC format or ISO string
 * @returns A string in YYYY-MM-DDTHH:MM format for datetime-local inputs
 */
export function utcToLocalDateTimeFormat(utcDate: Date | string | null | undefined): string {
  if (!utcDate) return '';
  
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  // Convert UTC to local time
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  
  // Format as YYYY-MM-DDTHH:MM
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
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
 * Converts a local datetime input value to UTC date
 * @param localDateTime - String in YYYY-MM-DDTHH:MM format from datetime-local input
 * @returns A Date object in UTC
 */
export function localDateTimeToUTC(localDateTime?: string): Date | null {
  if (!localDateTime) return null;
  
  // Create a date directly from the datetime-local string
  // This will be interpreted as local time
  const date = new Date(localDateTime);
  
  // Return the UTC date
  return new Date(date.getTime());
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

/**
 * Creates a future datetime for datetime-local input elements
 * @param daysFromNow - Number of days from now
 * @returns A string in YYYY-MM-DDTHH:MM format
 */
export function createFutureDateTimeForInput(daysFromNow: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  // Set to end of day (23:59) for better UX
  date.setHours(23, 59, 0, 0);
  
  // Format as YYYY-MM-DDTHH:MM
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
} 