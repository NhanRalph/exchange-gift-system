import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import axiosInstance from "@/src/api/axiosInstance";
import Colors from "@/src/constants/Colors";
import Icon from "react-native-vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  DateItem,
  LocationMap,
  Transaction,
  TransactionRatingType,
  TransactionReportType,
} from "@/src/shared/type";
import UserRatingModal from "@/src/components/modal/RatingUserTransactionModal";
import { Buffer } from "buffer";
import { useAuthCheck } from "@/src/hooks/useAuth";
import {
  formatDate,
  formatDate_DD_MM_YYYY,
  formatDate_YYYY_MM_DD,
} from "@/src/shared/formatDate";
import ReportModal from "@/src/components/ReportModal";
import { useNavigation } from "@/src/hooks/useNavigation";
import { TextInput } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "@/src/layouts/types/navigationTypes";
import {
  NotificationData,
  useNotificationStore,
} from "@/src/stores/notificationStore";
import MapModal from "@/src/components/Map/MapModal";
import MediaUploadSection from "@/src/components/MediaUploadSection";
import { postService } from "@/src/services/postService";
import Constants from "expo-constants";
const API_APPROVE_TRANSACTION = (Constants.expoConfig as any).extra.API_APPROVE_TRANSACTION;
const API_CANCEL_TRANSACTION = (Constants.expoConfig as any).extra.API_CANCEL_TRANSACTION;
const API_CREATE_POINT_TRANSACTION = (Constants.expoConfig as any).extra.API_CREATE_POINT_TRANSACTION;
const API_CREATE_RATING_TRANSACTION = (Constants.expoConfig as any).extra.API_CREATE_RATING_TRANSACTION;
const API_CREATE_REPORT = (Constants.expoConfig as any).extra.API_CREATE_REPORT;
const API_GET_OWN_TRANSACTIONS = (Constants.expoConfig as any).extra.API_GET_OWN_TRANSACTIONS;
const API_GET_QR_CODE = (Constants.expoConfig as any).extra.API_GET_QR_CODE;
const API_GET_TRANSACTION_BY_ID = (Constants.expoConfig as any).extra.API_GET_TRANSACTION_BY_ID;
const API_GET_VALIDATE_TIME_TRANSACTION = (Constants.expoConfig as any).extra.API_GET_VALIDATE_TIME_TRANSACTION;
const API_RATING_TRANSACTION = (Constants.expoConfig as any).extra.API_RATING_TRANSACTION;
const API_REJECT_TRANSACTION = (Constants.expoConfig as any).extra.API_REJECT_TRANSACTION;

type MyTransactionsScreenRouteProp = RouteProp<
  RootStackParamList,
  "MyTransactions"
>;

