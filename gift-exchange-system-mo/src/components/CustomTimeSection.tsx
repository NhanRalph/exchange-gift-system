import { View, Animated, StyleSheet } from 'react-native';
import { Surface, Text, Chip } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useEffect } from 'react';

interface CustomTimeSectionProps {
  customStartTime: string;
  setCustomStartTime: (value: string) => void;
  customEndTime: string;
  setCustomEndTime: (value: string) => void;
  selectedDays: string[];
  handleDayToggle: (day: string) => void;
  TIME_SLOTS: Array<{ value: string; label: string }>;
  WEEKDAYS: Array<{ value: string; label: string }>;
}

export const CustomTimeSection = ({
  customStartTime,
  setCustomStartTime,
  customEndTime,
  setCustomEndTime,
  selectedDays,
  handleDayToggle,
  TIME_SLOTS,
  WEEKDAYS
}: CustomTimeSectionProps) => {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.customTimeContainer,
        {
          opacity: fadeAnim
        }
      ]}
    >
      <Surface style={styles.timeSection}>
        <Text style={styles.sectionTitle}>Thời gian</Text>
        <View style={styles.timePickersRow}>
          <View style={styles.timePickerWrapper}>
            <Text style={styles.timeLabel}>Từ:</Text>
            <Picker
              selectedValue={customStartTime}
              style={styles.enhancedTimePicker}
              onValueChange={setCustomStartTime}
            >
              {TIME_SLOTS.map((slot: any) => (
                <Picker.Item
                  key={slot.value}
                  label={slot.label}
                  value={slot.value}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.timePickerWrapper}>
            <Text style={styles.timeLabel}>Đến:</Text>
            <Picker
              selectedValue={customEndTime}
              style={styles.enhancedTimePicker}
              onValueChange={setCustomEndTime}
            >
              {TIME_SLOTS.map((slot: any) => (
                <Picker.Item
                  key={slot.value}
                  label={slot.label}
                  value={slot.value}
                />
              ))}
            </Picker>
          </View>
        </View>
      </Surface>

      <Surface style={styles.weekdaySection}>
        <Text style={styles.sectionTitle}>Chọn các ngày rảnh:</Text>
        <View style={styles.weekdayGrid}>
          {WEEKDAYS.map((day: any) => (
            <Chip
              key={day.value}
              selected={selectedDays.includes(day.value)}
              onPress={() => handleDayToggle(day.value)}
              style={styles.weekdayChip}
              mode="outlined"
            >
              {day.label}
            </Chip>
          ))}
        </View>
      </Surface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  customTimeContainer: {
    gap: 16,
    marginTop: 16,
  },
  timeSection: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  weekdaySection: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  timePickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  timePickerWrapper: {
    flex: 1,
  },
  timeLabel: {
    marginBottom: 8,
  },
  enhancedTimePicker: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    height: 48,
  },
  weekdayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekdayChip: {
    marginBottom: 8,
  },
});