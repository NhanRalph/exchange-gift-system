import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { DayTimeRange, Product } from "@/src/shared/type";
import axiosInstance from "@/src/api/axiosInstance";
import {
  formatDate,
  formatDate_DD_MM_YYYY,
  formatDate_M_D_YYYY,
} from "@/src/shared/formatDate";
import { RootStackParamList } from "@/src/layouts/types/navigationTypes";
import Colors from "@/src/constants/Colors";
import MediaUploadSection from "@/src/components/MediaUploadSection";
import * as ImagePicker from "expo-image-picker";
import { useAuthCheck } from "@/src/hooks/useAuth";
import { useNavigation } from "@/src/hooks/useNavigation";
import { CustomAlert } from "@/src/components/CustomAlert";
import DateTimePickerCustom, {
  convertDayOfWeek,
} from "@/src/components/modal/DateTimePickerCustom";
import CalendarPickerCustom from "@/src/components/modal/CalendarPickerCustom";
import ImageCarousel from "@/src/components/ImageCarousel";
import Constants from "expo-constants";
const API_CREATE_REQUEST = (Constants.expoConfig as any).extra.API_CREATE_REQUEST;
const API_GET_BUSY_TIME = (Constants.expoConfig as any).extra.API_GET_BUSY_TIME;
const API_GET_PRODUCT_BY_ID = (Constants.expoConfig as any).extra.API_GET_PRODUCT_BY_ID;

type TimeSlot = {
  id: string;
  dateTime: string;
  displayText: string;
};

type BusyTimeRange = {
  startTime: string;
  endTime: string;
  date: string;
};

type ProductDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  "ProductDetail"
>;

const STATUS_CAMPAIGN_COLORS: { [key: string]: string } = {
  Pending: Colors.orange500,
  Approved: Colors.lightGreen,
  Rejected: Colors.lightRed,
  Canceled: Colors.gray500,
  Hold_On: Colors.gray500,
};

