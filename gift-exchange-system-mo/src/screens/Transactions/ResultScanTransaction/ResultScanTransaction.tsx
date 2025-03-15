import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useNavigation } from "@/src/hooks/useNavigation";
import { Transaction } from "@/src/shared/type";
import Colors from "@/src/constants/Colors";
import Icon from "react-native-vector-icons/MaterialIcons";
import { formatDate, formatDate_DD_MM_YYYY } from "@/src/shared/formatDate";
import { useAuthCheck } from "@/src/hooks/useAuth";
import axiosInstance from "@/src/api/axiosInstance";
import { Alert } from "react-native";
import {
  NotificationData,
  useNotificationStore,
} from "@/src/stores/notificationStore";
import Constants from "expo-constants";
const API_APPROVE_TRANSACTION = (Constants.expoConfig as any).extra.API_APPROVE_TRANSACTION;
const API_GET_OWN_TRANSACTIONS = (Constants.expoConfig as any).extra.API_GET_OWN_TRANSACTIONS;
const API_REJECT_TRANSACTION = (Constants.expoConfig as any).extra.API_REJECT_TRANSACTION;

interface Result {
  transactionId?: string;
  transactionIds?: string[];
  isOwnTransaction: boolean;
  isTransactionCampaign: boolean;
}

type RootStackParamList = {
  ResultScanTransaction: { transactionResult: Result };
};

type ResultScanTransactionRouteProp = RouteProp<
  RootStackParamList,
  "ResultScanTransaction"
>;

