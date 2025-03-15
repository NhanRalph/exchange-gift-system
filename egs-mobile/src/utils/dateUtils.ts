// Lấy tên ngày trong tuần từ một Date object
export const getDayOfWeek = (date: Date): string => {
  const daysOfWeek = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return daysOfWeek[date.getDay()];
};

// Chuyển đổi khoảng ngày thành chuỗi ngày trong tuần
export const formatDaysOfWeek = (startDay: Date, endDay: Date): string => {
  const start = new Date(startDay);
  const end = new Date(endDay);
  const dayOfWeeks: string[] = [];

  // Lặp qua từng ngày trong khoảng thời gian
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = getDayOfWeek(new Date(d)); // Lấy ngày trong tuần
    if (!dayOfWeeks.includes(dayOfWeek)) {
      dayOfWeeks.push(dayOfWeek);
    }
  }

  return dayOfWeeks.join("_"); // Kết hợp các ngày thành chuỗi
};
