import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Alert } from 'react-native';
import { DayTimeRange } from '@/src/shared/type';

interface DateTimePickerCustomProps {
  date: Date;
  setDate: (date: Date) => void;
  allowedDays: string;
  timeRanges?: DayTimeRange[]; // Thêm prop mới
  onClose: () => void;
}

export const convertDayOfWeek = (allowedDays: string): string => {
    const dayMap: { [key: string]: string } = {
      'sun': 'Chủ Nhật',
      'mon': 'Thứ Hai', 
      'tue': 'Thứ Ba',
      'wed': 'Thứ Tư',
      'thu': 'Thứ Năm',
      'fri': 'Thứ Sáu',
      'sat': 'Thứ Bảy'
    };

    if(allowedDays === 'mon_tue_wed_thu_fri_sat_sun') {
        return 'Tất cả các ngày trong tuần';
    }

    if(allowedDays === 'mon_tue_wed_thu_fri') {
        return 'từ Thứ Hai đến Thứ Sáu';
    }

    if(allowedDays === 'sat_sun') {
        return 'Cuối tuần';
    }
  
    return allowedDays
      .split('_')
      .map(day => dayMap[day.toLowerCase()])
      .filter(day => day) // Remove any undefined values
      .join(', ');
  };


const DateTimePickerCustom: React.FC<DateTimePickerCustomProps> = ({ 
    date, 
    setDate, 
    allowedDays, 
    timeRanges,
    onClose 
  }) => {
    const dayMap: { [key: string]: number } = {
      sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6
    };

    const getTimeRangeForDay = (dayIndex: number): DayTimeRange | undefined => {
      if (!timeRanges) return undefined;
      
      const dayName = Object.keys(dayMap).find(key => dayMap[key] === dayIndex);
      return timeRanges.find(range => range.day.toLowerCase() === dayName);
    };

    const isDateAllowed = (testDate: Date): boolean => {
      const dayIndex = testDate.getDay();
      
      if (timeRanges) {
        // Chỉ kiểm tra ngày, không kiểm tra giờ khi chọn date
        const timeRange = getTimeRangeForDay(dayIndex);
        return timeRange !== undefined;
      } else {
        // Logic cũ cho officeHours
        return allowedDays.split('_')
          .map(day => dayMap[day.toLowerCase()])
          .includes(dayIndex);
      }
    };
    
    const getNextAllowedDate = (currentDate: Date) => {
      let nextDate = new Date(currentDate);
      while (!isDateAllowed(nextDate)) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      return nextDate;
    };
  
    const initialAllowedDate = getNextAllowedDate(new Date());
  
    return (
      <DateTimePicker
        display="default"
        mode="date"
        value={date}
        minimumDate={initialAllowedDate}
        maximumDate={getNextAllowedDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000))}
        onChange={(event, selectedDate) => {
          if (selectedDate) {
            if (isDateAllowed(selectedDate)) {
              setDate(selectedDate);
              onClose();
            } else {
              onClose();
              if (timeRanges) {
                const dayRange = getTimeRangeForDay(selectedDate.getDay());
                if (dayRange) {
                  Alert.alert('Lỗi', 
                    `Ngày ${convertDayOfWeek(dayRange.day)} chỉ được chọn từ ${dayRange.startHour}:00 đến ${dayRange.endHour}:00`
                  );
                } else {
                  Alert.alert('Lỗi', 'Ngày này không được phép chọn');
                }
              } else {
                Alert.alert('Lỗi', `Chỉ được chọn các ngày: ${convertDayOfWeek(allowedDays)}`);
              }
            }
          }
        }}
      />
    );
  };

export default DateTimePickerCustom;