export default function ResultScanTransaction() {
  const route = useRoute<ResultScanTransactionRouteProp>();
  const { sendNotification } = useNotificationStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInputRejectMessage, setShowInputRejectMessage] = useState(false);
  const [rejectMessage, setRejectMessage] = useState("");
  const [selectedTransactions, setSelectedTransactions] = useState<
    Transaction[]
  >([]);

  const transactionResult = route.params.transactionResult;
  console.log("transaction result", transactionResult);
  const navigation = useNavigation();

  const userId = useAuthCheck().userData.userId;

  useEffect(() => {
    fetchTransaction();
  }, []);

  const fetchTransactionById = async (transactionId: string) => {
    try {
      const response = await axiosInstance.get(
        `${API_GET_OWN_TRANSACTIONS}/${transactionId}`
      );

      if (!response.data.data || response.data.data.length === 0) {
        setError("Không tìm thấy thông tin giao dịch");
        return;
      }

      setTransactions((prev: Transaction[]) => [
        ...prev,
        response.data.data[0],
      ]);
    } catch (error) {
      setError("Có lỗi xảy ra khi tải thông tin giao dịch");
      console.error("Error fetching transaction:", error);
    }
  };

  const fetchTransaction = async () => {
    try {
      setIsLoading(true);
      setError(null);
      let fetchPromises: Promise<void>[] = [];

      if (
        transactionResult.isTransactionCampaign &&
        transactionResult.transactionIds
      ) {
        fetchPromises = transactionResult.transactionIds.map((transactionId) =>
          fetchTransactionById(transactionId)
        );
      } else if (transactionResult.transactionId) {
        fetchPromises.push(
          fetchTransactionById(transactionResult.transactionId)
        );
      }

      await Promise.all(fetchPromises); // Đợi tất cả các giao dịch được tải xong
    } catch (error) {
      setError("Có lỗi xảy ra khi tải thông tin giao dịch");
      console.error("Error fetching transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionTitle = (transaction: Transaction) => {
    return `Giao dịch giữa ${transaction.charitarian.name} và ${transaction.requester.name}`;
  };

  const checkRole = (transaction: Transaction) => {
    if (userId === transaction.charitarian.id) {
      return "charitarian";
    } else if (userId === transaction.requester.id) {
      return "requester";
    }
    return "";
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "In_Progress":
        return "Đang diễn ra";
      case "Completed":
        return "Hoàn thành";
      case "Not_Completed":
        return "Đã hủy";
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
      default:
        return Colors.orange500;
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

  const handleVerification_v2 = async (transactions: Transaction[]) => {
    transactions.map(async (transaction) => {
      const res = await axiosInstance.put(
        `transaction/${transaction.id}/verifytransaction?status=true`
      );

      if (res.data.isSuccess === true) {
        const dataNoti: NotificationData = {
          title: "Xác thực giao dịch",
          message: "Giao dịch đã được xác thực",
          entity: "Transaction",
          entityId: transaction.requestId,
          type: "success",
        };

        sendNotification(transaction.charitarian.id, dataNoti);

        sendNotification(transaction.requester.id, dataNoti);

        setShowConfirmModal(false);

        navigation.navigate("MyTransactions", {
          requestId: transaction.requestId,
        });
      } else {
        Alert.alert(
          "Lỗi",
          "Không thể xác nhận giao dịch. Vui lòng thử lại sau."
        );
      }
    });
  };

  const handleVerification = async (transactionId: string) => {
    try {
      const data = {
        transactionId: transactionId,
        transactionImages: [],
      };
      const res = await axiosInstance.put(`${API_APPROVE_TRANSACTION}`, data);
      console.log(res.data);
      Alert.alert("Thành công", "Đã xác nhận giao dịch", [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("MyTransactions", { requestId: "" });
          },
          // navigation.navigate("MyTransactions", { requestId: requestId }),
        },
      ]);
      setShowConfirmModal(false);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể xác nhận giao dịch. Vui lòng thử lại sau.");
    }
  };

  const handleReject = async (transactions: Transaction[]) => {
    transactions.map(async (transaction) => {
      try {
        const data = {
          transactionId: transaction.id,
          message: rejectMessage,
          transactionImages: [],
        };
        await axiosInstance.put(`${API_REJECT_TRANSACTION}`, data);
        Alert.alert("Thành công", "Đã từ chối giao dịch", [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("MyTransactions", { requestId: "" });
            },
            // navigation.navigate("MyTransactions", { requestId: requestId }),
          },
        ]);
        setShowInputRejectMessage(false);
      } catch (error) {
        Alert.alert(
          "Lỗi",
          "Không thể từ chối giao dịch. Vui lòng thử lại sau."
        );
      }
    });
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
      const isSelectedAll = prevSelected.length === transactions.length;
      if (isSelectedAll) {
        return [];
      } else {
        return transactions;
      }
    });
  };

  const handleOpenVerifyModal = () => {
    if (selectedTransactions.length === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn sản phẩm");
      return;
    }
    setShowConfirmModal(true);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.orange500} />
      </View>
    );
  }

  if (!isLoading && transactions.length === 0 && !error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noDataText}>Không tìm thấy giao dịch</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="error-outline" size={48} color={Colors.lightRed} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchTransaction()}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return transactionResult.isOwnTransaction ? (
    <ScrollView style={styles.container}>
      {transactions ? (
        <>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {getTransactionTitle(transactions[0])}
              </Text>

              <Text style={styles.subTitle}>
                *Vui lòng chọn những sản phẩm sẽ giao dịch !!!
              </Text>
            </View>

            {!transactionResult.isTransactionCampaign && (
              <>
                {transactions[0].requesterItem ? (
                  <View style={styles.productsContainer}>
                    <View style={styles.productCard}>
                      <Image
                        source={{
                          uri: transactions[0].requesterItem?.itemImages[0],
                        }}
                        style={styles.productImage}
                      />
                      <Text style={styles.productName} numberOfLines={2}>
                        {transactions[0].requesterItem?.itemName}
                      </Text>
                      <Text style={styles.ownerName}>
                        {transactions[0].requester.name}
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
                          uri: transactions[0].charitarianItem.itemImages[0],
                        }}
                        style={styles.productImage}
                      />
                      <Text style={styles.productName} numberOfLines={2}>
                        {transactions[0].charitarianItem.itemName}
                      </Text>
                      <Text style={styles.ownerName}>
                        {transactions[0].charitarian.name}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.productCardAnItem}>
                    <Image
                      source={{
                        uri: transactions[0].charitarianItem.itemImages[0],
                      }}
                      style={styles.productImage}
                    />
                    <Text style={styles.productName} numberOfLines={2}>
                      {transactions[0].charitarianItem.itemName}
                    </Text>
                    <Text style={styles.ownerName}>
                      {transactions[0].charitarian.name}
                    </Text>
                  </View>
                )}
              </>
            )}

            {transactionResult.isTransactionCampaign && (
              <>
                {transactions.length > 1 && (
                  <>
                    {selectedTransactions.length < transactions.length ? (
                      <TouchableOpacity
                        style={styles.selectAllButton}
                        onPress={() => handleSelectAllTransaction(transactions)}
                      >
                        <Text style={styles.selectAllButtonText}>
                          Chọn tất cả
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.selectAllButton}
                        onPress={() => handleSelectAllTransaction(transactions)}
                      >
                        <Text style={styles.selectAllButtonText}>
                          Bỏ chọn tất cả
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {transactions.map((transaction, index) => (
                  <TouchableOpacity
                    key={transaction.id}
                    onPress={() => {
                      handlePressTransaction(transaction);
                    }}
                    disabled={transaction.status !== "In_Progress"}
                    style={[
                      styles.productCardAnItem,
                      {
                        borderTopWidth: 1,
                        borderColor: "#ccc",
                        // borderRadius: 8,
                        marginBottom: 8,
                      },
                      selectedTransactions.some(
                        (t) => t.id === transaction.id
                      ) && styles.selectedTransactionSection,
                      transaction.status !== "In_Progress" && {
                        opacity: 0.5,
                      },
                    ]}
                  >
                    <Image
                      source={{
                        uri: transaction.charitarianItem.itemImages[0],
                      }}
                      style={styles.productImage}
                    />
                    <View>
                      <Text style={styles.productName} numberOfLines={2}>
                        {transaction.charitarianItem.itemName}
                      </Text>
                      <Text style={styles.ownerName}>
                        {transaction.charitarian.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <View style={styles.warningContainer}>
              <Icon name="warning" size={20} color={Colors.orange500} />
              <Text style={styles.warningText}>
                Vui lòng kiểm tra kỹ thông tin trước khi xác nhận
              </Text>
            </View>

            <View style={styles.dateInfo}>
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Thời gian hẹn:</Text>
                <Text style={styles.dateValue}>
                  {formatDate(transactions[0].appointmentDate)}
                </Text>
              </View>
            </View>

            {transactions[0].status === "In_Progress" &&
              checkRole(transactions[0]) === "charitarian" && (
                <View style={styles.actionContainer}>
                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={() => handleOpenVerifyModal()}
                  >
                    <Text style={styles.verifyButtonText}>Xác nhận</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => setShowInputRejectMessage(true)}
                  >
                    <Text style={styles.verifyButtonText}>
                      Không phải giao dịch của tôi
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                  >
                    <Text style={styles.backButtonText}>Quay lại</Text>
                  </TouchableOpacity>
                </View>
              )}
          </View>

          <Modal
            visible={showConfirmModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowConfirmModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Xác thực giao dịch</Text>

                <Text>Đây có phải là giao dịch của bạn?</Text>

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
                      onPress={() =>
                        handleVerification_v2(selectedTransactions)
                      }
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
                      onPress={() => handleReject(transactions)}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          rejectMessage.length === 0 &&
                            styles.disabledButtonText,
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
        </>
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.noDataText}>Không tìm thấy giao dịch</Text>
        </View>
      )}
    </ScrollView>
  ) : (
    <>
      <View style={styles.centerContainer}>
        <Text style={styles.noDataText}>Giao dịch này không phải của bạn</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: {
    flex: 1,
    fontWeight: "bold",
    color: "#666",
  },
  value: {
    flex: 2,
    color: "#333",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultCount: {
    color: "#666",
    marginBottom: 16,
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
  subTitle: {
    fontSize: 14,
    fontStyle: "italic",
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
  productCardAnItem: {
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
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
  exchangeIcon: {
    fontSize: 24,
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
    marginTop: 16,
    width: "100%",
  },
  topButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
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
  backButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderColor: Colors.orange500,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  backButtonText: {
    color: Colors.orange500,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonText: {
    color: "white",
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
    borderColor: "#c4c4c4",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    width: "100%",
    marginBottom: 16,
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
  rejectMessage: {
    backgroundColor: "#ffe3e3",
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: Colors.lightRed,
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: Colors.orange500,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  warningText: {
    marginLeft: 8,
    color: Colors.orange500,
    flex: 1,
  },
  actionContainer: {
    marginTop: 20,
    gap: 12,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelModalButton: {
    backgroundColor: "#666",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
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
