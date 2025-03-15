// Day mappings
const DAYS_MAP: Record<string, string> = {
  mon: 'Thứ 2',
  tue: 'Thứ 3',
  wed: 'Thứ 4',
  thu: 'Thứ 5',
  fri: 'Thứ 6',
  sat: 'Thứ 7',
  sun: 'Chủ nhật',
};

// Predefined time patterns
const TIME_PATTERNS: Record<string, string> = {
  allDay: 'Cả ngày',
  officeHours: 'Giờ hành chính',
  evening: 'Buổi tối',
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);

  // Format time HH:mm
  const time = new Intl.DateTimeFormat('vi', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);

  // Format date DD/MM/YYYY
  const datePart = new Intl.DateTimeFormat('vi', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

  // Combine time and date in desired format
  return `${datePart} ${time}`;
};

export const formatDate_HHmm_DD_MM_YYYY = (dateString: string): string => {
  const date = new Date(dateString);

  // Format time HH:mm
  const time = new Intl.DateTimeFormat('vi', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  // Format date DD/MM/YYYY
  const datePart = new Intl.DateTimeFormat('vi', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);

  // Combine time and date in desired format
  return `${datePart} ${time}`;
};

export const formatDateOnlyDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

export const formatDate_DD_MM_YYYY = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
};

export const formatDate_M_D_YYYY = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1); // Months are zero-based
  const day = String(date.getDate());
  return `${month}/${day}/${year}`;
};

// Helper to format time range
const formatTimeRange = (timeStr: string): string => {
  const [start, end] = timeStr.split('_');
  return `${start.replace(':', 'h')} - ${end.replace(':', 'h')}`;
};

// Helper to format days
const formatDays = (daysStr: string): string => {
  return daysStr
    .split('_')
    .map((day) => DAYS_MAP[day])
    .join(', ');
};

export const formatAvailableTime = (availableTime: string): string => {
  try {
    const [pattern, time, days] = availableTime.split(' ');

    // Handle predefined patterns
    if (TIME_PATTERNS[pattern]) {
      return `${TIME_PATTERNS[pattern]}: ${formatTimeRange(time)} (${formatDays(
        days,
      )})`;
    }

    // Handle customPerDay pattern
    if (pattern === 'customPerDay') {
      return `${formatTimeRange(time)} (${formatDays(days)})`;
    }

    return availableTime; // Return original if format not recognized
  } catch (error) {
    console.error('Error formatting available time:', error);
    return availableTime;
  }
};

export const formatAvailableTimeWithoutPattern = (
  availableTime: string,
): string => {
  try {
    const [time, days] = availableTime.split(' ');

    return `${formatTimeRange(time)} (${formatDays(days)})`;
  } catch (error) {
    console.error('Error formatting available time:', error);
    return availableTime;
  }
};
