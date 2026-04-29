/**
 * Formats a date string to the format: "DD/MMM/YYYY" (e.g., "04/Nov/2025")
 * @param dateInput - The date to format (ISO string, Date object, Dayjs object, or any valid date string)
 * @returns Formatted date string in "DD/MMM/YYYY" format, or the original string if formatting fails
 */
export const formatDate = (dateInput: unknown): string => {
  if (
    dateInput === null ||
    typeof dateInput === 'undefined' ||
    dateInput === ''
  )
    return 'N/A';

  try {
    let date: Date;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (
      typeof dateInput === 'object' &&
      dateInput !== null &&
      typeof (dateInput as { toDate?: unknown })?.toDate === 'function'
    ) {
      // dayjs-like object or similar
      const maybeToDate = (dateInput as { toDate?: unknown }).toDate;
      if (typeof maybeToDate === 'function') {
        date = (maybeToDate as () => Date).call(dateInput);
      } else {
        date = new Date(String(dateInput));
      }
    } else {
      date = new Date(String(dateInput));
    }
    if (isNaN(date.getTime())) {
      return String(dateInput);
    }

    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
};