const STATUS_CAMPAIGN_LABELS = {
  Pending: "Chờ chấp nhận",
  Approved: "Đã được chấp nhận",
  Rejected: "Không được chấp nhận",
  Canceled: "Đã bị huỷ",
  Hold_On: "Tạm hoãn do trong giao dịch khác",
};

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailScreenRouteProp>();
  const itemId = route.params.productId;

  const { isAuthenticated, userData } = useAuthCheck();
  const navigation = useNavigation();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  const [moreImages, setMoreImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [userItems, setUserItems] = useState<Product[]>([]);
  const [busyTime, setBusyTime] = useState<string[]>([]);
  const [selectedUserItem, setSelectedUserItem] = useState<Product | null>(
    null
  );
  const [loadingUserItems, setLoadingUserItems] = useState(false);

  const [wannaRequest, setWannaRequest] = useState(false);
  const [isTrue, setIsTrue] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedMinute, setSelectedMinute] = useState<number | null>(null);
  const [showHourModal, setShowHourModal] = useState(false);
  const [showMinuteModal, setShowMinuteModal] = useState(false);
  const [timeInputError, setTimeInputError] = useState("");
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);
  const [daysOnly, setDaysOnly] = useState("mon_tue_wed_thu_fri_sat_sun");
  const [timeRanges, setTimeRanges] = useState<DayTimeRange[]>([]);
  const [typeTimeRange, setTypeTimeRange] = useState("officeHours");

  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    submessage: string | null;
  }>({
    title: "",
    message: "",
    submessage: null,
  });

  useEffect(() => {
    const fetchProduct = async () => {
      if (!itemId) {
        setError("Invalid product ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.get(
          `${API_GET_PRODUCT_BY_ID}/${itemId}`
        );
        if (response.data.isSuccess && response.data.data) {
          console.log("Product data:", response.data.data.id);
          setProduct(response.data.data);
          setCustomTimeRanges(
            response.data.data?.availableTime ||
              "officeHours 9:00_17:00 mon_tue_wed_thu_fri"
          );
          const nextValidDate = getNextValidDate(
            response.data.data?.availableTime
          );
          console.log("Next valid date:", nextValidDate);
          setSelectedDate(nextValidDate);
        } else {
          throw new Error(response.data.message || "Failed to fetch product");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Không thể tải thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    fetchBusyTime();
  }, [itemId]);

  const getNextValidDate = (availableTime: string): Date => {
    // Giải mã availableTime
    const daysOfWeekMap: { [key: string]: number } = {
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
      sun: 0,
    };

    // Lấy danh sách ngày hợp lệ từ availableTime
    let validDays: number[] = [];
    const timePattern =
      /mon_tue_wed_thu_fri_sat_sun|mon_tue_wed_thu_fri|mon_tue_wed_thu|sun|sat|fri|thu|wed|tue|mon/;
    const match = availableTime.match(timePattern);

    if (match) {
      const daysString = match[0];
      const days = daysString.split("_");
      validDays = days.map((day) => daysOfWeekMap[day]);
    }

    // Lấy ngày hiện tại
    const currentDate = new Date();
    const currentDayOfWeek = currentDate.getDay();

    // Nếu ngày hiện tại là hợp lệ, trả về ngày hiện tại
    if (validDays.includes(currentDayOfWeek)) {
      return currentDate;
    }

    // Tìm ngày hợp lệ gần nhất
    let nextValidDate = new Date(currentDate);
    while (!validDays.includes(nextValidDate.getDay())) {
      nextValidDate.setDate(nextValidDate.getDate() + 1);
    }

    return nextValidDate;
  };

  const uploadImageToCloudinary = async (uri: string): Promise<string> => {
    try {
      console.log("Starting upload process with URI:", uri);

      // Create file object
      const filename = uri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      console.log("File details:", {
        filename,
        type,
      });

      const formData = new FormData();

      const fileData = {
        uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
        name: filename,
        type: type,
      };

      const CLOUDINARY_UPLOAD_PRESET = "gift_system";
      const CLOUDINARY_URL =
        "https://api.cloudinary.com/v1_1/dt4ianp80/image/upload";

      formData.append("file", fileData as any);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      // Get detailed error message if available
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} - ${JSON.stringify(responseData)}`
        );
      }

      return responseData.secure_url;
    } catch (error: any) {
      console.error("Detailed upload error:", {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  };

  const handleImageUpload = async () => {
    try {
      setIsUploadingImage(true);
      setSelectedUserItem(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setSelectedImage(uri);

        const imageUrl = await uploadImageToCloudinary(uri);
        setMoreImages((prev) => [...prev, imageUrl]);
        setAlertData({
          title: "Thành công",
          message: "Tải hình ảnh lên thành công!",
          submessage: null,
        });
        setShowAlertDialog(true);
      }
    } catch (error) {
      setAlertData({
        title: "Thất bại",
        message: "Tải hình ảnh lên thất bại! Vui lòng thử lại.",
        submessage: null,
      });
      setShowAlertDialog(true);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = moreImages.filter((_, idx) => idx !== index);
    setMoreImages(newImages);
  };

  const parseCustomPerDay = (rangeString: string): DayTimeRange[] => {
    const [type, ...dayRanges] = rangeString.split(" ");

    if (type !== "customPerDay") return [];

    return dayRanges
      .join(" ")
      .split("|")
      .map((dayRange) => {
        const [hours, day] = dayRange.trim().split(" ");
        const [start, end] = hours.split("_");

        // Tách giờ và phút cho thời gian bắt đầu
        const [startHour, startMinute] = start.split(":").map(Number);
        // Tách giờ và phút cho thời gian kết thúc
        const [endHour, endMinute] = end.split(":").map(Number);

        return {
          day: day,
          startHour,
          startMinute,
          endHour,
          endMinute,
        };
      });
  };

  const parseBusyTimes = (busyTimes: string[]): BusyTimeRange[] => {
    return busyTimes.map((busyTime) => {
      const [timeRange, date] = busyTime.split(" | ");
      const [startTime, endTime] = timeRange.split("_");
      return {
        startTime,
        endTime,
        date,
      };
    });
  };

  const isTimeInBusyRange = (
    hour: number,
    minute: number,
    date: Date,
    busyTimes: string[]
  ): boolean => {
    const formattedDate = formatDate_M_D_YYYY(date.toISOString());
    const currentTime = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;

    const parsedBusyTimes = parseBusyTimes(busyTimes);

    return parsedBusyTimes.some((busyRange) => {
      console.log(busyRange.date);
      console.log(formattedDate);
      if (busyRange.date !== formattedDate) return false;

      const [startHour, startMinute] = busyRange.startTime
        .split(":")
        .map(Number);
      const [endHour, endMinute] = busyRange.endTime.split(":").map(Number);

      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;
      const current = hour * 60 + minute;

      return current >= start && current <= end;
    });
  };

  const parseOfficeHours = (range: string): DayTimeRange[] => {
    const [, hours, daysOnly] = range.split(" ");
    const [start, end] = hours.split("_").map((hour) => parseInt(hour));

    return daysOnly.split("_").map((day) => ({
      day: day,
      startHour: start,
      startMinute: 0,
      endHour: end,
      endMinute: 0,
    }));
  };

  const setCustomTimeRanges = (range: string) => {
    const [type] = range.split(" ");

    setTypeTimeRange(type);
    let timeRanges: DayTimeRange[] = [];

    if (type === "customPerDay") {
      timeRanges = parseCustomPerDay(range);
    } else {
      timeRanges = parseOfficeHours(range);
      const [start, end] = range.split(" ")[1].split("_").map(Number);
      setStartHour(start);
      setEndHour(end);
    }

    setTimeRanges(timeRanges); // Lưu lại timeRanges vào state
    setDaysOnly(timeRanges.map((r) => r.day).join("_"));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const getTimeRangeForSelectedDate = (
    date: Date
  ): {
    start: { hour: number; minute: number };
    end: { hour: number; minute: number };
  } | null => {
    const dayIndex = date.getDay();
    const dayMap: { [key: string]: number } = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };

    if (timeRanges.length > 0) {
      const dayName = Object.keys(dayMap).find(
        (key) => dayMap[key] === dayIndex
      );
      const timeRange = timeRanges.find(
        (range) => range.day.toLowerCase() === dayName
      );

      if (timeRange) {
        return {
          start: {
            hour: timeRange.startHour,
            minute: timeRange.startMinute,
          },
          end: {
            hour: timeRange.endHour,
            minute: timeRange.endMinute,
          },
        };
      }
      return null;
    }

    return {
      start: { hour: startHour, minute: 0 },
      end: { hour: endHour, minute: 0 },
    };
  };

  const generateHourRange = () => {
    const timeRange = getTimeRangeForSelectedDate(selectedDate);
    if (!timeRange) return [];

    const { start, end } = timeRange;

    let hourRanges;

    // Nếu start <= end, tạo range bình thường
    if (start.hour <= end.hour) {
      hourRanges = Array.from(
        { length: end.hour - start.hour + 1 },
        (_, i) => ({
          hour: start.hour + i,
          minStart: i === 0 ? start.minute : 0,
          minEnd: i === end.hour - start.hour ? end.minute : 59,
        })
      );
    } else {
      // Nếu start > end (qua nửa đêm)
      hourRanges = [
        // Từ giờ bắt đầu đến 23:59
        ...Array.from({ length: 24 - start.hour }, (_, i) => ({
          hour: start.hour + i,
          minStart: i === 0 ? start.minute : 0,
          minEnd: 59,
        })),
        // Từ 00:00 đến giờ kết thúc
        ...Array.from({ length: end.hour + 1 }, (_, i) => ({
          hour: i,
          minStart: 0,
          minEnd: i === end.hour ? end.minute : 59,
        })),
      ];
    }

    // Loại bỏ giờ 12:00 - 12:59 nếu type === 'officeHour'
    if (typeTimeRange === "officeHours") {
      hourRanges = hourRanges.filter(({ hour }) => hour !== 12);
    }

    return hourRanges;
  };

  const generateMinuteRange = (selectedHour: number | null) => {
    if (selectedHour === null) return [];

    const timeRange = getTimeRangeForSelectedDate(selectedDate);
    if (!timeRange) return [];

    const { start, end } = timeRange;

    // Nếu đang ở giờ bắt đầu
    if (selectedHour === start.hour) {
      return Array.from(
        { length: 60 - start.minute },
        (_, i) => start.minute + i
      );
    }
    // Nếu đang ở giờ kết thúc
    else if (selectedHour === end.hour) {
      return Array.from({ length: end.minute }, (_, i) => i);
    }
    // Các giờ ở giữa
    else {
      return Array.from({ length: 60 }, (_, i) => i);
    }
  };

  const formatTimeRanges = (timeRanges: DayTimeRange[]): string => {
    if (!timeRanges || timeRanges.length === 0) {
      return `từ ${startHour}:00 - ${endHour - 1}:59, ${convertDayOfWeek(
        daysOnly
      )}`;
    }

    // Nhóm các ngày theo khung giờ
    const groupedRanges: Record<string, string[]> = {};
    timeRanges.forEach(
      ({ startHour, startMinute, endHour, endMinute, day }) => {
        // Format thời gian với cả giờ và phút
        const key = `${startHour.toString().padStart(2, "0")}:${startMinute
          .toString()
          .padStart(2, "0")}-${endHour.toString().padStart(2, "0")}:${endMinute
          .toString()
          .padStart(2, "0")}`;
        if (!groupedRanges[key]) {
          groupedRanges[key] = [];
        }
        groupedRanges[key].push(day);
      }
    );

    // Tạo chuỗi mô tả
    return Object.entries(groupedRanges)
      .map(([key, days]) => {
        const [start, end] = key.split("-");
        const dayNames = days.map(convertDayOfWeek).join(", ");

        // Tính toán thời gian kết thúc hiển thị (trừ 1 phút)
        const [endHour, endMinute] = end.split(":").map(Number);
        let displayEndHour = endHour;
        let displayEndMinute = endMinute - 1;

        if (displayEndMinute < 0) {
          displayEndMinute = 59;
          displayEndHour = displayEndHour - 1;
        }

        const displayEnd = `${displayEndHour
          .toString()
          .padStart(2, "0")}:${displayEndMinute.toString().padStart(2, "0")}`;

        return `${start} - ${displayEnd} ${dayNames}`;
      })
      .join("; ");
  };

  const formatTimeRangesText = (timeRanges: DayTimeRange[]): JSX.Element => {
    // Nhóm các time range theo giờ giống nhau
    const groupedRanges = timeRanges.reduce((acc, curr) => {
      const key = `${curr.startHour}:${curr.startMinute}-${curr.endHour}:${curr.endMinute}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(curr.day);
      return acc;
    }, {} as Record<string, string[]>);

    // Convert days number to text
    const getDayText = (day: string): string => {
      const daysMap: Record<string, string> = {
        mon: "Thứ Hai",
        tue: "Thứ Ba",
        wed: "Thứ Tư",
        thu: "Thứ Năm",
        fri: "Thứ Sáu",
        sat: "Thứ Bảy",
        sun: "Chủ Nhật",
      };
      return daysMap[day] || day;
    };

    return (
      <View>
        {Object.entries(groupedRanges).map(([timeRange, days], index) => {
          const [time, endTime] = timeRange.split("-");
          const [startHour, startMinute] = time.split(":");
          const [endHour, endMinute] = endTime.split(":");

          // Format time với padding 0
          const formattedStartTime = `${startHour.padStart(
            2,
            "0"
          )}:${startMinute.padStart(2, "0")}`;
          // Trừ 1 phút từ thời gian kết thúc để hiển thị
          let displayEndHour = parseInt(endHour);
          let displayEndMinute = parseInt(endMinute) - 1;

          if (displayEndMinute < 0) {
            displayEndMinute = 59;
            displayEndHour -= 1;
          }

          const formattedEndTime = `${displayEndHour
            .toString()
            .padStart(2, "0")}:${displayEndMinute.toString().padStart(2, "0")}`;

          return (
            <View key={index} style={styles.timeRangeRow}>
              <Text style={styles.timeText}>
                {`${formattedStartTime} - ${formattedEndTime}`}
              </Text>
              <Text style={styles.daysText}>
                {days.map((day) => getDayText(day)).join(", ")}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Generate hour and minute arrays
  const hours = generateHourRange();
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const validateTimeInput = async () => {
    if (selectedHour === null || selectedMinute === null) {
      setTimeInputError("Vui lòng chọn đầy đủ giờ và phút");
      return false;
    }

    const timeRange = getTimeRangeForSelectedDate(selectedDate);
    if (!timeRange) {
      setTimeInputError("Ngày này không có khung giờ hợp lệ");
      return false;
    }

    // Chuyển đổi thời gian sang phút để so sánh dễ dàng hơn
    const selectedTimeInMinutes = selectedHour * 60 + selectedMinute;
    const startTimeInMinutes =
      timeRange.start.hour * 60 + timeRange.start.minute;
    const endTimeInMinutes = timeRange.end.hour * 60 + timeRange.end.minute;

    if (
      selectedTimeInMinutes < startTimeInMinutes ||
      selectedTimeInMinutes >= endTimeInMinutes
    ) {
      setTimeInputError(
        `Giờ phải từ ${timeRange.start.hour
          .toString()
          .padStart(2, "0")}:${timeRange.start.minute
          .toString()
          .padStart(2, "0")} đến ${(timeRange.end.hour - 1)
          .toString()
          .padStart(2, "0")}:${timeRange.end.minute
          .toString()
          .padStart(2, "0")}`
      );
      return false;
    }

    // Kiểm tra busy time...
    setTimeInputError("");
    return true;
  };

  // Add time slot
  const addTimeSlot = () => {
    if (!validateTimeInput()) return;

    if (selectedTimeSlots.length >= 1) {
      setTimeInputError("Bạn chỉ được chọn tối đa 1 khung thời gian");
      return;
    }

    // Format time with leading zeros
    const formattedHour = selectedHour!.toString().padStart(2, "0");
    const formattedMinute = selectedMinute!.toString().padStart(2, "0");
    const timeStr = `${formattedHour}:${formattedMinute}:00`;

    // Construct date time string
    const dateStr = selectedDate.toISOString().split("T")[0];
    const dateTimeStr = `${dateStr} ${timeStr}`;

    const newSlot: TimeSlot = {
      id: Math.random().toString(),
      dateTime: dateTimeStr,
      displayText: `${formattedHour}:${formattedMinute} ${formatDate_DD_MM_YYYY(
        selectedDate.toISOString()
      )}`,
    };

    setSelectedTimeSlots((prev) => [...prev, newSlot]);

    console.log("Selected time slots:", newSlot);

    // Reset selections
    setSelectedHour(null);
    setSelectedMinute(null);
  };

  // Remove time slot
  const removeTimeSlot = (slotId: string) => {
    setSelectedTimeSlots((prev) => prev.filter((slot) => slot.id !== slotId));
  };

  const fetchUserItems = async () => {
    setLoadingUserItems(true);
    try {
      const response = await axiosInstance.get(
        `/items/user/${userData.userId}?status=Approved&pageIndex=1&sizeIndex=100`
      );
      if (response.data.isSuccess) {
        setUserItems(response.data.data.data);
      } else {
        setUserItems([]);
      }
    } catch (error) {
      console.error("Error fetching user items:", error);
      setUserItems([]);
    } finally {
      setLoadingUserItems(false);
    }
  };

  const fetchBusyTime = async () => {
    setLoadingUserItems(true);
    try {
      const busyTimeResponse = await axiosInstance.get(
        `${API_GET_BUSY_TIME}?itemId=${itemId}`
      );
      if (busyTimeResponse.data.isSuccess) {
        setBusyTime(busyTimeResponse.data.data[0].busyTimes);
      }
    } catch (error) {
      console.error("Error fetching busy time:", error);
    } finally {
      setLoadingUserItems(false);
    }
  };

  const handleRequest = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        "Yêu cầu đăng nhập",
        "Vui lòng đăng nhập để sử dụng tính năng này",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đăng nhập",
            onPress: () => {
              try {
                navigation.navigate("LoginScreen", undefined);
              } catch (error) {
                console.error("Navigation error:", error);
                Alert.alert("Lỗi", "Không thể chuyển đến trang đăng nhập");
              }
            },
          },
        ]
      );
      return;
    }

    if (!product) {
      console.error("Product not found");
      return;
    }

    setShowRequestDialog(true);
    await fetchUserItems();
  };

  function formatTimeRange(dateTimeString: string): string {
    // Parse chuỗi ngày giờ
    const dateTime = new Date(dateTimeString);

    // Lấy thời gian ban đầu
    const initialHours = dateTime.getHours();
    const initialMinutes = dateTime.getMinutes();

    // Tạo thời gian mới bằng cách trừ 15 phút
    const startTime = new Date(dateTime);
    startTime.setMinutes(initialMinutes - 15);

    // Tạo thời gian mới bằng cách cộng 45 phút
    const endTime = new Date(dateTime);
    endTime.setMinutes(initialMinutes + 45);

    // Định dạng giờ phút
    const formatTime = (time: Date) =>
      `${time.getHours().toString().padStart(2, "0")}:${time
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

    // Định dạng ngày tháng năm
    const formattedDate = `${dateTime.getDate().toString().padStart(2, "0")}/${(
      dateTime.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${dateTime.getFullYear()}`;

    // Kết hợp thành chuỗi hoàn chỉnh
    return `Từ ${formatTime(startTime)} đến ${formatTime(
      endTime
    )} ngày ${formattedDate}`;
  }

  const handleConfirmRequest = async () => {
    try {
      setShowRequestDialog(false);

      const requestImages = moreImages.length > 0 ? moreImages : null;

      const data = {
        itemId: product?.id,
        message: requestMessage,
        appointmentDate: selectedTimeSlots.map((slot) => slot.dateTime),
        requesterItemId: selectedUserItem?.id || null,
        requestImages: requestImages,
      };

      const timeRange = formatTimeRange(selectedTimeSlots[0].dateTime);

      const response = await axiosInstance.post(`${API_CREATE_REQUEST}`, data);

      if (response.data.isSuccess) {
        // Reset form
        setSelectedTimeSlots([]);
        setRequestMessage("");
        setAlertData({
          title: "Thành công",
          message: `Yêu cầu đã được tạo thành công.`,
          submessage: `Bạn nên tới lúc ${timeRange} để trao đổi sản phẩm.`,
        });
        setShowAlertDialog(true);
      }
    } catch (error) {
      setAlertData({
        title: "Thất bại",
        message:
          error instanceof Error ? error.message : "Bạn không thể tạo yêu cầu",
        submessage: null,
      });
      setShowAlertDialog(true);
    }
  };

  const handleWannaRequest = () => {
    setIsTrue(false);
    setWannaRequest(true);
  };

  const handleWannaExchange = () => {
    setIsTrue(true);
    setWannaRequest(false);
  };

  const handleCancelRequest = () => {
    setShowRequestDialog(false);
    setRequestMessage("");
    setSelectedUserItem(null);
    setWannaRequest(false);
  };

  // Render modal for hour or minute selection
  const renderHourPickerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showHourModal}
      onRequestClose={() => setShowHourModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Chọn giờ</Text>
          <ScrollView>
            {generateHourRange().map(({ hour, minStart, minEnd }) => (
              <TouchableOpacity
                key={hour}
                style={[
                  styles.pickerItem,
                  selectedHour === hour && styles.selectedPickerItem,
                ]}
                onPress={() => {
                  setSelectedHour(hour);
                  setSelectedMinute(null); // Reset phút khi chọn giờ mới
                  setShowHourModal(false);
                  setShowMinuteModal(true);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    selectedHour === hour && styles.selectedPickerItemText,
                  ]}
                >
                  {`${hour.toString().padStart(2, "0")}:${minStart
                    .toString()
                    .padStart(2, "0")} - ${hour
                    .toString()
                    .padStart(2, "0")}:${minEnd.toString().padStart(2, "0")}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderMinutePickerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showMinuteModal}
      onRequestClose={() => setShowMinuteModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Chọn phút</Text>
          <ScrollView>
            {generateMinuteRange(selectedHour).map((minute) => (
              <TouchableOpacity
                key={minute}
                style={[
                  styles.pickerItem,
                  selectedMinute === minute && styles.selectedPickerItem,
                ]}
                onPress={() => {
                  setSelectedMinute(minute);
                  setShowMinuteModal(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    selectedMinute === minute && styles.selectedPickerItemText,
                  ]}
                >
                  {minute.toString().padStart(2, "0")}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderUserItems = () => {
    if (loadingUserItems) {
      return (
        <Text style={styles.loadingText}>Đang tải danh sách sản phẩm...</Text>
      );
    }

    if (!userItems || userItems.length === 0) {
      return (
        <Text style={styles.noItemsText}>
          Bạn chưa có sản phẩm nào để trao đổi
        </Text>
      );
    }

    const handleItemPress = (item: any) => {
      setSelectedUserItem((prevItem) =>
        prevItem?.id === item.id ? null : item
      );
    };

    return (
      <ScrollView horizontal style={styles.userItemsScroll}>
        {userItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.userItemCard,
              selectedUserItem?.id === item.id && styles.selectedUserItemCard,
            ]}
            onPress={() => handleItemPress(item)}
          >
            <Image
              source={{ uri: item.images[0] }}
              style={styles.userItemImage}
            />
            <Text style={styles.userItemName} numberOfLines={1}>
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  if (error) {
    return (
      <View
        style={[
          styles.container,
          { padding: 16, alignItems: "center", justifyContent: "center" },
        ]}
      >
        <Icon name="error-outline" size={48} color="#e53e3e" />
        <Text style={[styles.errorText, { marginTop: 16 }]}>{error}</Text>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: Colors.orange500, marginTop: 24 },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { padding: 16 }]}>
        <View
          style={[styles.loadingPlaceholder, { height: 300, marginBottom: 16 }]}
        />
        <View
          style={[
            styles.loadingPlaceholder,
            { height: 24, width: "60%", marginBottom: 12 },
          ]}
        />
        <View
          style={[
            styles.loadingPlaceholder,
            { height: 16, width: "40%", marginBottom: 24 },
          ]}
        />
        <View
          style={[styles.loadingPlaceholder, { height: 100, marginBottom: 16 }]}
        />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ImageCarousel images={product.images} />
      {/* <View style={styles.imageContainer}>
        <Image source={{ uri: product.images[0] }} style={styles.image} />
      </View> */}

      <View style={styles.infoContainer}>
        <Text style={styles.title}>{product.name}</Text>

        <View style={styles.badgeContainer}>
          <View style={[styles.badge, { backgroundColor: Colors.orange500 }]}>
            <Text style={styles.badgeText}>
              {`${product.category.parentName}, `} {product.category.name}
            </Text>
          </View>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: "#fff",
                borderColor: Colors.orange500,
                borderWidth: 1,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: Colors.orange500 }]}>
              {product.condition === "Used" ? "Đã sử dụng" : "Mới"}
            </Text>
          </View>
          {(() => {
            switch (product.status) {
              case "Approved":
                return (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: Colors.lightGreen },
                    ]}
                  >
                    {product.owner_id === userData.userId ? (
                      <Text style={styles.badgeText}>Đã duyệt</Text>
                    ) : (
                      <Text style={styles.badgeText}>Còn hàng</Text>
                    )}
                  </View>
                );
              case "Pending":
                return (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: Colors.orange500 },
                    ]}
                  >
                    <Text style={styles.badgeText}>Chờ phê duyệt</Text>
                  </View>
                );
              case "Rejected":
                return (
                  <View
                    style={[styles.badge, { backgroundColor: Colors.lightRed }]}
                  >
                    <Text style={styles.badgeText}>Bị từ chối</Text>
                  </View>
                );
              case "Out_of_date":
                return (
                  <View
                    style={[styles.badge, { backgroundColor: Colors.gray500 }]}
                  >
                    <Text style={styles.badgeText}>Hết hạn</Text>
                  </View>
                );
              case "In_Transaction":
                return (
                  <View
                    style={[styles.badge, { backgroundColor: Colors.blue500 }]}
                  >
                    <Text style={styles.badgeText}>Đang trao đổi</Text>
                  </View>
                );
              case "Exchanged":
                return (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: Colors.purple500 },
                    ]}
                  >
                    <Text style={styles.badgeText}>Đã trao đổi</Text>
                  </View>
                );
              default:
                return null;
            }
          })()}
        </View>

        <Text style={styles.description}>{product.description}</Text>

        {product.status === "Rejected" && (
          <Text style={styles.rejectMessage}>
            Lý do bị từ chối: {product.rejectMessage}
          </Text>
        )}

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Icon name="calendar-month" size={16} />
            <Text style={styles.detailText}>
              Ngày đăng: {formatDate(product.createdAt)}
            </Text>
          </View>
          {/* <View style={styles.detailItem}>
            <Icon name="now-widgets" size={16} />
            <Text style={styles.detailText}>Số lượng: {product.quantity}</Text>
          </View> */}
          <View style={styles.detailItem}>
            <Icon name="loop" size={16} />
            <Text style={styles.detailText}>
              Tình trạng: {product.condition === "Used" ? "Đã sử dụng" : "Mới"}
            </Text>
          </View>
          {/* Hiển thị khung giờ */}
          <View style={styles.timeRangeContainer}>
            <View style={styles.detailItemSub}>
              <Icon name="access-time" size={14} />
              <Text style={styles.detailText}>Khung giờ:</Text>
            </View>
            {timeRanges.length > 0 ? (
              formatTimeRangesText(timeRanges)
            ) : (
              <Text style={styles.noTimeRangeText}>Không có khung giờ</Text>
            )}
          </View>
          {product.isGift === false && product.desiredCategory !== null && (
            <View style={styles.detailItem}>
              <Icon name="compare-arrows" size={16} />
              <Text style={styles.detailText}>
                Mong muốn trao đổi với:{" "}
                {product.desiredCategory?.parentName !== null
                  ? `${product.desiredCategory?.parentName}, `
                  : ""}{" "}
                {product.desiredCategory?.name}
              </Text>
            </View>
          )}
          {userData.userId === product.owner_id && product.isJoinedCampaign && (
            <View style={styles.detailItem}>
              <Icon name="campaign" size={16} />
              <Text style={styles.detailText}>
                Đã được duyệt cho chiến dịch !!!
              </Text>
            </View>
          )}
          {product.isGift && (
            <View style={styles.detailItem}>
              <Icon name="card-giftcard" size={16} color={Colors.orange500} />
              <Text style={[styles.detailText, styles.giftText]}>
                Sản phẩm này là quà tặng
              </Text>
            </View>
          )}
        </View>

        {userData.userId === product.owner_id && (
          <>
            {product.itemCampaign && product.itemCampaign.length > 0 && (
              <View style={styles.cardFooter}>
                <View style={styles.footer}>
                  <Text style={styles.titleFooter}>
                    Đã gửi yêu cầu tới cho:
                  </Text>
                  <Text style={styles.statusFooter}>Trạng thái</Text>
                </View>
                {product.itemCampaign?.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.campaignId} - ${index}`}
                    style={styles.campaignCard}
                    onPress={() => {
                      navigation.navigate("CampaignDetail", {
                        campaignId: item.campaignId,
                      });
                    }}
                  >
                    <View style={styles.campaignInfo}>
                      <Image
                        source={{ uri: item.bannerPicture }}
                        style={styles.bannerImage}
                        resizeMode="cover"
                      />
                      <Text style={styles.campaignName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <View style={styles.campaignFooter}>
                        <Text style={styles.campaignDates}>
                          {formatDate_DD_MM_YYYY(item.startDate)} -{" "}
                          {formatDate_DD_MM_YYYY(item.endDate)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.campaignStatus}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: `${
                              STATUS_CAMPAIGN_COLORS[item?.status]
                            }15`,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                STATUS_CAMPAIGN_COLORS[item?.status],
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: STATUS_CAMPAIGN_COLORS[item?.status] },
                          ]}
                        >
                          {
                            STATUS_CAMPAIGN_LABELS[
                              item?.status as keyof typeof STATUS_CAMPAIGN_LABELS
                            ]
                          }
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={styles.isOwner}>Bạn là chủ sở hữu của món đồ này</Text>
          </>
        )}

        {userData.userId !== product.owner_id && (
          <>
            {product.status === "Approved" && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.requestButton]}
                  onPress={handleRequest}
                >
                  {product.isGift ? (
                    <Text style={styles.buttonText}>Đăng ký nhận</Text>
                  ) : (
                    <Text style={styles.buttonText}>Yêu cầu trao đổi</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      <Modal
        visible={showRequestDialog}
        // animationType="slide"
        transparent={true}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {product.isGift ? (
                <>
                  <Text style={styles.modalTitle}>Tạo yêu cầu nhận hàng</Text>
                  {/* Current Product Section */}
                  <View style={styles.currentProductSection}>
                    <Image
                      source={{ uri: product?.images[0] }}
                      style={styles.currentProductImage}
                    />
                    <View style={styles.currentProductInfo}>
                      <Text style={styles.currentProductName}>
                        {product?.name}
                      </Text>
                    </View>
                  </View>
                  {product.desiredCategory !== null && (
                    <Text style={styles.detailText}>
                      Mong muốn trao đổi với: {product.desiredCategory?.name}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.modalTitle}>Tạo yêu cầu trao đổi</Text>
                  {/* Current Product Section */}
                  <View style={styles.currentProductSection}>
                    <Image
                      source={{ uri: product?.images[0] }}
                      style={styles.currentProductImage}
                    />
                    <View style={styles.currentProductInfo}>
                      <Text style={styles.currentProductName}>
                        {product?.name}
                      </Text>
                    </View>
                  </View>
                  {product.desiredCategory !== null && (
                    <Text style={styles.detailText}>
                      Mong muốn trao đổi với: {product.desiredCategory?.name}
                    </Text>
                  )}
                </>
              )}

              {!product.isGift && !wannaRequest && (
                <>
                  <View style={styles.exchangeArrowContainer}>
                    <Icon name="swap-vert" size={24} color={Colors.orange500} />
                    {(!moreImages || moreImages.length === 0) && (
                      <Text style={styles.exchangeText}>
                        Chọn sản phẩm để trao đổi
                      </Text>
                    )}
                  </View>
                  {(!moreImages || moreImages.length === 0) && (
                    <View style={styles.userItemsSection}>
                      {userItems.length > 0 ? (
                        renderUserItems()
                      ) : (
                        <Text style={styles.noItemsText}>
                          Bạn chưa có sản phẩm nào để trao đổi
                        </Text>
                      )}
                    </View>
                  )}

                  {/* <Text style={styles.moreItemText}>
                    Sản phẩm khác, vui lòng chụp lại sản phẩm và ghi rõ thông
                    tin sản phẩm
                  </Text>
                  {selectedUserItem && (
                    <View style={styles.selectedItemInfo}>
                      <Text style={styles.selectedItemText}>
                        Sản phẩm đã chọn: {selectedUserItem.name}
                      </Text>
                    </View>
                  )}

                  <MediaUploadSection
                    images={moreImages}
                    video={""}
                    selectedImage={selectedImage}
                    isLoading={isUploadingImage}
                    onPickImage={handleImageUpload}
                    onPickVideo={() => {}}
                    onRemoveImage={removeImage}
                    onRemoveVideo={() => {}}
                    canUploadVideo={false}
                  /> 
                  <TouchableOpacity onPress={() => handleWannaRequest()}>
                    <Text style={styles.requestText}>
                      Tôi muốn xin món đồ này.
                    </Text>
                  </TouchableOpacity> */}
                </>
              )}

              {/* {!isTrue ? (
                <TouchableOpacity onPress={() => handleWannaExchange()}>
                  <Text
                    style={[styles.requestText, styles.marginTop_16_Botttom_12]}
                  >
                    Tôi muốn trao đổi với đồ của tôi.
                  </Text>
                </TouchableOpacity>
              ) : (
                <></>
              )} */}
              {(product.isGift || userItems.length > 0) && (
                <>
                  <Text style={styles.modalDescription}>
                    Nhập lời nhắn của bạn:
                  </Text>
                  <TextInput
                    style={styles.requestInput}
                    placeholderTextColor="#c4c4c4"
                    placeholder="Nhập tin nhắn..."
                    value={requestMessage}
                    onChangeText={setRequestMessage}
                    multiline
                  />
                  {requestMessage.length > 99 && !wannaRequest && (
                    <Text style={styles.textErrorMessage}>
                      Lời nhắn của bạn không được vượt quá 100 ký tự.
                    </Text>
                  )}

                  {requestMessage.length < 300 && wannaRequest && (
                    <Text style={styles.textErrorMessage}>
                      Để yêu cầu xin sản phẩm, bạn phải tạo lời nhắn hơn 300 ký
                      tự.
                    </Text>
                  )}
                  <Text style={styles.modalDescription}>
                    Vui lòng chọn thời gian bạn sẽ tời nhận sản phẩm:
                  </Text>
                  <View style={styles.timeRangeContainer}>
                    <View style={styles.detailItemSub}>
                      <Icon name="access-time" size={20} />
                      <Text style={styles.detailText}>Khung giờ:</Text>
                    </View>
                    {timeRanges.length > 0 ? (
                      formatTimeRangesText(timeRanges)
                    ) : (
                      <Text style={styles.noTimeRangeText}>
                        Không có khung giờ
                      </Text>
                    )}
                  </View>
                  {/* Selected Time Slots */}
                  <View style={styles.selectedSlotsContainer}>
                    {selectedTimeSlots.map((slot) => (
                      <View key={slot.id} style={styles.timeSlotBadge}>
                        <Text style={styles.timeSlotText}>
                          {slot.displayText}
                        </Text>
                        <TouchableOpacity
                          onPress={() => removeTimeSlot(slot.id)}
                        >
                          <Icon name="close" size={20} color="#FF5722" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                  {selectedTimeSlots.length === 0 && (
                    <View style={styles.container}>
                      {/* Date Picker */}
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => {
                          setShowDatePicker(true);
                        }}
                      >
                        <Text style={styles.datePickerButtonText}>
                          Chọn ngày:{" "}
                          {formatDate_DD_MM_YYYY(selectedDate.toISOString())}
                        </Text>
                      </TouchableOpacity>

                      {/* Hiển thị khung giờ cho ngày đã chọn */}
                      {selectedDate && (
                        <View style={styles.timeRangeContainer}>
                          <Text style={styles.timeRangeLabel}>
                            Khung giờ có sẵn:
                          </Text>
                          {(() => {
                            const timeRange =
                              getTimeRangeForSelectedDate(selectedDate);
                            if (!timeRange) {
                              return (
                                <Text style={styles.noTimeRangeText}>
                                  Không có khung giờ cho ngày này
                                </Text>
                              );
                            }

                            const { start, end } = timeRange;
                            const startTime = `${start.hour
                              .toString()
                              .padStart(2, "0")}:${start.minute
                              .toString()
                              .padStart(2, "0")}`;
                            // Trừ 1 phút từ thời gian kết thúc để hiển thị
                            let displayEndHour = end.hour;
                            let displayEndMinute = end.minute - 1;

                            if (displayEndMinute < 0) {
                              displayEndMinute = 59;
                              displayEndHour = displayEndHour - 1;
                            }

                            const endTime = `${displayEndHour
                              .toString()
                              .padStart(2, "0")}:${displayEndMinute
                              .toString()
                              .padStart(2, "0")}`;

                            return (
                              <View style={styles.timeRangeInfo}>
                                <Text style={styles.timeRangeText}>
                                  {`${startTime} - ${endTime}`}
                                </Text>
                                <Text style={styles.selectedDateText}>
                                  {`Ngày ${formatDate_DD_MM_YYYY(
                                    selectedDate.toISOString()
                                  )}`}
                                </Text>
                              </View>
                            );
                          })()}

                          {/* Hiển thị busy time cho ngày đã chọn */}
                          {/* {busyTime && busyTime
      .filter(time => time.includes(formatDate_DD_MM_YYYY(selectedDate.toISOString())))
      .map((time, index) => {
        const [timeRange] = time.split(" | ");
        const [start, end] = timeRange.split("_");
        return (
          <Text key={index} style={styles.busyTimeText}>
            Đã có người đặt: {start} - {end}
          </Text>
        );
      })} */}
                        </View>
                      )}

                      <CalendarPickerCustom
                        visible={showDatePicker}
                        date={selectedDate}
                        setDate={setSelectedDate}
                        allowedDays={daysOnly}
                        timeRanges={timeRanges}
                        onClose={() => {
                          setShowDatePicker(false);
                        }}
                        onConfirm={() => {
                          setShowDatePicker(false);
                          setShowHourModal(true);
                        }}
                      />
                      {/* {showDatePicker && (
                        <DateTimePickerCustom
                          date={selectedDate}
                          setDate={setSelectedDate}
                          allowedDays={daysOnly}
                          timeRanges={timeRanges}
                          onClose={() => setShowDatePicker(false)}
                        />
                      )} */}

                      {/* Time Input */}
                      <View style={styles.inputContainer}>
                        <View style={styles.timeInputWrapper}>
                          <TouchableOpacity
                            style={styles.timeInput}
                            onPress={() => setShowHourModal(true)}
                          >
                            <Text
                              style={[
                                styles.timeInputText,
                                {
                                  color:
                                    selectedHour === null ? "#c4c4c4" : "#000",
                                },
                              ]}
                            >
                              {selectedHour !== null
                                ? selectedHour.toString().padStart(2, "0")
                                : "Giờ"}
                            </Text>
                          </TouchableOpacity>

                          <Text style={styles.colonText}>:</Text>

                          <TouchableOpacity
                            style={styles.timeInput}
                            onPress={() => {
                              if (selectedHour === null) {
                                setTimeInputError("Vui lòng chọn giờ trước");
                                return;
                              }
                              setShowMinuteModal(true);
                            }}
                          >
                            <Text
                              style={[
                                styles.timeInputText,
                                {
                                  color:
                                    selectedHour === null ? "#c4c4c4" : "#000",
                                },
                              ]}
                            >
                              {selectedMinute !== null
                                ? selectedMinute.toString().padStart(2, "0")
                                : "Phút"}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.addButton,
                              (!selectedHour ||
                                (selectedMinute === 0
                                  ? false
                                  : !selectedMinute)) &&
                                styles.disabledButton,
                            ]}
                            onPress={addTimeSlot}
                            disabled={
                              !selectedHour ||
                              (selectedMinute === 0 ? false : !selectedMinute)
                            }
                          >
                            <Text style={styles.addButtonText}>Chọn</Text>
                          </TouchableOpacity>
                        </View>

                        {/* Render the modals */}
                        {renderHourPickerModal()}
                        {renderMinutePickerModal()}

                        {/* Error Message */}
                        {timeInputError ? (
                          <View style={styles.timeInputWrapper}>
                            <Text style={styles.errorTimeText}>
                              {timeInputError}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  )}

                  <Text style={styles.modalDescriptionSub}>
                    Thời gian này sẽ được gửi chủ sở hữu, nếu phù hợp sẽ tiến
                    hành trao đổi.
                  </Text>
                </>
              )}
            </ScrollView>

            {/* Fixed Button Container */}
            <View style={styles.fixedButtonContainer}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelRequest}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.button,
                  styles.confirmButton,
                  (product.isGift
                    ? selectedTimeSlots.length === 0
                    : (!selectedUserItem && moreImages.length === 0) ||
                      selectedTimeSlots.length === 0) && styles.disabledButton,
                ]}
                onPress={handleConfirmRequest}
                disabled={
                  product.isGift
                    ? selectedTimeSlots.length === 0
                    : (!selectedUserItem && moreImages.length === 0) ||
                      selectedTimeSlots.length === 0
                }
              >
                <Text style={styles.buttonText}>Xác nhận</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={showAlertDialog}
        title={alertData.title}
        message={alertData.message}
        submessage={alertData.submessage}
        onConfirm={() => setShowAlertDialog(false)}
        onCancel={() => setShowAlertDialog(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  imageContainer: {
    height: 400,
    borderRadius: 16,
    overflow: "hidden",
    margin: 16,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  pointText: {
    fontSize: 32,
    color: Colors.orange500,
    fontWeight: "bold",
    marginBottom: 8,
  },
  isOwner: {
    fontSize: 16,
    color: Colors.orange500,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  rejectMessage: {
    fontSize: 16,
    color: Colors.orange700,
    marginBottom: 16,
  },
  detailsContainer: {
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  detailItemSub: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 4,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
  },
  giftText: {
    color: Colors.orange500,
    fontWeight: "bold",
  },
  attributesContainer: {
    marginBottom: 16,
  },
  attributesTitle: {
    fontSize: 18,
    fontWeight: "medium",
    color: "#333",
    marginBottom: 8,
  },
  attributeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  attributeText: {
    fontSize: 16,
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestButton: {
    backgroundColor: Colors.orange500,
    color: "white",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  outOfStockButton: {
    backgroundColor: Colors.orange500,
    opacity: 0.3,
  },
  outOfStockText: {
    color: Colors.orange700,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  loadingPlaceholder: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    height: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#e53e3e",
    marginTop: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: Colors.orange600,
  },
  modalDescription: {
    fontSize: 14,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "bold",
    textAlign: "left",
  },
  modalDescriptionSub: {
    fontSize: 14,
    marginBottom: 32,
    color: "#7B7B7B",
  },
  requestInput: {
    borderColor: "#c4c4c4",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    width: "100%",
    // marginBottom: 16,
  },
  textErrorMessage: {
    color: "#e53e3e",
    marginBottom: 16,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    width: "48%",
    backgroundColor: Colors.lightRed,
  },
  confirmButton: {
    width: "48%",
    backgroundColor: Colors.orange600,
  },
  selectedSlotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  timeSlotBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: Colors.orange500,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginTop: 16,
    marginBottom: 8,
  },
  timeSlotText: {
    color: Colors.orange500,
    fontSize: 14,
    fontWeight: "bold",
  },
  datePickerButton: {
    backgroundColor: Colors.orange500,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  datePickerButtonText: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
    marginBottom: 20,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    padding: 8,
    backgroundColor: "#fff",
    shadowRadius: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  currentProductSection: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  currentProductImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  currentProductInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  currentProductName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  currentProductPrice: {
    fontSize: 16,
    color: Colors.orange500,
    fontWeight: "bold",
  },
  exchangeArrowContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  exchangeText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  moreItemText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingVertical: 16,
  },
  userItemsSection: {
    marginBottom: 16,
  },
  userItemsScroll: {
    paddingBottom: 16,
    flexGrow: 0,
  },
  userItemCard: {
    width: 130,
    marginRight: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#ddd",
    padding: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedUserItemCard: {
    borderColor: Colors.orange500,
    backgroundColor: "#fff5e6",
  },
  userItemImage: {
    width: "100%",
    height: 100,
    borderRadius: 4,
    marginBottom: 8,
  },
  userItemName: {
    fontSize: 14,
    textAlign: "center",
  },
  selectedItemInfo: {
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  selectedItemText: {
    fontSize: 14,
    color: "#333",
  },
  requestText: {
    color: Colors.orange500,
    fontSize: 14,
    marginBottom: 12,
    textDecorationLine: "underline",
  },
  marginTop_16_Botttom_12: {
    marginTop: 16,
    marginBottom: 12,
  },
  loadingText: {
    textAlign: "center",
    color: "#666",
    padding: 16,
  },
  noItemsText: {
    textAlign: "center",
    color: Colors.orange500,
    padding: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.5,
  },
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    height: "90%",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalScrollView: {
    flex: 1,
    padding: 24,
  },
  timeSlot: {
    width: "31%",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    marginBottom: 8,
  },
  selectedTimeSlot: {
    backgroundColor: Colors.orange500,
  },
  timeSlotLabel: {
    fontSize: 12,
    textAlign: "center",
    color: "#333",
  },
  selectedTimeSlotLabel: {
    color: "white",
  },
  fixedButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16, // Account for iPhone notch
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "white",
  },
  inputContainer: {
    flexDirection: "column",
    // alignItems: "center",
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: "#FF5722",
    padding: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "white",
    textAlign: "center",
  },
  timeInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 14,
    marginRight: 12,
    textAlign: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  colonText: {
    fontSize: 20,
    marginRight: 8,
  },
  errorTimeText: {
    fontSize: 14,
    color: "#e53e3e",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    maxHeight: "70%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedPickerItem: {
    backgroundColor: "#FF5722",
  },
  pickerItemText: {
    textAlign: "center",
    fontSize: 16,
  },
  selectedPickerItemText: {
    color: "white",
    fontWeight: "bold",
  },
  timeInputText: {
    color: "#000",
    textAlign: "center",
  },
  timeRangeText: {
    // marginTop: 8,
    // marginBottom: 8,
    color: Colors.orange500,
    fontSize: 14,
    fontWeight: "bold",
  },
  busyTimeText: {
    color: "#e53e3e",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  timeRangeContainer: {
    marginBottom: 16,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    paddingVertical: 8,
  },
  timeRangeLabel: {
    fontSize: 14,
    color: "#666",
    paddingLeft: 12,
    marginBottom: 4,
  },
  timeRangeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  selectedDateText: {
    fontSize: 14,
    color: "#666",
  },
  noTimeRangeText: {
    fontSize: 14,
    color: "#e53e3e",
    fontStyle: "italic",
    padding: 12,
    paddingTop: 4,
  },
  timeRangeRow: {
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: "#f8f8f8",
    borderRadius: 6,
  },
  timeText: {
    fontSize: 15,
    fontWeight: "bold",
    color: Colors.orange500,
    marginBottom: 4,
  },
  daysText: {
    fontSize: 14,
    color: "#666",
  },
  cardFooter: {
    // flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  footer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleFooter: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  statusFooter: {
    fontSize: 14,
    color: "#666666",
  },
  campaignCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginBottom: 16,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
    padding: 10,
    gap: 10,
  },
  bannerImage: {
    width: 50,
    height: 50,
    objectFit: "cover",
    borderRadius: 8,
  },
  campaignStatus: {
    flexShrink: 1,
  },
  campaignInfo: {
    flex: 6,
  },
  campaignName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  campaignDescription: {
    fontSize: 8,
    color: "#666",
    marginVertical: 5,
  },
  campaignDetail: {
    fontSize: 12,
    color: "#666",
    marginVertical: 5,
  },
  campaignFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  campaignDates: {
    fontSize: 8,
    color: "#888",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
