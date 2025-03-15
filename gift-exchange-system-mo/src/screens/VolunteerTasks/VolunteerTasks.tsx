import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axiosInstance from '@/src/api/axiosInstance';
import { formatDate_YYYY_MM_DD } from '@/src/shared/formatDate';
import Icon from "react-native-vector-icons/MaterialIcons";
import Colors from '@/src/constants/Colors';
import { AddressCoordinates, DateItem, TaskData, TimeFrame, Transaction } from '@/src/shared/type';
import { useNavigation } from '@/src/hooks/useNavigation';

const VolunteerTasks: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [dateList, setDateList] = useState<DateItem[]>([]);
  const [taskData, setTaskData] = useState<TaskData[]>([]);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const navigation = useNavigation();

  const fetchTasks = async (date: string) => {
    try {
        setLoading(true);
        const response = await axiosInstance.get(`volunteer/task?dateOnly=${date}&pageIndex=1&sizeIndex=10`);
        console.log(response.data.data.data);
        setTaskData(response.data.data.data);
      } catch (error) {
        console.error("Error fetching tasks data:", error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    generateDateList(new Date());
    const date = formatDate_YYYY_MM_DD(new Date().toISOString())
    console.log(date)
    fetchTasks(formatDate_YYYY_MM_DD(new Date().toISOString()));
  }, []);

  // Format date to DD-MM-YYYY
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format date to YYYY-MM-DD (API format)
  const formatAPIDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Generate array of dates with selected date in center
  const generateDateList = (centerDate: Date): void => {
    const dates: DateItem[] = [];
    const prevDate = new Date(centerDate);
    prevDate.setDate(prevDate.getDate() - 1);
    dates.push({
      date: prevDate,
      formatted: formatDate(prevDate)
    });

    dates.push({
      date: new Date(centerDate),
      formatted: formatDate(centerDate)
    });

    const nextDate = new Date(centerDate);
    nextDate.setDate(nextDate.getDate() + 1);
    dates.push({
      date: nextDate,
      formatted: formatDate(nextDate)
    });

    setDateList(dates);
  };

  // Get tasks for selected date
  const getTasksForDate = (date: Date): TimeFrame[] | null => {
    const apiDate = formatAPIDate(date);
    console.log(apiDate)
    const dayData = taskData.find(data => data.date === apiDate);
    return dayData?.volunteerTaskTimeFrame || null;
  };

  const handleDateSelect = (date: Date): void => {
    setSelectedDate(date);
    generateDateList(date);
    setSelectedTimeFrame(null);
    fetchTasks(formatDate_YYYY_MM_DD(date.toISOString()))
  };

  const handleDatePickerChange = (event: any, date?: Date): void => {
    setShowDatePicker(false);
    if (date) {
      handleDateSelect(date);
    }
  };

  const shiftDates = (direction: 'next' | 'prev'): void => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    handleDateSelect(newDate);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date): boolean => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <Image source={{ uri: item.charitarian.image }} style={styles.userImage} />
        <View style={styles.headerText}>
          <Text style={styles.userName}>{item.charitarian.name}</Text>
          <Text style={styles.status}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.charitarianItem.itemName}</Text>
        <Text style={styles.quantity}>Quantity: {item.charitarianItem.itemQuantity}</Text>
      </View>
      <Text style={styles.address}>{item.charitarianAddress.address}</Text>
    </View>
  );

  const renderTimeFrameSection = (timeFrame: TimeFrame) => (
    <View style={styles.timeFrameSection}>
      <TouchableOpacity 
        style={styles.timeFrameHeader}
        onPress={() => setSelectedTimeFrame(
          selectedTimeFrame === timeFrame.timeFrame ? null : timeFrame.timeFrame
        )}
      >
        <Text style={styles.timeFrameTitle}>{timeFrame.timeFrame}</Text>
        <Text style={styles.totalItems}>
          {timeFrame.volunteerTransactionByAddresses.reduce(
            (total, address) => total + address.totalItem, 0
          )} items
        </Text>
      </TouchableOpacity>
      
      {selectedTimeFrame === timeFrame.timeFrame && (
        <FlatList
          data={timeFrame.volunteerTransactionByAddresses.flatMap(
            address => address.transactions
          )}
          renderItem={renderTransaction}
          keyExtractor={(item, index) => `${item.id + index}`}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerText}>Chọn ngày</Text>
        </TouchableOpacity>

        <View style={styles.dateListContainer}>
          {/* <TouchableOpacity 
            style={styles.arrowButton}
            onPress={() => shiftDates('prev')}
          >
            <Text style={styles.arrowText}>{'<'}</Text>
          </TouchableOpacity> */}

          <View style={styles.dateList}>
            {dateList.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateItem,
                  isSelected(item.date) && styles.selectedDate,
                  isToday(item.date) && styles.todayDate,
                  { flex: 1 },
                ]}
                onPress={() => handleDateSelect(item.date)}
              >
                <Text style={[
                  styles.dateText,
                  (isSelected(item.date) || isToday(item.date)) && styles.selectedDateText
                ]}>
                  {isToday(item.date) ? "Hôm nay" : item.formatted}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* <TouchableOpacity 
            style={styles.arrowButton}
            onPress={() => shiftDates('next')}
          >
            <Text style={styles.arrowText}>{'>'}</Text>
          </TouchableOpacity> */}
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDatePickerChange}
        />
      )}

      <ScrollView style={styles.taskContainer}>
        {taskData.length > 0 ? (
            taskData[0].volunteerTaskTimeFrame.map((timeFrame) => (
                <View key={timeFrame.timeFrame} style={styles.timeFrame}>
                    <Text style={styles.timeFrameText}>{timeFrame.timeFrame}</Text>
                    {timeFrame.volunteerTransactionByAddresses.map(((address, index) => (
                        <TouchableOpacity 
                        key={`${address.addressId + index}`}
                            style={[styles.addressContainer, {opacity: address.isCompletedTask ? 0.5 : 1}]}
                            disabled={address.isCompletedTask}
                            onPress={ () => {
                                const dateOnly = formatDate_YYYY_MM_DD(selectedDate.toISOString())
                                navigation.navigate("VolunteerTaskDetail", {
                                    dateOnly,
                                    timeFrame: timeFrame.timeFrame,
                                    addressId: address.addressId,
                                    addressName: address.address,
                                    addressCoordinates: address.addressCoordinates
                                })
                            }
                    }    
                        >
                            <View style={{flex: 9}}>
                                <View style={styles.location}>
                                    <Icon name='location-pin' color={Colors.orange500} size={20}/>
                                    <Text numberOfLines={1}>{address.address}</Text>
                                </View>
                                <View>
                                    <Text style={styles.totalItemsInAddress}>Số lượng sản phẩm: {address.totalItem}</Text>
                                </View>
                                {address.isCompletedTask && (
                                  <View style={styles.completedTask}>
                                      <Icon name='check-circle-outline' color={Colors.green600} size={20}/>
                                      <Text style={styles.completedTaskText} numberOfLines={1}>Đã hoàn thành</Text>
                                  </View>
                                )}
                            </View>
                            <View>
                                <Icon name='arrow-right' color={Colors.orange500} size={28}/>
                            </View>
                        </TouchableOpacity>
                    )))}
                </View>
            ))
        ) : (
          <Text style={styles.noTasks}>Không có nhiệm vụ trong ngày</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  datePickerButton: {
    padding: 10,
    backgroundColor: Colors.orange500,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  datePickerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dateListContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateList: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateItem: {
    padding: 10,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  selectedDate: {
    backgroundColor: Colors.orange500,
    borderColor: Colors.orange500,
  },
  todayDate: {
    backgroundColor: Colors.lightGreen,
    borderColor: Colors.lightGreen,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  selectedDateText: {
    color: '#fff',
  },
  arrowButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  arrowText: {
    fontSize: 16,
    color: '#333',
  },
  taskContainer: {
    flex: 1,
    padding: 15,
  },
  timeFrameSection: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeFrameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  timeFrameTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalItems: {
    color: '#666',
  },
  transactionCard: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  status: {
    color: '#666',
    fontSize: 14,
  },
  itemInfo: {
    marginBottom: 5,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  quantity: {
    color: '#666',
    fontSize: 14,
  },
  address: {
    color: '#666',
    fontSize: 14,
  },
  noTasks: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
   timeFrame: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: Colors.orange500,
    borderRadius: 20,
    marginBottom: 16
  },
  timeFrameText: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: 600
  },
  addressContainer: {
    borderTopWidth: 1,
    borderColor: Colors.gray500,
    marginVertical: 8,
    padding: 8,
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
    gap: 12
  },
  location: {
    fontSize: 16,
    flexDirection: 'row',
  },
  totalItemsInAddress: {
    fontSize: 14
  },
  completedTask: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  completedTaskText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: 600,
    color: Colors.green600
  }
});

export default VolunteerTasks;