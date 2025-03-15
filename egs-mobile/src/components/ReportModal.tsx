import Colors from "@/src/constants/Colors";
import { TransactionReportType } from "@/src/shared/type";
import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import axiosInstance from "../api/axiosInstance";
import Icon from "react-native-vector-icons/MaterialIcons";

interface ReportReason {
  id: string;
  reason: string;
  point: number;
  status: string;
  parentId: string | null;
}

interface ReportReasonDetail extends ReportReason {
  subReportReasons: ReportReason[];
}

interface UserReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (reportData: TransactionReportType) => void;
  userTransactionToRate: {
    userId: string;
    userName: string;
    transactionId: string;
  };
}

const UserReportModal: React.FC<UserReportModalProps> = ({
  isVisible,
  onClose,
  onSubmit,
  userTransactionToRate,
}) => {
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<ReportReason[]>([]);
  const [currentSubReasons, setCurrentSubReasons] = useState<ReportReason[]>(
    []
  );
  const [additionalComment, setAdditionalComment] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(100));
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const subReasonsRef = useRef<View>(null);
  const commentSectionRef = useRef<View>(null);
  const [reasonsHistory, setReasonsHistory] = useState<ReportReason[][]>([]);

  const fetchReportReasonDetail = async (reasonId: string) => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get(`reportreason/${reasonId}`);
      const subReasons = res.data.data.subReportReasons || [];
      // Lưu lại state hiện tại vào history trước khi cập nhật
      if (currentSubReasons.length > 0) {
        setReasonsHistory((prev) => [...prev, currentSubReasons]);
      }
      setCurrentSubReasons(subReasons);
      return subReasons;
    } catch (error) {
      console.error("Failed to fetch report reason detail:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get("reportreason");
        setReasons(res.data.data);
      } catch (error) {
        console.error("Failed to fetch report reasons:", error);
      }
    };

    fetchData();

    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true)
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          speed: 12,
          bounciness: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const scrollToRef = (ref: React.RefObject<View>) => {
    ref.current?.measure((fx, fy, width, height, px, py) => {
      scrollViewRef.current?.scrollTo({
        y: py,
        animated: true,
      });
    });
  };

  const handleRatingSubmit = () => {
    if (selectedReasons.length === 0) return;

    Keyboard.dismiss();
    const data = {
      reasons: [
        ...selectedReasons.map((reason) => reason.id),
        additionalComment.trim(),
      ].filter(Boolean),
      reportedId: userTransactionToRate.userId,
      transactionId: userTransactionToRate.transactionId,
    };

    onSubmit(data);
    resetForm();
    onClose();
  };

  const handleBack = () => {
    if (selectedReasons.length === 0) {
      return;
    }

    // Lấy ra state reasons trước đó
    const previousReasons =
      reasonsHistory[reasonsHistory.length - 1] || reasons;
    const newHistory = reasonsHistory.slice(0, -1);

    // Cập nhật selected reasons
    const newSelectedReasons = selectedReasons.slice(0, -1);

    setSelectedReasons(newSelectedReasons);
    setCurrentSubReasons(previousReasons);
    setReasonsHistory(newHistory);
  };

  const handleReasonSelect = async (reason: ReportReason) => {
    const subReasons = await fetchReportReasonDetail(reason.id);

    // Thêm reason đã chọn vào mảng
    const newSelectedReasons = [...selectedReasons, reason];
    setSelectedReasons(newSelectedReasons);

    // Nếu có sub-reasons, hiển thị chúng để chọn tiếp
    if (subReasons.length > 0) {
      setTimeout(() => scrollToRef(subReasonsRef), 100);
    } else {
      // Nếu không còn sub-reasons, cho phép gửi báo cáo
      setTimeout(() => scrollToRef(commentSectionRef), 100);
    }
  };

  const resetForm = () => {
    setSelectedReasons([]);
    setCurrentSubReasons([]);
    setReasonsHistory([]);
    setAdditionalComment("");
  };

  const handleClose = () => {
    Keyboard.dismiss();
    resetForm();
    onClose();
  };

  const isSubmitEnabled =
    selectedReasons.length > 0 && currentSubReasons.length === 0;

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            onPress={handleClose}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.centeredView,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.modalView,
              isKeyboardVisible && styles.modalViewWithKeyboard,
            ]}
          >
            <View style={styles.header}>
              {selectedReasons.length > 0 ? (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                >
                  <Icon name="arrow-back" size={24} color={Colors.gray500} />
                </TouchableOpacity>
              ) : (
                <View style={styles.backButtonPlaceholder} />
              )}

              <Text style={styles.modalTitle}>
                Báo cáo {userTransactionToRate.userName}
              </Text>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Icon name="close" size={24} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            <ScrollView ref={scrollViewRef} style={styles.scrollView}>
              {/* Initial reasons */}
              {selectedReasons.length === 0 && (
                <>
                  <Text style={styles.sectionTitle}>Chọn lý do</Text>
                  {reasons.map((reason) => (
                    <TouchableOpacity
                      key={reason.id}
                      style={styles.reasonButton}
                      onPress={() => handleReasonSelect(reason)}
                      disabled={isLoading}
                    >
                      <Text style={styles.reasonText}>{reason.reason}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Selected reasons chain */}
              {selectedReasons.map((reason, index) => (
                <View key={reason.id}>
                  <Text style={styles.sectionTitle}>
                    {index === 0 ? "Lý do đã chọn:" : "Chi tiết:"}
                  </Text>
                  <View style={styles.selectedReasonButton}>
                    <Text style={styles.selectedReasonText}>
                      {reason.reason}
                    </Text>
                  </View>
                </View>
              ))}

              {/* Current sub-reasons */}
              {currentSubReasons.length > 0 && (
                <View ref={subReasonsRef}>
                  <Text style={styles.sectionTitle}>Chọn chi tiết</Text>
                  {currentSubReasons.map((subReason) => (
                    <TouchableOpacity
                      key={subReason.id}
                      style={styles.reasonButton}
                      onPress={() => handleReasonSelect(subReason)}
                      disabled={isLoading}
                    >
                      <Text style={styles.reasonText}>{subReason.reason}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Comment section */}
              {currentSubReasons.length === 0 && selectedReasons.length > 0 && (
                <View ref={commentSectionRef}>
                  <Text style={styles.sectionTitle}>
                    Thông tin bổ sung (không bắt buộc)
                  </Text>
                  <TextInput
                    style={styles.commentInput}
                    placeholderTextColor="#8E8E93"
                    placeholder="Nhập thêm chi tiết về vấn đề bạn gặp phải..."
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    value={additionalComment}
                    onChangeText={setAdditionalComment}
                  />
                  <Text style={styles.characterCount}>
                    {additionalComment.length}/500 ký tự
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
              >
                <Text style={styles.cancelButtonText}>Huỷ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  !isSubmitEnabled && styles.disabledButton,
                ]}
                onPress={handleRatingSubmit}
                disabled={!isSubmitEnabled}
              >
                <Text
                  style={[
                    styles.submitButtonText,
                    !isSubmitEnabled && styles.disabledButtonText,
                  ]}
                >
                  Gửi báo cáo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdropTouchable: {
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalView: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: "90%",
  },
  modalViewWithKeyboard: {
    paddingBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#8E8E93",
    fontWeight: "400",
  },
  scrollView: {
    maxHeight: "70%",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 20,
    marginBottom: 12,
  },
  reasonButton: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedReasonButton: {
    backgroundColor: "#FFF8F0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.orange500,
  },
  reasonText: {
    fontSize: 16,
    color: "#1C1C1E",
  },
  selectedReasonText: {
    color: Colors.orange500,
    fontWeight: "600",
  },
  commentInput: {
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    padding: 16,
    textAlignVertical: "top",
    width: "100%",
    marginBottom: 8,
    minHeight: 120,
    fontSize: 16,
    color: "#1C1C1E",
  },
  characterCount: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "right",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#FFE5E5",
  },
  submitButton: {
    backgroundColor: Colors.orange500,
  },
  disabledButton: {
    backgroundColor: "#F2F2F7",
  },
  cancelButtonText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButtonText: {
    color: "#8E8E93",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.orange500,
    fontWeight: "600",
  },
  backButtonPlaceholder: {
    width: 80, // Tương đương với không gian của nút back
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1C1E",
    flex: 1,
    textAlign: "center",
  },
});

export default UserReportModal;
