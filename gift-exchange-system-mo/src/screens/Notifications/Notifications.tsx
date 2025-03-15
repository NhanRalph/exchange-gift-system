import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Notification,
  NotificationData,
  useNotificationStore,
} from "@/src/stores/notificationStore";
import axiosInstance from "@/src/api/axiosInstance";
import { useAuthCheck } from "@/src/hooks/useAuth";
import { useNavigation } from "@/src/hooks/useNavigation";
import { Alert } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Checkbox from "expo-checkbox";
import Toast from "react-native-toast-message";
import Colors from "@/src/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import TimeNow from "@/src/components/TimeNow/TimeNow";

import Constants from "expo-constants";
const API_DELETE_ALL_NOTIFICATION = (Constants.expoConfig as any).extra.API_DELETE_ALL_NOTIFICATION;
const API_DELETE_ONE_NOTIFICATION = (Constants.expoConfig as any).extra.API_DELETE_ONE_NOTIFICATION;
const API_GET_ALL_NOTIFICATION = (Constants.expoConfig as any).extra.API_GET_ALL_NOTIFICATION;

export default function NotificationsScreen() {
  const { notifications, setNotifications } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const PAGE_SIZE = 10;

  const { isAuthenticated } = useAuthCheck();
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsSelectionMode(false);
        setSelectedItems([]);
      };
    }, [])
  );

  const handleAuthenticatedNavigation = () => {
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
  };

  const handleDeleteSingle = async (notificationId: string) => {
    try {
      const response = await axiosInstance.put(
        `${API_DELETE_ONE_NOTIFICATION}/${notificationId}`
      );
      if (response.data.isSuccess) {
        setNotifications(notifications.filter((n) => n.id !== notificationId));
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Đã xóa thông báo",
        });
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      Alert.alert("Lỗi", "Không thể xóa thông báo");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;

    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa các thông báo đã chọn?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              if (selectedItems.length === notifications.length) {
                const response = await axiosInstance.put(
                  `${API_DELETE_ALL_NOTIFICATION}`
                );
                if (response.data.isSuccess) {
                  setNotifications([]);
                  setSelectedItems([]);
                  setIsSelectionMode(false);
                  Toast.show({
                    type: "success",
                    text1: "Thành công",
                    text2: `Đã xóa ${selectedItems.length} thông báo`,
                  });
                }
              } else {
                for (const id of selectedItems) {
                  await handleDeleteSingle(id);
                }
                setSelectedItems([]);
                setIsSelectionMode(false);
                Toast.show({
                  type: "success",
                  text1: "Thành công",
                  text2: `Đã xóa ${selectedItems.length} thông báo`,
                });
              }
            } catch (error) {
              console.error("Error deleting notifications:", error);
              Alert.alert("Lỗi", "Không thể xóa thông báo");
            }
          },
        },
      ]
    );
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fadeIn = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const fetchNotifications = async (page: number) => {
    try {
      if (!isAuthenticated) {
        handleAuthenticatedNavigation();
        return;
      }
      setError(null);
      const response = await axiosInstance.get(
        `${API_GET_ALL_NOTIFICATION}?pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
      );
      if (response.data.isSuccess) {
        const { data, totalItems } = response.data.data;

        console.log("data", data);

        if (page === 1) {
          setNotifications(data);
        } else {
          setNotifications([...notifications, ...(data as Notification[])]);
        }

        setTotalPages(Math.ceil(totalItems / PAGE_SIZE));
        fadeIn();
      } else {
        console.log("Error fetching notifications:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(1);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!isLoading && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      fetchNotifications(currentPage + 1);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await axiosInstance.put(`notification/mark-as-read/${notificationId}`);
      setNotifications(
        notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";

      const now = new Date();
      const diffInSeconds = Math.abs(
        Math.floor((now.getTime() - date.getTime()) / 1000)
      );

      if (diffInSeconds < 60) return "Vừa xong";
      if (diffInSeconds < 3600)
        return `${Math.floor(diffInSeconds / 60)} phút trước`;
      if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
      if (diffInSeconds < 604800)
        return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const handlePressNotification = async (notification: Notification) => {
    console.log("noti", notification)
    if (!notification.read && notification.id) {
      markAsRead(notification.id);
    }

    if (typeof notification.data === "string") {
      try {
        const parsedNotification = JSON.parse(notification.data);
        const notificationObj: NotificationData = {
          title: parsedNotification.title,
          type: parsedNotification.type,
          message: parsedNotification.message,
          entity: parsedNotification.entity,
          entityId: parsedNotification.entityId,
        };

        switch (notificationObj.entity) {
          case "Item":
            navigation.navigate("ProductDetail", {
              productId: notificationObj.entityId,
            });
            break;
          case "Request":
            navigation.navigate("RequestDetail", {
              requestId: notificationObj.entityId,
            });
            break;
          case "Transaction":
            navigation.navigate("MyTransactions", {
              requestId: notificationObj.entityId,
            });
            break;
          case "Campaign":
            navigation.navigate("CampaignDetail", {
              campaignId: notificationObj.entityId,
            });
            break;
        }
      } catch (error) {
        console.error("Error parsing notification data:", error);
      }
    }
  };

  const renderNotification = ({
    notification,
    onPress,
    isSelectionMode,
    isSelected,
    onSelect,
  }: {
    notification: Notification;
    onPress: () => void;
    isSelectionMode: boolean;
    isSelected: boolean;
    onSelect: () => void;
  }) => {
    const parsedData = JSON.parse(notification.data);

    return (
      <TouchableOpacity
        onPress={onPress}
        style={enhancedStyles.notificationContent}
      >
        <View style={enhancedStyles.header}>
          {isSelectionMode && (
            <Checkbox
              value={isSelected}
              onValueChange={onSelect}
              style={{ marginRight: 10 }}
              color={isSelected ? "#007AFF" : "#666"}
            />
          )}
          <View style={enhancedStyles.titleContainer}>
            <Text style={enhancedStyles.title}>{parsedData.title}</Text>
            <View style={enhancedStyles.metadata}>
              <Text style={enhancedStyles.time}>
                {formatDate(notification.createdAt.toString())}
              </Text>
            </View>
          </View>
          {!notification.read && <View style={styles.unreadIndicator} />}
        </View>

        <Text style={enhancedStyles.message}>{parsedData.message}</Text>

        <View style={enhancedStyles.footer}>
          <View style={enhancedStyles.entityInfo}>
            <Ionicons
              name={
                parsedData.entity === "Item"
                  ? "cube-outline"
                  : parsedData.entity === "Request"
                  ? "document-text-outline"
                  : "card-outline"
              }
              size={16}
              color="#666"
            />
            <Text style={enhancedStyles.entityText}>
              {/* {parsedData.entity} #{parsedData.entityId.slice(-6)} */}
            </Text>
          </View>
          <View
            style={[
              enhancedStyles.statusTag,
              {
                backgroundColor: notification.read ? "#E9ECEF" : "#E3F2FD",
                opacity: notification.read ? 0.8 : 1,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 12,
                color: notification.read ? "#6C757D" : "#1565C0",
              }}
            >
              {notification.read ? "Đã đọc" : "Chưa đọc"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.orange500} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchNotifications(1)}
        >
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#007AFF"
        />
      }
      onScroll={({ nativeEvent }) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        const isCloseToBottom =
          layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

        if (isCloseToBottom) {
          loadMore();
        }
      }}
      scrollEventThrottle={400}
    >
      <View style={styles.notificationContainer}>
        <TimeNow />
        <View style={styles.header}>
          <Text style={styles.title}>Thông báo</Text>
          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={() => setIsSelectionMode(!isSelectionMode)}
              style={styles.selectButton}
            >
              <Text style={styles.selectButtonText}>
                {isSelectionMode ? "Hủy" : "Chọn"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isSelectionMode && notifications.length > 0 && (
          <View style={styles.selectionHeader}>
            <View style={styles.selectionActions}>
              <TouchableOpacity
                style={styles.selectAllButton}
                onPress={() => {
                  if (selectedItems.length === notifications.length) {
                    setSelectedItems([]);
                  } else {
                    setSelectedItems(
                      notifications.map((n) => n.id || "").filter(Boolean)
                    );
                  }
                }}
              >
                <Text style={styles.selectAllText}>
                  {selectedItems.length === notifications.length
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </Text>
              </TouchableOpacity>

              {selectedItems.length > 0 && (
                <TouchableOpacity
                  style={styles.deleteSelectedButton}
                  onPress={handleDeleteSelected}
                >
                  <Text style={styles.deleteSelectedText}>
                    Xóa ({selectedItems.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.selectionCount}>
              Đã chọn: {selectedItems.length}/{notifications.length}
            </Text>
          </View>
        )}

        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có thông báo nào hết</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <View
              key={notification.id || `temp-${Date.now()}-${Math.random()}`}
            >
              {renderNotification({
                notification: notification,
                onPress: () => handlePressNotification(notification),
                isSelectionMode: isSelectionMode,
                isSelected: selectedItems.includes(notification.id),
                onSelect: () => {
                  if (selectedItems.includes(notification.id)) {
                    setSelectedItems(
                      selectedItems.filter((id) => id !== notification.id)
                    );
                  } else {
                    setSelectedItems([...selectedItems, notification.id]);
                  }
                },
              })}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const enhancedStyles = StyleSheet.create({
  notificationContent: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  metadata: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  time: {
    fontSize: 12,
    color: "#666",
  },
  message: {
    fontSize: 15,
    color: "#1A1A1A",
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  entityInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  entityText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  notificationContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1A1A1A",
  },
  notification: {
    marginBottom: 12,
  },
  notificationContent: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadNotification: {
    backgroundColor: "#F0F7FF",
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#666",
  },
  notificationText: {
    fontSize: 15,
    color: "#1A1A1A",
    lineHeight: 20,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
  tapToMark: {
    fontSize: 12,
    color: "#007AFF",
    marginTop: 8,
    textAlign: "right",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: Colors.lightRed,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  selectButton: {
    padding: 8,
  },
  selectButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  deleteAction: {
    backgroundColor: Colors.lightRed,
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  deleteActionText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  checkboxContainer: {
    marginRight: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
  },
  selectionHeader: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  selectionActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#E9ECEF",
  },
  selectAllText: {
    color: "#495057",
    fontWeight: "600",
    fontSize: 14,
  },
  deleteSelectedButton: {
    backgroundColor: Colors.lightRed,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  deleteSelectedText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  selectionCount: {
    fontSize: 12,
    color: "#6C757D",
    textAlign: "right",
  },
});
