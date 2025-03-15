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
  FlatList,
} from "react-native";

interface ReportReason {
  id: string;
  title: string;
  subReasons: {
    id: string;
    title: string;
  }[];
}

// Danh sách lý do báo cáo mẫu
const REPORT_REASONS: ReportReason[] = [
  {
    id: '1',
    title: 'Lừa đảo',
    subReasons: [
      { id: '1-1', title: 'Không giao hàng sau khi thanh toán' },
      { id: '1-2', title: 'Giao sai hàng' },
      { id: '1-3', title: 'Hàng giả, hàng nhái' },
    ]
  },
  {
    id: '2',
    title: 'Hành vi không phù hợp',
    subReasons: [
      { id: '2-1', title: 'Ngôn ngữ thiếu tôn trọng' },
      { id: '2-2', title: 'Quấy rối' },
      { id: '2-3', title: 'Spam tin nhắn' },
    ]
  },
  {
    id: '3',
    title: 'Vấn đề kỹ thuật',
    subReasons: [
      { id: '3-1', title: 'Lỗi thanh toán' },
      { id: '3-2', title: 'Không thể nhắn tin' },
      { id: '3-3', title: 'Lỗi hiển thị thông tin' },
    ]
  },
];

interface UserReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmitRating: (reportData: TransactionReportType) => void;
  userTransactionToRate: {
    userId: string;
    userName: string;
    transactionId: string;
  };
}

const UserReportModal: React.FC<UserReportModalProps> = ({
  isVisible,
  onClose,
  onSubmitRating,
  userTransactionToRate,
}) => {
  const [selectedMainReason, setSelectedMainReason] = useState<ReportReason | null>(null);
  const [selectedSubReason, setSelectedSubReason] = useState<string>("");
  const [additionalComment, setAdditionalComment] = useState("");
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(100));
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
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

  const handleMainReasonSelect = (reason: ReportReason) => {
    setSelectedMainReason(reason);
    setSelectedSubReason("");
    // Scroll to sub-reasons section
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 200, animated: true });
    }, 100);
  };

  const handleSubReasonSelect = (reasonId: string) => {
    setSelectedSubReason(reasonId);
    // Scroll to comment section
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 400, animated: true });
    }, 100);
  };

  const handleRatingSubmit = () => {
    if (!selectedMainReason || !selectedSubReason) return;
    
    Keyboard.dismiss();
    const selectedSubReasonTitle = selectedMainReason.subReasons.find(
      sr => sr.id === selectedSubReason
    )?.title || '';
    
    const data = {
      reasons: [
        selectedMainReason.title,
        selectedSubReasonTitle,
        additionalComment.trim()
      ].filter(Boolean),
      reportedId: userTransactionToRate.userId,
      transactionId: userTransactionToRate.transactionId,
    };
    
    onSubmitRating(data);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedMainReason(null);
    setSelectedSubReason("");
    setAdditionalComment("");
  };

  const handleClose = () => {
    Keyboard.dismiss();
    resetForm();
    onClose();
  };

  const isSubmitEnabled = selectedMainReason && selectedSubReason;

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
        <Animated.View 
          style={[
            styles.backdrop,
            { opacity: fadeAnim },
          ]}
        >
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
          <View style={[
            styles.modalView,
            isKeyboardVisible && styles.modalViewWithKeyboard
          ]}>
            <View style={styles.header}>
              <Text style={styles.modalTitle}>
                Báo cáo {userTransactionToRate.userName}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView ref={scrollViewRef} style={styles.scrollView}>
              {/* Main Reasons Section */}
              <Text style={styles.sectionTitle}>Chọn lý do chính</Text>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.reasonButton,
                    selectedMainReason?.id === reason.id && styles.selectedReasonButton
                  ]}
                  onPress={() => handleMainReasonSelect(reason)}
                >
                  <Text style={[
                    styles.reasonText,
                    selectedMainReason?.id === reason.id && styles.selectedReasonText
                  ]}>
                    {reason.title}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Sub Reasons Section */}
              {selectedMainReason && (
                <>
                  <Text style={styles.sectionTitle}>Chọn lý do chi tiết</Text>
                  {selectedMainReason.subReasons.map((subReason) => (
                    <TouchableOpacity
                      key={subReason.id}
                      style={[
                        styles.reasonButton,
                        selectedSubReason === subReason.id && styles.selectedReasonButton
                      ]}
                      onPress={() => handleSubReasonSelect(subReason.id)}
                    >
                      <Text style={[
                        styles.reasonText,
                        selectedSubReason === subReason.id && styles.selectedReasonText
                      ]}>
                        {subReason.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Additional Comments Section */}
              {selectedSubReason && (
                <>
                  <Text style={styles.sectionTitle}>Thông tin bổ sung (không bắt buộc)</Text>
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
                </>
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
                <Text style={[
                  styles.submitButtonText,
                  !isSubmitEnabled && styles.disabledButtonText
                ]}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    maxHeight: '90%',
  },
  modalViewWithKeyboard: {
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1C1E",
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
    maxHeight: '70%',
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
    borderColor: 'transparent',
  },
  selectedReasonButton: {
    backgroundColor: '#FFF8F0',
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
});

export default UserReportModal;