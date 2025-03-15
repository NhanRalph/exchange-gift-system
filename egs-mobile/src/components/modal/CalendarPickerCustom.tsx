import React from "react";
import CalendarPicker from "react-native-calendar-picker";
import { Alert, Modal, StyleSheet } from "react-native";
import { DayTimeRange } from "@/src/shared/type";
import Icon from "react-native-vector-icons/Ionicons";
import { View } from "react-native";
import { TouchableOpacity } from "react-native";
import { Text } from "react-native";
import Colors from "@/src/constants/Colors";

interface CalendarPickerCustomProps {
  visible: boolean;
  date: Date;
  setDate: (date: Date) => void;
  allowedDays: string;
  timeRanges?: DayTimeRange[];
  onClose: () => void;
  onConfirm: () => void;
}

export const convertDayOfWeek = (allowedDays: string): string => {
  const dayMap: { [key: string]: string } = {
    sun: "Chủ Nhật",
    mon: "Thứ Hai",
    tue: "Thứ Ba",
    wed: "Thứ Tư",
    thu: "Thứ Năm",
    fri: "Thứ Sáu",
    sat: "Thứ Bảy",
  };

  if (allowedDays === "mon_tue_wed_thu_fri_sat_sun") {
    return "Tất cả các ngày trong tuần";
  }

  if (allowedDays === "mon_tue_wed_thu_fri") {
    return "từ Thứ Hai đến Thứ Sáu";
  }

  if (allowedDays === "sat_sun") {
    return "Cuối tuần";
  }

  return allowedDays
    .split("_")
    .map((day) => dayMap[day.toLowerCase()])
    .filter((day) => day)
    .join(", ");
};

const CalendarPickerCustom: React.FC<CalendarPickerCustomProps> = ({
  visible,
  date,
  setDate,
  allowedDays,
  timeRanges,
  onClose,
  onConfirm,
}) => {
  const dayMap: { [key: string]: number } = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };

  const dateReset = new Date(date);

  const getTimeRangeForDay = (dayIndex: number): DayTimeRange | undefined => {
    if (!timeRanges) return undefined;

    const dayName = Object.keys(dayMap).find((key) => dayMap[key] === dayIndex);
    return timeRanges.find((range) => range.day.toLowerCase() === dayName);
  };

  const isDateAllowed = (testDate: Date): boolean => {
    const dayIndex = testDate.getDay();

    if (timeRanges) {
      const timeRange = getTimeRangeForDay(dayIndex);
      return timeRange !== undefined;
    } else {
      return allowedDays
        .split("_")
        .map((day) => dayMap[day.toLowerCase()])
        .includes(dayIndex);
    }
  };

  const disabledDates = [];

  const startDate = new Date();
  const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (!isDateAllowed(new Date(d))) {
      disabledDates.push(new Date(d));
    }
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <CalendarPicker
            startFromMonday={true}
            allowRangeSelection={false}
            minDate={startDate}
            disabledDates={disabledDates}
            selectedDayColor={Colors.orange500}
            selectedDayTextColor="#FFFFFF"
            selectedStartDate={date}
            width={320}
            previousComponent={
              <Icon name="chevron-back" size={24} color={Colors.orange500} />
            }
            nextComponent={
              <Icon name="chevron-forward" size={24} color={Colors.orange500} />
            }
            onDateChange={(date: any) => {
              if (date) {
                const selectedDate = new Date(date.toString());
                if (isDateAllowed(selectedDate)) {
                  setDate(selectedDate);
                } else {
                  if (timeRanges) {
                    const dayRange = getTimeRangeForDay(selectedDate.getDay());
                    if (dayRange) {
                      Alert.alert(
                        "Error",
                        `${convertDayOfWeek(
                          dayRange.day
                        )} can only be selected from ${
                          dayRange.startHour
                        }:00 to ${dayRange.endHour}:00`
                      );
                    } else {
                      Alert.alert("Error", "This date cannot be selected");
                    }
                  } else {
                    Alert.alert(
                      "Error",
                      `Only allowed on: ${convertDayOfWeek(allowedDays)}`
                    );
                  }
                }
              }
            }}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => onConfirm()}
            >
              <Text style={styles.confirmButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  closeButton: {
    padding: 5,
  },
  calendarHeader: {
    alignItems: "center",
    marginBottom: 10,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
  },
  monthTitleStyle: {
    color: "#007AFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  yearTitleStyle: {
    color: "#007AFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  navigationButton: {
    padding: 10,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  footer: {
    marginTop: 15,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: Colors.orange500,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 5,
    minWidth: 100,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CalendarPickerCustom;