const MyTransactions = () => {
  const route = useRoute<MyTransactionsScreenRouteProp>();
  const requestId = route.params.requestId;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { sendNotification } = useNotificationStore();
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [verificationInput, setVerificationInput] = useState("");
  const [showMapModal, setShowMapModal] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [moreImages, setMoreImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [dateList, setDateList] = useState<DateItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationMap>({
    latitude: 0,
    longitude: 0,
  });
  const [destinationLocation, setDestinationLocation] = useState<LocationMap>({
    latitude: 0,
    longitude: 0,
  });
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const userId = useAuthCheck().userData.userId;

  const [showInputRejectMessage, setShowInputRejectMessage] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelTransactionModal, setShowCancelTransactionModal] =
    useState(false);
  const [rejectMessage, setRejectMessage] = useState<string>("");

  const navigation = useNavigation();

  const [isConfirm, setIsConfirm] = useState(false);

  const [searchQuery, setSearchQuery] = useState<string>("");

  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    submessage: string | null;
  }>({
    title: "",
    message: "",
    submessage: null,
  });
  const [showAlertDialog, setShowAlertDialog] = useState(false);

  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchTransactions(formatDate_YYYY_MM_DD(new Date().toISOString()), 1);
  }, [isConfirm, requestId, showMapModal]);

  useEffect(() => {
    generateDateList(new Date());
    const date = formatDate_YYYY_MM_DD(new Date().toISOString());
    console.log(date);
    fetchTransactions(formatDate_YYYY_MM_DD(new Date().toISOString()), 1);
  }, []);

  useEffect(() => {
    if (selectedTransaction?.status === "In_Progress") {
      fetchQRCode(selectedTransaction.id);
    }
  }, [selectedTransaction]);

  const fetchTransactions = async (dateOnly: string, page: number) => {
    try {
      let response;
      setLoading(true);
      setTransactions([]);
      if (requestId === "") {
        console.log(
          `?dateFilter=${dateOnly}&pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
        );
        const result = await axiosInstance.get(
          `${API_GET_OWN_TRANSACTIONS}?dateFilter=${dateOnly}&pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
        );
        response = result.data.data.data;
        if (!response) {
          return;
        }
        const { totalItems } = result.data.data;
        const statusOrder = {
          In_Progress: 0,
          Completed: 1,
          Not_Completed: 2,
          Canceled: 3,
        };

        // Sort transactions by status priority
        const sortedTransactions = response.sort(
          (a: Transaction, b: Transaction) => {
            return statusOrder[a.status] - statusOrder[b.status];
          }
        );

        if (page === 1) {
          setTransactions(sortedTransactions);
        } else {
          setTransactions((prev) => [...prev, ...sortedTransactions]);
        }

        setTotalPages(Math.ceil(totalItems / PAGE_SIZE));
      } else {
        const result = await axiosInstance.get(
          `${API_GET_TRANSACTION_BY_ID}/${requestId}`
        );
        response = result.data.data;
        if (!response) {
          return;
        }
        const transactionsList = await Promise.all(
          response.map(async (transaction: Transaction) => {
            let updatedTransaction = { ...transaction };

            // initializeTransaction(updatedTransaction.requestId);

            // // Pass transactionId to MapModal
            // useProximityStore
            //   .getState()
            //   .setRequestIdInTransaction(transaction.requestId);

            // const currentHashMap = useProximityStore.getState().hashMap;
            // const currentFields = currentHashMap[transaction.requestId] || {
            //   isNearDestination: false,
            //   recipientHasArrived: false,
            //   isVerifyTransaction: false,
            // };

            // updatedTransaction = { ...updatedTransaction, ...currentFields };

            try {
              const isValidTime = await axiosInstance.get(
                `${API_GET_VALIDATE_TIME_TRANSACTION}/${transaction.id}`
              );
              updatedTransaction.isValidTime = isValidTime.data.data;
            } catch (error) {
              console.error(
                `Error validating time for transaction ${transaction.id}:`,
                error
              );
              updatedTransaction.isValidTime = false;
            }

            if (
              transaction.status === "Completed" ||
              transaction.status === "Not_Completed"
            ) {
              try {
                const rating = await axiosInstance.get<RatingResponse>(
                  `${API_RATING_TRANSACTION}/${transaction.id}`
                );
                if (rating.data.data.length === 0) {
                  updatedTransaction.rating = null;
                  updatedTransaction.ratingComment = null;
                } else {
                  updatedTransaction.rating = rating.data.data[0].rating;
                  updatedTransaction.ratingComment =
                    rating.data.data[0].comment;
                }
              } catch (error) {
                updatedTransaction.rating = null;
                updatedTransaction.ratingComment = null;
              }
            }

            return updatedTransaction;
          })
        );
        console.log(transactionsList);
        setTransactions(transactionsList);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const loadMore = () => {
    if (!isLoading && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      fetchTransactions(
        formatDate_YYYY_MM_DD(new Date().toISOString()),
        currentPage + 1
      );
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions(formatDate_YYYY_MM_DD(new Date().toISOString()), 1);
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    // Reset products and fetch first page with search query
    fetchTransactions(formatDate_YYYY_MM_DD(new Date().toISOString()), 1);
  };

  const checkRole = (transaction: Transaction) => {
    if (userId === transaction.charitarian.id) {
      return "charitarian";
    } else if (userId === transaction.requester.id) {
      return "requester";
    }
    return "";
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

  const isPastDate = (date: string) => {
    // Tạo đối tượng Date từ thông tin đã phân tách
    let inputDate = new Date(date + "Z");

    // Trừ đi 24 giờ
    inputDate.setDate(inputDate.getDate() - 1);

    // Lấy ngày hiện tại
    const now = new Date();

    console.log(now.getTime() < inputDate.getTime());

    // Kiểm tra xem now có nhỏ hơn ngày mới tính hay không
    return now < inputDate;
  };

  const handleImageUpload = async () => {
    try {
      setIsUploadingImage(true);
      const uri = await postService.pickImage();

      if (!uri) return;

      if (uri) {
        const imageUrl = await postService.uploadImageToCloudinary(uri);
        setImages((prev) => [...prev, imageUrl]);
      }
    } catch (error) {
      Alert.alert("Upload Failed", "Please try again");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCaptureImage = async () => {
    try {
      setIsUploadingImage(true);
      const uri = await postService.captureImage();

      if (uri) {
        const imageUrl = await postService.uploadImageToCloudinary(uri);
        setImages((prev) => [...prev, imageUrl]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to capture and upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = moreImages.filter((_, idx) => idx !== index);
    setImages(newImages);
  };

  const handleVerification = async (transaction: Transaction) => {
    try {
      const data = {
        transactionId: transaction.id,
        transactionImages: [],
      };
      const res = await axiosInstance.put(`${API_APPROVE_TRANSACTION}`, data);
      if (res.data.isSuccess) {
        Alert.alert("Thành công", "Đã xác nhận giao dịch", [
          {
            text: "OK",
            onPress: () => {
              setIsConfirm((prev) => !prev);
            },
            // navigation.navigate("MyTransactions", { requestId: requestId }),
          },
        ]);

        const dataSuccess: NotificationData = {
          type: "success",
          title: "Chấp nhận giao dịch",
          message: "Giao dịch của bạn đã hoàn tất.",
          entity: "Transaction",
          entityId: transaction.requestId,
        };

        sendNotification(transaction.requester.id, dataSuccess);

        sendNotification(transaction.charitarian.id, dataSuccess);
      }
      setShowConfirmModal(false);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể xác nhận giao dịch. Vui lòng thử lại sau.");
    }
  };

  const handleReject = async (transaction: Transaction) => {
    try {
      const data = {
        transactionId: transaction.id,
        message: rejectMessage,
        transactionImages: [],
      };
      const res = await axiosInstance.put(`${API_REJECT_TRANSACTION}`, data);
      if (res.data.isSuccess) {
        Alert.alert("Thành công", "Đã từ chối giao dịch", [
          {
            text: "OK",
            onPress: () => {
              setIsConfirm((prev) => !prev);
            },
          },
        ]);

        const dataErrorRequester: NotificationData = {
          type: "error",
          title: "Từ chối giao dịch",
          message: "Giao dịch của bạn đã bị từ chối.",
          entity: "Transaction",
          entityId: transaction.requestId,
        };

        sendNotification(transaction.requester.id, dataErrorRequester);

        const dataErrorCharitarian: NotificationData = {
          type: "error",
          title: "Từ chối giao dịch",
          message: "Bạn đã từ chối giao dịch.",
          entity: "Transaction",
          entityId: transaction.requestId,
        };

        sendNotification(transaction.charitarian.id, dataErrorCharitarian);
      }
      setShowInputRejectMessage(false);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể từ chối giao dịch. Vui lòng thử lại sau.");
    }
  };

  const handleCancelTransaction = async (transaction: Transaction) => {
    console.log(transaction.id);
    try {
      const data = {
        transactionId: transaction.id,
        message: "Giao dịch đã huỷ do không phù hợp nữa.",
      };
      const response = await axiosInstance.put(
        `${API_CANCEL_TRANSACTION}`,
        data
      );

      if (response.data.isSuccess === true) {
        fetchTransactions(formatDate_YYYY_MM_DD(new Date().toISOString()), 1);
        setShowCancelTransactionModal(false);

        const dataErrorRequester: NotificationData = {
          type: "error",
          title: "Giao dịch của bạn",
          message: "Giao dịch của bạn đã bị huỷ từ người cho.",
          entity: "Transaction",
          entityId: transaction.requestId,
        };

        sendNotification(transaction.requester.id, dataErrorRequester);

        const dataErrorCharitarian: NotificationData = {
          type: "error",
          title: "Giao dịch của bạn",
          message: "Bạn đã huỷ giao dịch.",
          entity: "Transaction",
          entityId: transaction.requestId,
        };

        sendNotification(transaction.charitarian.id, dataErrorCharitarian);
      }

      // setAlertData({
      //   title: "Thành công",
      //   message: "Bạn đã từ chối yêu cầu này!",
      // });
      // setShowAlertDialog(true);
    } catch (error) {
      console.error("Error cancel request:", error);
    }
  };

  const generateDateList = (centerDate: Date): void => {
    const dates: DateItem[] = [];
    const prevDate = new Date(centerDate);
    prevDate.setDate(prevDate.getDate() - 1);
    dates.push({
      date: prevDate,
      formatted: formatDate_DD_MM_YYYY(prevDate.toISOString()),
    });

    dates.push({
      date: new Date(centerDate),
      formatted: formatDate_DD_MM_YYYY(centerDate.toISOString()),
    });

    const nextDate = new Date(centerDate);
    nextDate.setDate(nextDate.getDate() + 1);
    dates.push({
      date: nextDate,
      formatted: formatDate_DD_MM_YYYY(nextDate.toISOString()),
    });

    setDateList(dates);
  };

  const handleDateSelect = (date: Date): void => {
    setSelectedDate(date);
    generateDateList(date);
    fetchTransactions(formatDate_YYYY_MM_DD(date.toISOString()), 1);
  };

  const handleDatePickerChange = (event: any, date?: Date): void => {
    setShowDatePicker(false);
    if (date) {
      handleDateSelect(date);
    }
  };

  const handleOpenActionModal = (transaction: Transaction, action: string) => {
    setSelectedTransaction(transaction);
    if (action === "confirm") {
      setShowConfirmModal(true);
    } else if (action === "reject") {
      setShowInputRejectMessage(true);
    } else if (action === "cancel") {
      setShowCancelTransactionModal(true);
    }
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date): boolean => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const formatTimeRange = (dateString: string) => {
    const date = new Date(dateString);
    const startTime = new Date(date.getTime() - 15 * 60 * 1000); // Subtract 15 minutes
    const endTime = new Date(date.getTime() + 45 * 60 * 1000); // Add 45 minutes

    const formatTime = (d: Date) => {
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };

    return `${formatTime(startTime)} - ${formatTime(
      endTime
    )} ${formatDate_DD_MM_YYYY(date.toISOString())}`;
  };

  const getTransactionTitle = (transaction: Transaction) => {
    if (!transaction.requesterItem?.itemName) {
      return `Giao dịch đăng ký nhận từ ${
        checkRole(transaction) === "requester"
          ? "bạn"
          : transaction.requester.name
      }`;
    }
    return `Giao dịch giữa bạn và ${
      checkRole(transaction) === "charitarian"
        ? transaction.requester.name
        : transaction.charitarian.name
    }`;
  };
  interface RatingResponse {
    isSuccess: boolean;
    data: any;
    code: number;
    message?: string;
  }

  const handleRating = async (
    ratingData: TransactionRatingType
  ): Promise<void> => {
    try {
      // Input validation
      if (!ratingData || !ratingData.rating) {
        Alert.alert("Lỗi", "Vui lòng nhập đánh giá");
        return;
      }

      // API call to submit rating
      const response = await axiosInstance.post<RatingResponse>(
        `${API_CREATE_RATING_TRANSACTION}`,
        JSON.stringify(ratingData),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      let pointValue;
      switch (ratingData.rating) {
        case 1:
          pointValue = -3;
          break;
        case 2:
          pointValue = -2;
          break;
        case 3:
          pointValue = 0;
          break;
        case 4:
          pointValue = 2;
          break;
        case 5:
          pointValue = 5;
          break;
      }

      const pointData = {
        userId: ratingData.ratedUserId,
        point: pointValue,
      };

      console.log("pointData", pointData);

      const pointResponse = await axiosInstance.post(
        `${API_CREATE_POINT_TRANSACTION}`,
        pointData
      );

      if (response.data.isSuccess && pointResponse.data.isSuccess) {
        setIsConfirm((prev) => !prev);
        Alert.alert("Thành công", "Cảm ơn bạn đã gửi đánh giá");
      } else {
        Alert.alert(
          "Lỗi",
          response.data.message ||
            "Không thể gửi đánh giá. Vui lòng thử lại sau"
        );
      }
    } catch (error) {
      console.error("Rating error:", error);
      Alert.alert(
        "Lỗi",
        "Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại sau"
      );
    }
  };

  const handleOpenRatingModal = (transaction: Transaction) => {
    setIsRatingModalVisible(true);
    setSelectedTransaction(transaction);
  };

  const handleReport = async (
    reportData: TransactionReportType
  ): Promise<void> => {
    try {
      // API call to submit rating
      const response = await axiosInstance.post(
        `${API_CREATE_REPORT}`,
        JSON.stringify(reportData),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.isSuccess) {
        fetchTransactions(formatDate_YYYY_MM_DD(new Date().toISOString()), 1);
        Alert.alert("Thành công", "Cảm ơn bạn đã gửi báo cáo.");
      } else {
        Alert.alert(
          "Lỗi",
          response.data.message || "Không thể gửi báo cáo. Vui lòng thử lại sau"
        );
      }
    } catch (error) {
      console.error("Rating error:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi gửi báo cáo. Vui lòng thử lại sau");
    }
  };

  const handleOpenReportModal = (transaction: Transaction) => {
    setIsReportModalVisible(true);
    setSelectedTransaction(transaction);
  };

  const renderStars = (rating: number) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Icon
        key={star}
        name="star"
        size={30}
        color={star <= rating ? "#FFD700" : "#D3D3D3"}
      />
    ));
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "In_Progress":
        return "Đang diễn ra";
      case "Completed":
        return "Đã hoàn thành";
      case "Not_Completed":
        return "Không thành công";
      case "Canceled":
        return "Đã huỷ";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In_Progress":
        return Colors.orange500;
      case "Completed":
        return Colors.lightGreen;
      case "Not_Completed":
        return Colors.lightRed || "#FF0000"; // Add error color to Colors constant
      case "Canceled":
        return Colors.gray500;
      default:
        return Colors.orange500;
    }
  };

  const fetchQRCode = async (transactionId: string) => {
    try {
      const response = await axiosInstance.get(
        `${API_GET_QR_CODE}?transactionId=${transactionId}`,
        {
          responseType: "arraybuffer",
        }
      );

      // Convert binary data to base64
      const base64Image = `data:image/png;base64,${Buffer.from(
        response.data,
        "binary"
      ).toString("base64")}`;
      setQrCodeBase64(base64Image);
    } catch (error) {
      console.error("Error fetching QR code:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.orange500} />
      </View>
    );
  }

  if (transactions.length === 0) {
    return (
      <View>
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
                  <Text
                    style={[
                      styles.dateText,
                      (isSelected(item.date) || isToday(item.date)) &&
                        styles.selectedDateText,
                    ]}
                  >
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

        <View style={styles.emptyContainer}>
          <Icon name="block" size={50} />
          <Text style={styles.emptyText}>Không có giao dịch nào</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      {requestId === "" && (
        <>
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
                    <Text
                      style={[
                        styles.dateText,
                        (isSelected(item.date) || isToday(item.date)) &&
                          styles.selectedDateText,
                      ]}
                    >
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
        </>
      )}
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
            />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } =
              nativeEvent;
            const isCloseToBottom =
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 20;

            if (isCloseToBottom) {
              loadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {requestId === "" ? (
            <>
              <Text style={styles.resultCount}>
                {transactions.length} giao dịch
              </Text>
              {transactions.map((transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate("MyTransactions", {
                      requestId: transaction.requestId,
                    })
                  }
                >
                  <View style={styles.cardHeaderList}>
                    <Text style={styles.cardTitleList}>
                      {getTransactionTitle(transaction)}
                    </Text>
                    <View style={styles.statusContainerList}>
                      <View
                        style={[
                          styles.statusDotList,
                          {
                            backgroundColor: getStatusColor(transaction.status),
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusList,
                          { color: getStatusColor(transaction.status) },
                        ]}
                      >
                        {getStatusText(transaction.status)}
                      </Text>
                    </View>
                  </View>

                  {transaction.requesterItem ? (
                    <View style={styles.productsContainerList}>
                      <View style={styles.productCardList}>
                        <Image
                          source={{
                            uri: transaction.requesterItem?.itemImages[0],
                          }}
                          style={styles.productImageList}
                        />
                        <Text style={styles.productNameList} numberOfLines={2}>
                          {transaction.requesterItem?.itemName}
                        </Text>
                        <Text style={styles.ownerNameList}>
                          {transaction.requester.name}
                        </Text>
                      </View>

                      <View style={styles.exchangeContainerList}>
                        <Icon
                          name="swap-horiz"
                          size={24}
                          color={Colors.orange500}
                        />
                      </View>

                      {/* Recipient's Product */}
                      <View style={styles.productCardList}>
                        <Image
                          source={{
                            uri: transaction.charitarianItem.itemImages[0],
                          }}
                          style={styles.productImageList}
                        />
                        <Text style={styles.productNameList} numberOfLines={2}>
                          {transaction.charitarianItem.itemName}
                        </Text>
                        <Text style={styles.ownerNameList}>
                          {transaction.charitarian.name}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.productCardList}>
                      <Image
                        source={{
                          uri: transaction.charitarianItem.itemImages[0],
                        }}
                        style={styles.productImageList}
                      />
                      <Text style={styles.productName} numberOfLines={2}>
                        {transaction.charitarianItem.itemName}
                      </Text>
                      <Text style={styles.ownerNameList}>
                        {transaction.charitarian.name}
                      </Text>
                    </View>
                  )}

                  <View style={styles.dateInfoList}>
                    <View style={styles.dateRowList}>
                      <Text style={styles.dateLabelList}>Ngày tạo:</Text>
                      <Text style={styles.dateValueList}>
                        {formatDate(transaction.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.dateRowList}>
                      <Text style={styles.dateLabelList}>Thời gian hẹn:</Text>
                      <Text style={styles.dateValueList}>
                        {formatDate(transaction.appointmentDate)}
                      </Text>
                    </View>
                  </View>
                  {transaction.requestNote !== "" &&
                    checkRole(transaction) === "requester" && (
                      <View style={styles.dateInfoList}>
                        <Text style={styles.dateLabelList}>
                          <Icon
                            name="question-answer"
                            size={12}
                            color={Colors.orange500}
                          />
                          {"  "}
                          Lời nhắn từ người cho: {transaction.requestNote}
                        </Text>
                      </View>
                    )}
                  {/* {transaction.rejectMessage !== "" && (
                    <View style={styles.dateInfoList}>
                      <Text style={styles.rejectMessage}>
                        <Icon
                          name="question-answer"
                          size={12}
                          color={Colors.orange500}
                        />
                        {"  "}
                        {transaction.rejectMessage}
                      </Text>
                    </View>
                  )} */}
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              {transactions.map((transaction) => (
                <View key={transaction.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>
                      {getTransactionTitle(transaction)}
                    </Text>
                    <View style={styles.statusContainer}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: getStatusColor(transaction.status),
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.status,
                          { color: getStatusColor(transaction.status) },
                        ]}
                      >
                        {getStatusText(transaction.status)}
                      </Text>
                    </View>
                  </View>

                  {transaction.requesterItem ? (
                    <View style={styles.productsContainer}>
                      <View style={styles.productCard}>
                        <Image
                          source={{
                            uri: transaction.requesterItem?.itemImages[0],
                          }}
                          style={styles.productImage}
                        />
                        <Text style={styles.productName} numberOfLines={2}>
                          {transaction.requesterItem?.itemName}
                        </Text>
                        <Text style={styles.ownerName}>
                          {transaction.requester.name}
                        </Text>
                      </View>

                      <View style={styles.exchangeContainer}>
                        <Icon
                          name="swap-horiz"
                          size={24}
                          color={Colors.orange500}
                        />
                      </View>

                      {/* Recipient's Product */}
                      <View style={styles.productCard}>
                        <Image
                          source={{
                            uri: transaction.charitarianItem.itemImages[0],
                          }}
                          style={styles.productImage}
                        />
                        <Text style={styles.productName} numberOfLines={2}>
                          {transaction.charitarianItem.itemName}
                        </Text>
                        <Text style={styles.ownerName}>
                          {transaction.charitarian.name}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.productCard}>
                      <Image
                        source={{
                          uri: transaction.charitarianItem.itemImages[0],
                        }}
                        style={styles.productImage}
                      />
                      <Text style={styles.productName} numberOfLines={2}>
                        {transaction.charitarianItem.itemName}
                      </Text>
                      <Text style={styles.ownerName}>
                        {transaction.charitarian.name}
                      </Text>
                    </View>
                  )}

                  <View style={styles.dateInfo}>
                    <View style={styles.dateRow}>
                      <Text style={styles.dateLabel}>Ngày tạo:</Text>
                      <Text style={styles.dateValue}>
                        {formatDate(transaction.createdAt)}
                      </Text>
                    </View>
                    <View style={styles.dateRow}>
                      <Text style={styles.dateLabel}>Thời gian hẹn:</Text>
                      <Text style={styles.dateValue}>
                        {formatDate(transaction.appointmentDate)}
                      </Text>
                    </View>
                  </View>

                  {transaction.requestNote !== "" &&
                    checkRole(transaction) === "requester" && (
                      <View style={styles.dateInfo}>
                        <Text style={styles.dateLabel}>
                          <Icon
                            name="question-answer"
                            size={12}
                            color={Colors.orange500}
                          />
                          {"  "}
                          Lời nhắn từ người cho: {transaction.requestNote}
                        </Text>
                      </View>
                    )}

                  {/* {transaction.rejectMessage !== "" && (
                    <View style={styles.dateInfoList}>
                      <Text style={styles.rejectMessage}>
                        <Icon
                          name="question-answer"
                          size={12}
                          color={Colors.orange500}
                        />
                        {"  "}
                        {transaction.rejectMessage}
                      </Text>
                    </View>
                  )} */}

                  {/* Chưa tới giờ thì hiện, nên có dấu ! nha */}
                  {!transaction.isValidTime &&
                    checkRole(transaction) === "requester" &&
                    transaction.status === "In_Progress" && (
                      <>
                        <View style={styles.dateInfo}>
                          <Text style={styles.dateLabel}>
                            <Icon
                              name="info"
                              size={14}
                              color={Colors.orange500}
                            />{" "}
                            Lưu ý: Bạn nên tới vào lúc{" "}
                            {formatTimeRange(transaction.appointmentDate)} để có
                            thể thấy được mã xác nhận và hoàn thành giao dịch.
                          </Text>
                        </View>
                        <View style={styles.dateInfo}>
                          <Text style={styles.dateLabel}>
                            <Icon
                              name="map"
                              size={14}
                              color={Colors.orange500}
                            />{" "}
                            Đường đi sẽ được gửi tới bạn vào lúc{" "}
                            {formatTimeRange(transaction.appointmentDate)}
                          </Text>
                        </View>
                      </>
                    )}

                  {transaction.rejectMessage && (
                    <Text style={styles.rejectMessage}>
                      Từ chối: {transaction.rejectMessage}
                    </Text>
                  )}

                  {transaction.campaign && (
                    <>
                      <Text style={styles.headerCampaignText} numberOfLines={2}>
                        Đóng góp cho chiến dịch:
                      </Text>
                      <View
                        style={styles.campaignCard}
                        // onPress={() => {navigation.navigate("CampaignDetail", { campaignId: transaction.campaign.id })}}
                      >
                        <View style={styles.campaignImageContainer}>
                          <Image
                            source={{ uri: transaction.campaign.bannerPicture }}
                            style={styles.bannerImage}
                            resizeMode="cover"
                          />
                        </View>
                        <View style={styles.campaignInfo}>
                          <Text style={styles.campaignName} numberOfLines={2}>
                            {transaction.campaign.name}
                          </Text>
                          <Text
                            style={styles.campaignDescription}
                            numberOfLines={1}
                          >
                            {transaction.campaign.description}
                          </Text>
                          <View style={styles.campaignFooter}>
                            <Text style={styles.campaignDates}>
                              {formatDate_DD_MM_YYYY(
                                transaction.campaign.startDate
                              )}{" "}
                              -{" "}
                              {formatDate_DD_MM_YYYY(
                                transaction.campaign.endDate
                              )}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </>
                  )}

                  {/* tới giờ thì mới hiện, nên KHÔNG có dấu ! nha */}
                  {transaction.isValidTime && (
                    <>
                      {transaction.status === "In_Progress" &&
                        checkRole(transaction) === "requester" && (
                          <>
                            {!transaction.isVerifiedTransaction ? (
                              <>
                                <TouchableOpacity
                                  style={[
                                    styles.verifyButton,
                                    {
                                      opacity: !transaction.arrivedAtDestination
                                        ? 0.5
                                        : 1,
                                    },
                                  ]}
                                  disabled={!transaction.arrivedAtDestination}
                                  onPress={() => {
                                    setSelectedTransaction(transaction);
                                    setShowModal(true);
                                    setVerificationInput("");
                                  }}
                                >
                                  <Text style={styles.verifyButtonText}>
                                    {transaction.arrivedAtDestination
                                      ? "Xem mã định danh"
                                      : "Bạn phải đến gần điểm hẹn hơn (<50m) để xem mã định danh"}
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={styles.detailsButton}
                                  onPress={() => {
                                    const sourceLocation: LocationMap = {
                                      latitude: parseFloat(
                                        transaction.requesterAddress
                                          .addressCoordinates.latitude
                                      ),
                                      longitude: parseFloat(
                                        transaction.requesterAddress
                                          .addressCoordinates.longitude
                                      ),
                                    };
                                    const destinationLocation: LocationMap = {
                                      latitude: parseFloat(
                                        transaction.charitarianAddress
                                          .addressCoordinates.latitude
                                      ),
                                      longitude: parseFloat(
                                        transaction.charitarianAddress
                                          .addressCoordinates.longitude
                                      ),
                                    };
                                    setShowMapModal(true);
                                    setLocation(sourceLocation);
                                    setDestinationLocation(destinationLocation);
                                    setSelectedTransaction(transaction);
                                  }}
                                >
                                  <View style={styles.detailsButtonContent}>
                                    <Icon
                                      name="map"
                                      size={20}
                                      color={Colors.orange500}
                                    />
                                    <Text style={styles.detailsButtonText}>
                                      Xem địa chỉ
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              </>
                            ) : (
                              <TouchableOpacity
                                style={[
                                  styles.verifyButton,
                                  {
                                    opacity: transaction.isVerifiedTransaction
                                      ? 0.5
                                      : 1,
                                  },
                                ]}
                                disabled={transaction.isVerifiedTransaction}
                                onPress={() => {
                                  setSelectedTransaction(transaction);
                                  setShowModal(true);
                                  setVerificationInput("");
                                }}
                              >
                                <Text style={styles.verifyButtonText}>
                                  Đã xác thực giao dịch
                                </Text>
                              </TouchableOpacity>
                            )}

                            <TouchableOpacity
                              style={styles.detailsButton}
                              onPress={() => {
                                console.log("Gọi điện");
                              }}
                            >
                              <View style={styles.detailsButtonContent}>
                                <Icon
                                  name="phone"
                                  size={20}
                                  color={Colors.orange500}
                                />
                                <Text style={styles.detailsButtonText}>
                                  Gọi điện
                                </Text>
                              </View>
                            </TouchableOpacity>
                          </>
                        )}

                      {transaction.status === "In_Progress" &&
                        checkRole(transaction) === "charitarian" && (
                          <>
                            {!transaction.isVerifiedTransaction ? (
                              <>
                                <TouchableOpacity
                                  style={[
                                    styles.verifyButton,
                                    {
                                      opacity: !transaction.arrivedAtDestination
                                        ? 0.5
                                        : 1,
                                    },
                                  ]}
                                  disabled={!transaction.arrivedAtDestination}
                                  onPress={() => {
                                    navigation.navigate("QRScanner");
                                  }}
                                >
                                  <Text style={styles.verifyButtonText}>
                                    Xác thực giao dịch
                                  </Text>
                                </TouchableOpacity>
                              </>
                            ) : (
                              <>
                                <TouchableOpacity
                                  style={[
                                    styles.verifyButton,
                                    {
                                      opacity: 0.5,
                                    },
                                  ]}
                                  disabled={true}
                                >
                                  <Text style={styles.verifyButtonText}>
                                    Đã xác thực
                                  </Text>
                                </TouchableOpacity>
                                <View style={styles.topButtonRow}>
                                  <TouchableOpacity
                                    style={[
                                      styles.modalButton,
                                      styles.rejectButton,
                                    ]}
                                    onPress={() =>
                                      handleOpenActionModal(
                                        transaction,
                                        "reject"
                                      )
                                    }
                                  >
                                    <Text style={styles.verifyButtonText}>
                                      Từ chối
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[
                                      styles.modalButton,
                                      {
                                        backgroundColor: Colors.lightGreen,
                                        alignItems: "center",
                                      },
                                    ]}
                                    onPress={() =>
                                      handleOpenActionModal(
                                        transaction,
                                        "confirm"
                                      )
                                    }
                                  >
                                    <Text style={styles.verifyButtonText}>
                                      Xác nhận
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </>
                            )}

                            <TouchableOpacity
                              style={styles.detailsButton}
                              onPress={() => {
                                console.log("Gọi điện");
                              }}
                            >
                              <View style={styles.detailsButtonContent}>
                                <Icon
                                  name="phone"
                                  size={20}
                                  color={Colors.orange500}
                                />
                                <Text style={styles.detailsButtonText}>
                                  Gọi điện
                                </Text>
                              </View>
                            </TouchableOpacity>
                          </>
                        )}
                    </>
                  )}

                  {(transaction.status === "Completed" ||
                    transaction.status === "Not_Completed") && (
                    <>
                      {transaction.rating === null ||
                      transaction.rating === 0 ? (
                        <TouchableOpacity
                          style={styles.detailsButton}
                          onPress={() => handleOpenRatingModal(transaction)}
                        >
                          <View style={styles.detailsButtonContent}>
                            <Icon
                              name="drive-file-rename-outline"
                              size={20}
                              color={Colors.orange500}
                            />
                            <Text style={styles.detailsButtonText}>
                              Đánh giá
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <View style={styles.starContainer}>
                            <Text style={styles.titleText}>
                              Đánh giá giao dịch
                            </Text>
                            <View style={styles.ratingContainer}>
                              <Text style={styles.labelText}>Chất lượng: </Text>
                              <Text style={styles.starText}>
                                {renderStars(transaction.rating || 0)}
                              </Text>
                            </View>
                            {transaction.ratingComment && (
                              <View style={styles.commentContainer}>
                                <Text style={styles.labelText}>Nhận xét: </Text>
                                <Text style={styles.commentText}>
                                  {transaction.ratingComment}
                                </Text>
                              </View>
                            )}
                          </View>
                        </>
                      )}

                      <TouchableOpacity
                        style={styles.detailsButton}
                        onPress={() => handleOpenReportModal(transaction)}
                      >
                        <View style={styles.detailsButtonContent}>
                          <Icon
                            name="report"
                            size={20}
                            color={Colors.orange500}
                          />
                          <Text style={styles.detailsButtonText}>Báo cáo</Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  )}

                  {transaction.status === "In_Progress" &&
                    isPastDate(transaction.appointmentDate) && (
                      <View style={styles.actions}>
                        <TouchableOpacity
                          style={[
                            styles.button,
                            styles.cancelTransactionButton,
                          ]}
                          onPress={() =>
                            handleOpenActionModal(transaction, "cancel")
                          }
                        >
                          <Text style={styles.buttonText}>Huỷ giao dịch</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                </View>
              ))}
            </>
          )}
        </ScrollView>

        <Modal visible={showModal} transparent animationType="slide">
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowModal(false)}
          >
            <Text style={{ color: "#888" }}>Đóng</Text>
          </TouchableOpacity>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Mã định danh</Text>
              {selectedTransaction && (
                <View style={styles.idContainer}>
                  {qrCodeBase64 && (
                    <Image
                      source={{
                        uri: qrCodeBase64,
                      }}
                      style={{ width: 220, height: 220 }}
                    />
                  )}
                </View>
              )}

              <Text
                style={{
                  color: "#ababab",
                  fontStyle: "italic",
                  textAlign: "center",
                }}
              >
                *Sử dụng mã định danh này để xác nhận giao dịch khi bạn đến
              </Text>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Xác nhận giao dịch</Text>
              <View style={styles.modalDescriptionContainer}>
                <Text style={styles.modalDescriptionV2}>
                  Chụp hình ảnh để xác nhận giao dịch
                </Text>
                <MediaUploadSection
                  images={images}
                  video={""}
                  selectedImage={selectedImage}
                  isLoading={isUploadingImage}
                  isVideoLoading={false}
                  onPickImage={handleImageUpload}
                  onCaptureImage={handleCaptureImage}
                  onPickVideo={() => {}}
                  onRemoveImage={removeImage}
                  onRemoveVideo={() => {}}
                  canUploadVideo={false}
                  maxNumberOfImages={3}
                />
              </View>

              <View style={styles.modalButtonContainer}>
                <View style={styles.topButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowConfirmModal(false);
                      setShowInputRejectMessage(false);
                      setRejectMessage("");
                    }}
                  >
                    <Text style={styles.cancleButtonText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.verifyButton]}
                    onPress={() => {
                      if (selectedTransaction) {
                        handleVerification(selectedTransaction);
                      }
                    }}
                  >
                    <Text style={styles.buttonText}>Xác nhận</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showInputRejectMessage}
          transparent
          animationType="fade"
          onRequestClose={() => setShowInputRejectMessage(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Từ chối giao dịch</Text>

              <View style={styles.modalDescriptionContainer}>
                <Text style={styles.modalDescriptionV2}>
                  Chụp hình ảnh để từ chối giao dịch
                </Text>
                <MediaUploadSection
                  images={images}
                  video={""}
                  selectedImage={selectedImage}
                  isLoading={isUploadingImage}
                  isVideoLoading={false}
                  onPickImage={handleImageUpload}
                  onCaptureImage={handleCaptureImage}
                  onPickVideo={() => {}}
                  onRemoveImage={removeImage}
                  onRemoveVideo={() => {}}
                  canUploadVideo={false}
                  maxNumberOfImages={3}
                />
              </View>

              <Text style={styles.modalDescription}>
                Vui lòng nhập lý do từ chối:
              </Text>
              <TextInput
                placeholderTextColor="#c4c4c4"
                style={styles.requestInput}
                placeholder="Nhập tin nhắn..."
                value={rejectMessage}
                onChangeText={setRejectMessage}
                multiline
              />
              {rejectMessage.length > 99 && (
                <Text style={styles.textErrorMessage}>
                  Lời nhắn của bạn không được vượt quá 100 ký tự.
                </Text>
              )}
              {rejectMessage.length === 0 && (
                <Text style={styles.textErrorMessage}>
                  Bạn phải nhập lí do từ chối
                </Text>
              )}

              <View style={styles.modalButtonContainer}>
                <View style={styles.topButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowConfirmModal(false);
                      setShowInputRejectMessage(false);
                      setRejectMessage("");
                    }}
                  >
                    <Text style={styles.cancleButtonText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.rejectButton,
                      rejectMessage.length === 0 && styles.disabledButton,
                    ]}
                    disabled={rejectMessage.length === 0}
                    onPress={() => {
                      if (selectedTransaction) {
                        handleReject(selectedTransaction);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        rejectMessage.length === 0 && styles.disabledButtonText,
                      ]}
                    >
                      Từ chối
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showCancelTransactionModal}
          transparent
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={[styles.modalTitle]}>Bạn muốn huỷ yêu cầu này?</Text>
              {/* <Text style={styles.modalDescription}>Nhập lời nhắn của bạn:</Text>
                    <TextInput
                      placeholderTextColor="#c4c4c4"
                      style={styles.requestInput}
                      placeholder="Nhập tin nhắn..."
                      value={rejectMessage}
                      onChangeText={setRejectMessage}
                      multiline
                    />
                    {rejectMessage.length > 99 && (
                      <Text style={styles.textErrorMessage}>
                        Lời nhắn của bạn không được vượt quá 100 ký tự.
                      </Text>
                    )} */}

              <View style={styles.modalButtonContainer}>
                <View style={styles.topButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowCancelTransactionModal(false);
                    }}
                  >
                    <Text style={styles.modalButtonText}>Hủy</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={() => {
                      selectedTransaction?.id &&
                        handleCancelTransaction(selectedTransaction);
                    }}
                  >
                    <Text style={styles.modalButtonText}>Xác nhận</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <UserRatingModal
          isVisible={isRatingModalVisible}
          onClose={() => setIsRatingModalVisible(false)}
          onSubmitRating={handleRating}
          userTransactionToRate={{
            userId:
              userId === selectedTransaction?.charitarian.id
                ? selectedTransaction?.requester.id
                : selectedTransaction?.charitarian.id || "",
            userName:
              userId === selectedTransaction?.charitarian.id
                ? selectedTransaction?.requester.name || ""
                : selectedTransaction?.charitarian.name || "",
            transactionId: selectedTransaction?.id || "",
          }}
        />

        <ReportModal
          isVisible={isReportModalVisible}
          onClose={() => setIsReportModalVisible(false)}
          onSubmit={handleReport}
          userTransactionToRate={{
            userId:
              userId === selectedTransaction?.charitarian.id
                ? selectedTransaction?.requester.id
                : selectedTransaction?.charitarian.id || "",
            userName:
              userId === selectedTransaction?.charitarian.id
                ? selectedTransaction?.requester.name || ""
                : selectedTransaction?.charitarian.name || "",
            transactionId: selectedTransaction?.id || "",
          }}
        />

        <MapModal
          open={showMapModal}
          onClose={setShowMapModal}
          sourceLocation={location}
          destinationLocation={destinationLocation}
          transactionId={selectedTransaction?.id}
          type="Normal"
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#f5f5f5",
    padding: 10,
  },
  datePickerButton: {
    padding: 10,
    backgroundColor: Colors.orange500,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  datePickerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dateListContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateList: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateItem: {
    padding: 10,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
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
    color: "#333",
  },
  selectedDateText: {
    color: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  resultCount: {
    color: "#666",
    marginBottom: 16,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  status: {
    fontSize: 16,
    fontWeight: "500",
  },
  productsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  productCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 4,
    color: "#333",
  },
  ownerName: {
    fontSize: 13,
    color: "#666",
  },
  exchangeContainer: {
    width: 40,
    alignItems: "center",
  },
  cardHeaderList: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitleList: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  statusContainerList: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDotList: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusList: {
    fontSize: 12,
    fontWeight: "500",
  },
  productsContainerList: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productCardList: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 4,
  },
  productImageList: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 4,
  },
  productNameList: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  ownerNameList: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
  },
  exchangeContainerList: {
    paddingHorizontal: 8,
  },
  dateInfo: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dateLabel: {
    color: "#666",
    fontSize: 14,
  },
  dateValue: {
    color: "#333",
    fontSize: 14,
    fontWeight: "500",
  },
  exchangeIcon: {
    fontSize: 24,
  },
  emptyProductCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    height: 160,
  },
  emptyProductText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  dateInfoList: {
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  dateRowList: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dateLabelList: {
    color: "#666",
    fontSize: 12,
  },
  dateValueList: {
    color: "#333",
    fontSize: 12,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 24,
    borderRadius: 16,
    width: "85%",
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#333",
  },
  idContainer: {
    marginBottom: 16,
    alignItems: "center",
  },
  transactionIdBox: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    width: "100%",
  },
  transactionIdText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    color: "#333",
  },
  showIdButton: {
    backgroundColor: Colors.orange500,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  showIdButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtonContainer: {
    width: "100%",
  },
  topButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  bottomButton: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    flex: 0.48, // For top row buttons
    alignItems: "center",
  },
  verifyButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: Colors.orange500,
  },
  verifyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  rejectButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#f00",
  },
  cancelButton: {
    backgroundColor: "#666",
  },
  confirmButton: {
    backgroundColor: "#34C759",
  },
  modalButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  cancleButtonText: {
    color: "#eee",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  detailsButton: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    borderColor: Colors.orange500,
    borderWidth: 1,
  },
  detailsButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  detailsButtonText: {
    marginLeft: 8,
    color: Colors.orange500,
    fontSize: 14,
    fontWeight: "500",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.5,
  },
  disabledButtonText: {
    color: "#666",
  },
  starContainer: {
    marginVertical: 10,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    color: "#666",
  },
  starText: {
    fontSize: 18,
    color: "#FFD700",
  },
  commentContainer: {
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    padding: 10,
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    fontStyle: "italic",
  },
  requestInput: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    width: "100%",
  },
  textErrorMessage: {
    color: "#e53e3e",
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: "bold",
    textAlign: "left",
  },
  modalDescriptionContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalDescriptionV2: {
    fontSize: 16,
    marginBottom: 16,
  },
  rejectMessage: {
    backgroundColor: "#ffe3e3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  headerCampaignText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
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
    width: "100%",
    height: 100,
    objectFit: "cover",
    borderRadius: 8,
  },
  campaignImageContainer: {
    flex: 4,
  },
  campaignInfo: {
    flex: 6,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  campaignDescription: {
    fontSize: 12,
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
    fontSize: 12,
    color: "#888",
  },
  scrollView: {
    flex: 1,
    // paddingHorizontal: 16,
  },
  scrollContent: {
    padding: 16,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    marginBottom: 30,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelTransactionButton: {
    backgroundColor: Colors.orange500,
  },
});

export default MyTransactions;
