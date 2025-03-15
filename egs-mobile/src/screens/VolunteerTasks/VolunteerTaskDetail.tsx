import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axiosInstance from "@/src/api/axiosInstance";
import {
  formatDate,
  formatDate_DD_MM_YYYY,
  formatDate_YYYY_MM_DD,
  formatDateOnlyDate,
} from "@/src/shared/formatDate";
import Icon from "react-native-vector-icons/MaterialIcons";
import Colors from "@/src/constants/Colors";
import { RouteProp, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "@/src/layouts/types/navigationTypes";
import {
  AddressCoordinates,
  LocationMap,
  Transaction,
  TransactionMapping,
} from "@/src/shared/type";
import { postService } from "@/src/services/postService";
import {
  NotificationData,
  useNotificationStore,
} from "@/src/stores/notificationStore";
import MediaUploadSection from "@/src/components/MediaUploadSection";
import MapModal from "@/src/components/Map/MapModal";
import { useNavigation } from "@/src/hooks/useNavigation";
import { Buffer } from "buffer";
import Constants from "expo-constants";
const API_APPROVE_TRANSACTION = (Constants.expoConfig as any).extra.API_APPROVE_TRANSACTION;

interface VolunteerTransactionByAddress {
  addressId: string;
  address: string;
  addressCoordinates: AddressCoordinates;
  totalItem: number;
  transactions: Transaction[];
}

interface TimeFrame {
  timeFrame: string;
  volunteerTransactionByAddresses: VolunteerTransactionByAddress[];
}

type VolunteerTaskDetailRouteProp = RouteProp<
  RootStackParamList,
  "VolunteerTaskDetail"
>;

const VolunteerTaskDetail: React.FC = () => {
  const route = useRoute<VolunteerTaskDetailRouteProp>();
  const { addressId, dateOnly, timeFrame, addressName, addressCoordinates } =
    route.params;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsMapping, setTransactionsMapping] = useState<
    TransactionMapping[]
  >([]);
  const [moreImages, setMoreImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [selectedTransactionMapping, setSelectedTransactionMapping] =
    useState<TransactionMapping | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isConfirm, setIsConfirm] = useState(false);
  const { sendNotification } = useNotificationStore();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationMap>({
    latitude: 0,
    longitude: 0,
  });
  const [destinationLocation, setDestinationLocation] = useState<LocationMap>({
    latitude: 0,
    longitude: 0,
  });
  const [isLoadingQRCode, setIsLoadingQRCode] = useState(false);

  const [selectedTransactions, setSelectedTransactions] = useState<
    Transaction[]
  >([]);

  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const PAGE_SIZE = 10;

  const navigation = useNavigation();

  const fetchTasks = async (page: number) => {
    try {
      setLoading(true);
      const result = await axiosInstance.get(
        `volunteer/task/${dateOnly}/${timeFrame}/${addressId}?pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
      );
      const response = result.data.data.data;
      if (!response) {
        return;
      }
      const { totalItems } = result.data.data;
      const statusOrder = {
        In_Progress: 0,
        Completed: 1,
        Not_Completed: 2,
      };

      // Map để nhóm transaction theo charitarian.id
      const transactionMap = new Map<string, TransactionMapping>();

      let transactionIdCounter = 1;

      response.forEach((transaction: Transaction) => {
        const charitarianId = transaction.charitarian.id;
        console.log("transaction name", transaction.charitarianItem.itemName);
        console.log("transaction status", transaction.status);

        if (transactionMap.has(charitarianId)) {
          const existingTransaction = transactionMap.get(charitarianId);

          if (existingTransaction) {
            const newIsVerified =
              existingTransaction.isVerifiedTransaction &&
              (transaction.status === "In_Progress"
                ? transaction.isVerifiedTransaction
                : existingTransaction.isVerifiedTransaction);

            const newCanApproved =
              existingTransaction.canApprove ||
              transaction.status === "In_Progress";

            const newArrivedAtDestination =
              existingTransaction.arrivedAtDestination &&
              (transaction.status === "In_Progress"
                ? transaction.arrivedAtDestination
                : existingTransaction.arrivedAtDestination);

            existingTransaction.transactionItems.push(transaction);
            existingTransaction.transactionIds.push(transaction.id);
            existingTransaction.isVerifiedTransaction = newIsVerified;
            existingTransaction.arrivedAtDestination = newArrivedAtDestination;
            existingTransaction.canApprove = newCanApproved;
          }
        } else {
          transactionMap.set(charitarianId, {
            transactionMappingId: transactionIdCounter++, // Thêm ID tăng dần
            charitarian: transaction.charitarian,
            transactionIds: [transaction.id],
            transactionItems: [transaction],
            isVerifiedTransaction:
              transaction.status === "In_Progress"
                ? transaction.isVerifiedTransaction
                : false,
            arrivedAtDestination:
              transaction.status === "In_Progress"
                ? transaction.arrivedAtDestination
                : false,
            canApprove: transaction.status === "In_Progress",
          });
        }
      });

      // Chuyển Map về mảng và sắp xếp theo trạng thái
      const transactions = Array.from(transactionMap.values());

      // console.log(sortedTransactions)

      if (page === 1) {
        setTransactionsMapping(transactions);
      } else {
        setTransactionsMapping((prev) => [...prev, ...transactions]);
      }

      setTotalPages(Math.ceil(totalItems / PAGE_SIZE));
    } catch (error) {
      console.error("Error fetching transactions task data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(1);
  }, [isConfirm]);

  const loadMore = () => {
    if (!isLoading && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      fetchTasks(currentPage + 1);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks(1);
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setCurrentPage(1);
    // Reset products and fetch first page with search query
    fetchTasks(1);
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

  const handleSortTransactionByStatus = (transactions: Transaction[]) => {
    const statusOrder = {
      In_Progress: 0,
      Completed: 1,
      Not_Completed: 2,
      Canceled: 3,
    };

    return transactions.sort((a, b) => {
      return statusOrder[a.status] - statusOrder[b.status];
    });
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

  const handleGenerateQRCode = async (transactions: Transaction[]) => {
    try {
      //lọc các giao dịch "In_Progress"
      const inProgressTransactions = transactions.filter(
        (tx) => tx.status === "In_Progress"
      );

      // Lọc ra các giao dịch chưa được xác thực
      const unverifiedTransactions = inProgressTransactions.filter(
        (tx) => !tx.isVerifiedTransaction
      );

      // Kiểm tra nếu không có giao dịch nào chưa xác thực
      if (unverifiedTransactions.length === 0) {
        Alert.alert("Lỗi", "Không có giao dịch nào chưa xác thực.");
        return;
      }

      setIsLoadingQRCode(true); // Bắt đầu tải mã QR

      const success = await fetchQRCode(unverifiedTransactions);

      if (success) {
        setShowModal(true);
      } else {
        Alert.alert("Lỗi", "Không thể lấy mã QR. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setIsLoadingQRCode(false); // Dừng loading dù có lỗi hay không
    }
  };

  const handleVerification = async (
    selectedTransactionMapping: TransactionMapping
  ) => {
    try {
      if (!selectedTransactionMapping) {
        return;
      }
      selectedTransactions.map(async (transaction) => {
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
                setSelectedTransactions([]);
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

          // sendNotification(transaction.requester.id, dataSuccess);

          sendNotification(transaction.charitarian.id, dataSuccess);
        }
      });
      setSelectedTransactionMapping(null);
      setShowConfirmModal(false);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể xác nhận giao dịch. Vui lòng thử lại sau.");
    }
  };

  const handleOpenActionModal = (
    transactionMapping: TransactionMapping,
    action: string
  ) => {
    setSelectedTransactionMapping(transactionMapping);
    // Nếu action là confirm, thì lấy transactionMapping.transactionItems lấy ra list transaction đã xác thực, và lưu vào selectedTransactions

    if (action === "confirm") {
      if (selectedTransactions.length > 0) {
        if (
          selectedTransactions.some((tx) => tx.isVerifiedTransaction === false)
        ) {
          Alert.alert("Lỗi", "Bạn chỉ được chọn những giao dịch đã xác thực.");
          return;
        }
      }
 
      const selectedTransactionsFilter = transactionMapping.transactionItems.filter((tx) => tx.status === "In_Progress").filter(
        (tx) => tx.isVerifiedTransaction
      );
      setSelectedTransactions(selectedTransactionsFilter);

      if (selectedTransactionsFilter.length === 0) {
        Alert.alert("Lỗi", "Chưa có giao dịch nào được xác thực.");
        setShowConfirmModal(false);
        return;
      }
      setShowConfirmModal(true);
    }
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

  const handlePressTransaction = (transaction: Transaction) => {
    setSelectedTransactions((prevSelected) => {
      const isSelected = prevSelected.some((t) => t.id === transaction.id);
      if (isSelected) {
        return prevSelected.filter((t) => t.id !== transaction.id); // Bỏ nếu đã chọn
      } else {
        return [...prevSelected, transaction]; // Thêm mới nếu chưa chọn
      }
    });
  };

  const handleSelectAllTransaction = (transactions: Transaction[]) => {
    setSelectedTransactions((prevSelected) => {
      const filteredTransactions = transactions.filter(
        (transaction) => transaction.status === "In_Progress"
      );
      
      const isSelectedAll = prevSelected.length === filteredTransactions.length;
      return isSelectedAll ? [] : filteredTransactions;
    });
  };
  

  const getTransactionTitle = (name: string) => {
    return `Nhận sản phẩm của ${name}`;
  };
  interface RatingResponse {
    isSuccess: boolean;
    data: any;
    code: number;
    message?: string;
  }

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
        return Colors.lightRed || "#FF0000";
      case "Canceled":
        return Colors.gray500;
      default:
        return Colors.orange500;
    }
  };

  const fetchQRCode = async (unverifiedTransactions: Transaction[]) => {
    try {
      const stringTransId = unverifiedTransactions
        .map((transaction) => `transactionId=${transaction.id}`)
        .join("&");

      const response = await axiosInstance.get(
        `qr/volunteer/generate?${stringTransId}&dateOnly=${dateOnly}&timeFrame=${timeFrame}&addressId=${addressId}`,
        { responseType: "arraybuffer" }
      );

      const base64Image = `data:image/png;base64,${Buffer.from(
        response.data,
        "binary"
      ).toString("base64")}`;
      setQrCodeBase64(base64Image);

      return true; // Thành công
    } catch (error) {
      console.error("Error fetching QR code:", error);
      return false; // Thất bại
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.orange500} />
      </View>
    );
  }

  return (
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
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 20;

          if (isCloseToBottom) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        <View style={styles.taskInformation}>
          <Text>Ngày: {formatDate_DD_MM_YYYY(dateOnly)}</Text>
          <Text>Khung giờ: {timeFrame}</Text>
          <Text>Địa chỉ: {addressName}</Text>
        </View>
        {transactionsMapping.map((transactionMapping) => (
          <View
            key={transactionMapping.transactionMappingId}
            style={styles.card}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {getTransactionTitle(transactionMapping.charitarian.name)}
              </Text>
            </View>

            {transactionMapping.transactionItems.filter((tx) => tx.status === "In_Progress").length > 1 && (
              <>
                {selectedTransactions.length <
                transactionMapping.transactionItems.filter((tx) => tx.status === "In_Progress").length ? (
                  <TouchableOpacity
                    style={styles.selectAllButton}
                    onPress={() =>
                      handleSelectAllTransaction(
                        transactionMapping.transactionItems
                      )
                    }
                  >
                    <Text style={styles.selectAllButtonText}>Chọn tất cả</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.selectAllButton}
                    onPress={() =>
                      handleSelectAllTransaction(
                        transactionMapping.transactionItems
                      )
                    }
                  >
                    <Text style={styles.selectAllButtonText}>Bỏ chọn tất cả</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {handleSortTransactionByStatus(
              transactionMapping.transactionItems
            ).map((transaction) => (
              <TouchableOpacity
                key={`${transactionMapping.transactionMappingId}${transaction.id}`}
                onPress={() => handlePressTransaction(transaction)}
                disabled={transaction.status !== "In_Progress"}
                style={[
                  {
                    borderTopWidth: 1,
                    borderColor: "#ccc",
                    // borderRadius: 8,
                    marginBottom: 8,
                  },
                  selectedTransactions.some((t) => t.id === transaction.id) &&
                    styles.selectedTransactionSection,
                  transaction.status !== "In_Progress" && {
                    opacity: 0.5,
                  },
                ]}
              >
                <View style={styles.transactionInfo}>
                  {/* date Info */}
                  <View style={styles.dateInfo}>
                    <View style={styles.dateColumn}>
                      <View>
                        <View style={styles.statusContainer}>
                          <View
                            style={[
                              styles.statusDot,
                              {
                                backgroundColor: getStatusColor(
                                  transaction.status
                                ),
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
                      <Text style={styles.dateLabel}>Thời gian hẹn:</Text>
                      <Text style={styles.dateValue}>
                        {formatDate(transaction.appointmentDate)}
                      </Text>
                      <Text style={styles.verifiedText}>
                        {transaction.isVerifiedTransaction && "Đã xác thực"}
                      </Text>
                    </View>
                  </View>

                  {/* Item images */}
                  <View style={styles.productsCard}>
                    <View key={transaction.charitarianItem.itemId}>
                      <Image
                        source={{
                          uri: transaction.charitarianItem.itemImages[0],
                        }}
                        style={styles.productImage}
                      />
                      <Text style={styles.productName} numberOfLines={2}>
                        {transaction.charitarianItem.itemName}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {/* Action */}
            <>
              {/* Action */}
              {transactionMapping.canApprove && (
                <>
                  {!transactionMapping.isVerifiedTransaction && (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.verifyButton,
                          {
                            opacity: !transactionMapping.arrivedAtDestination
                              ? 0.5
                              : 1,
                          },
                        ]}
                        disabled={!transactionMapping.arrivedAtDestination}
                        onPress={() => {
                          handleGenerateQRCode(
                            transactionMapping.transactionItems
                          );
                        }}
                      >
                        <Text style={styles.verifyButtonText}>
                          Xem mã định danh
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.detailsButton}
                        onPress={() => {
                          const sourceLocation: LocationMap = {
                            latitude: parseFloat("10.844026"),
                            longitude: parseFloat("106.806416"),
                          };
                          const destinationLocation: LocationMap = {
                            latitude: parseFloat(addressCoordinates.latitude),
                            longitude: parseFloat(addressCoordinates.longitude),
                          };
                          setShowMapModal(true);
                          setLocation(sourceLocation);
                          setDestinationLocation(destinationLocation);

                          //Lọc các giao dịch In_Progress
                          const inProgressTransactions =
                            transactionMapping.transactionItems.filter(
                              (tx) => tx.status === "In_Progress"
                            );
                          inProgressTransactions.map(
                            (inProgressTransactions) => {
                              console.log(inProgressTransactions.id);
                            }
                          );
                          setSelectedTransactions(inProgressTransactions);
                        }}
                      >
                        <View style={styles.detailsButtonContent}>
                          <Icon name="map" size={20} color={Colors.orange500} />
                          <Text style={styles.detailsButtonText}>
                            Xem địa chỉ
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => {
                      console.log("Gọi điện");
                    }}
                  >
                    <View style={styles.detailsButtonContent}>
                      <Icon name="phone" size={20} color={Colors.orange500} />
                      <Text style={styles.detailsButtonText}>Gọi điện</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.topButtonRow}>
                    <TouchableOpacity
                      style={[
                        styles.confirmTransactionButton,
                        {
                          backgroundColor: Colors.lightGreen,
                          alignItems: "center",
                        },
                      ]}
                      onPress={() => {
                        handleOpenActionModal(transactionMapping, "confirm");
                      }}
                    >
                      <Text style={styles.verifyButtonText}>Xác nhận</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </>
          </View>
        ))}

        {/* tới giờ thì mới hiện, nên KHÔNG có dấu ! nha */}
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

            {isLoadingQRCode ? (
              <ActivityIndicator size="large" color="#0000ff" /> // Hiển thị loading khi đang tải
            ) : qrCodeBase64 ? (
              <View style={styles.idContainer}>
                <Image
                  source={{ uri: qrCodeBase64 }}
                  style={{ width: 220, height: 220 }}
                />
              </View>
            ) : (
              <Text style={{ color: "red", textAlign: "center" }}>
                Lỗi tải mã QR
              </Text>
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
                  }}
                >
                  <Text style={styles.cancleButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.verifyButton]}
                  onPress={() => {
                    if (selectedTransactionMapping) {
                      handleVerification(selectedTransactionMapping);
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

      <MapModal
        open={showMapModal}
        onClose={setShowMapModal}
        sourceLocation={location}
        destinationLocation={destinationLocation}
        transactions={selectedTransactions}
        type="Campaign"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
    marginBottom: 8,
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
  productsCard: {
    flexDirection: "column",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 8,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    textAlign: "center",
    margin: "auto",
    marginBottom: 8,
  },
  productName: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    margin: "auto",
    color: "#333",
  },
  ownerName: {
    fontSize: 10,
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
    padding: 12,
    borderRadius: 8,
  },
  dateColumn: {
    flexDirection: "column",
    justifyContent: "space-between",
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
  verifiedText: {
    color: Colors.lightGreen,
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
  confirmTransactionButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1, // For top row buttons
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
    marginTop: 16,
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
  taskInformation: {
    backgroundColor: "white",
    padding: 16,
    flexDirection: "column",
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.orange500,
    marginBottom: 16,
  },
  transactionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedTransactionSection: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.orange500,
  },
  selectAllButton: {
    width: "40%",
    padding: 12,
    backgroundColor: Colors.orange300,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectAllButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default VolunteerTaskDetail;
