import React from "react";

interface WeekDisplayProps {
  date: Date;
}

const WeekDisplay: React.FC<WeekDisplayProps> = ({ date }) => {
  const getWeekRange = (date: Date): string => {
    const year = date.getFullYear();
    const firstDay = new Date(year, 0, 1);
    const dayOfYear = Math.floor((date.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const weekNumber = Math.ceil(dayOfYear / 7);

    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const formatDate = (d: Date) => d.toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });

    return `Tuần ${weekNumber} (${formatDate(startOfWeek)} - ${formatDate(endOfWeek)})`;
  };

  return (
    <div className="text-primary rounded-lg w-fit">
      <p className="text-lg font-semibold">{getWeekRange(date)}</p>
    </div>
  );
};

export default WeekDisplay;
