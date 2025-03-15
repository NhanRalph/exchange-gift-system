import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Avatar, Text } from "react-native-paper";
import axiosInstance from "@/api/axiosInstance";
import { useNavigation } from "@/hooks/useNavigation";
import Icon from "react-native-vector-icons/Ionicons";
import Colors from "@/src/constants/Colors";
import { useAuthCheck } from "@/src/hooks/useAuth";
import { Alert } from "react-native";
import { RootStackParamList } from "@/src/layouts/types/navigationTypes";
import { useAuthStore } from "@/src/stores/authStore";
import { useNotificationStore } from "@/src/stores/notificationStore";
import { useProximityStore } from "@/src/stores/proximityStore";
import { useFocusEffect } from "@react-navigation/native";
import TimeNow from "@/src/components/TimeNow/TimeNow";
import Constants from "expo-constants";
const API_GET_PROFILE = (Constants.expoConfig as any).extra.API_GET_PROFILE;

const userDataSelector = (state: ReturnType<typeof useAuthStore.getState>) =>
  state.userData;
const setUserDataSelector = (state: ReturnType<typeof useAuthStore.getState>) =>
  state.setUserData;

const ProfileScreen = () => {
  const { isAuthenticated } = useAuthCheck();
  const { userRole } = useAuthStore();
  const userData = useAuthStore(userDataSelector);
  const setUserData = useAuthStore(setUserDataSelector);
  const [loading, setLoading] = useState(false);

  const { isVerifyOTP, setIsVerifyOTP } = useProximityStore();
  const navigation = useNavigation();

  const fetchUserData = async () => {
    if (!isAuthenticated && !isVerifyOTP) {
      setUserData(null);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get(`${API_GET_PROFILE}`);
      setUserData(response.data.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [isAuthenticated]);

  const logoutFunc = async () => {
    try {
      const logout = useAuthStore.getState().logout;
      useNotificationStore.getState().setNotifications([]);
      await logout();
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  };

  const handleLogout = async () => {
    try {
      logoutFunc();
      if (isVerifyOTP) {
        setIsVerifyOTP(false);
      }
      navigation.navigate("Main", {
        screen: "Home",
      });
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  };

  const handleAuthenticatedNavigation = (
    screenName: keyof RootStackParamList
  ) => {
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

    try {
      if (screenName === "VolunteerTasks") {
        navigation.navigate("VolunteerTasks");
      } else if (screenName === "MyProducts") {
        navigation.navigate("MyProducts");
      } else if (screenName === "MyRequests") {
        navigation.navigate("RequestSubAction");
      } else if (screenName === "MyTransactions") {
        navigation.navigate("MyTransactions", { requestId: "" });
      }
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert("Lỗi", "Không thể chuyển đến trang yêu cầu");
    }
  };

  const handleEditProfile = () => {
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
    navigation.navigate("ProfileDetail");
  };

  const volunteerMenuItems = [
    {
      title: "Nhiệm vụ được giao",
      icon: "document-text-outline",
      description: "Xem và quản lý các nhiệm vụ",
      onPress: () => handleAuthenticatedNavigation("VolunteerTasks"),
    },
  ];

  const menuItems = [
    {
      title: "Sản phẩm của tôi",
      icon: "cube-outline",
      description: "Quản lý các sản phẩm bạn đã đăng",
      onPress: () => handleAuthenticatedNavigation("MyProducts"),
    },
    {
      title: "Yêu cầu của tôi",
      icon: "document-text-outline",
      description: "Xem và quản lý các yêu cầu trao đổi",
      onPress: () => handleAuthenticatedNavigation("MyRequests"),
    },
    {
      title: "Giao dịch của tôi",
      icon: "sync-outline",
      description: "Lịch sử các giao dịch",
      onPress: () => handleAuthenticatedNavigation("MyTransactions"),
    },
  ];

  const getPointColor = (point: number) => {
    if (point < 50) return "#990000"; // Đỏ đậm - Rất không uy tín
    if (point < 75) return "#ff4d4d"; // Đỏ nhạt - Không uy tín
    if (point < 100) return "#e67300"; // Cam - Cần cải thiện
    if (point <= 120) return "#00e600"; // Xanh lá - Tốt
    return "#ffcc00"; // Xanh lá đậm - Rất tốt
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.orange500} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <TimeNow />
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Avatar.Image
                size={80}
                source={{ uri: userData?.profilePicture }}
                style={styles.avatar}
              />
              {isAuthenticated && (
                <TouchableOpacity
                  style={styles.editAvatarButton}
                  onPress={handleEditProfile}
                >
                  <Icon
                    name="pencil-outline"
                    size={16}
                    color={Colors.orange500}
                  />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {userData?.fullname || "Khách"}
              </Text>
              {userData?.phone && (
                <View style={styles.contactRow}>
                  <Icon name="call-outline" size={16} color={Colors.gray600} />
                  <Text style={styles.contactText}>{userData.phone}</Text>
                </View>
              )}
              {userData?.email && (
                <View style={styles.contactRow}>
                  <Icon name="mail-outline" size={16} color={Colors.gray600} />
                  <Text style={styles.contactText}>{userData.email}</Text>
                </View>
              )}
              {userData?.point && (
                <View style={styles.contactRow}>
                  <Icon
                    name="leaf-outline"
                    size={16}
                    color={getPointColor(userData?.point || 0)}
                  />

                  <Text
                    style={[
                      styles.contactText,
                      { color: getPointColor(userData?.point || 0) },
                    ]}
                  >
                    {userData?.point || 0} Điểm
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          {userRole === "Volunteer" ? (
            <>
              {volunteerMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemContent}>
                    <View style={styles.menuItemIcon}>
                      <Icon
                        name={item.icon}
                        size={20}
                        color={Colors.orange500}
                      />
                    </View>
                    <View style={styles.menuItemText}>
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                      <Text style={styles.menuItemDescription}>
                        {item.description}
                      </Text>
                    </View>
                    <Icon
                      name="chevron-forward-outline"
                      size={20}
                      color={Colors.gray400}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </>
          ) : (
            <>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemContent}>
                    <View style={styles.menuItemIcon}>
                      <Icon
                        name={item.icon}
                        size={20}
                        color={Colors.orange500}
                      />
                    </View>
                    <View style={styles.menuItemText}>
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                      <Text style={styles.menuItemDescription}>
                        {item.description}
                      </Text>
                    </View>
                    <Icon
                      name="chevron-forward-outline"
                      size={20}
                      color={Colors.gray400}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isAuthenticated ? (
            <>
              {userRole === "User" && (
                <TouchableOpacity
                  onPress={handleEditProfile}
                  style={[styles.touchableButton, styles.editButton]}
                >
                  <Icon
                    name="pencil-outline"
                    size={14}
                    color="#fff"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Chỉnh sửa thông tin</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleLogout}
                style={[styles.touchableButton, styles.logoutButton]}
              >
                <Icon
                  name="log-out-outline"
                  size={14}
                  color={Colors.orange500}
                  style={styles.buttonIcon}
                />
                <Text style={[styles.buttonText, styles.logoutText]}>
                  Đăng xuất
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate("LoginScreen")}
              style={[styles.touchableButton, styles.loginButton]}
            >
              <Icon
                name="person-outline"
                size={20}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.buttonText}>Đăng nhập</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#fff",
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    paddingTop: 40,
  },
  profileSection: {
    flexDirection: "row",
    // marginBottom: 24,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    backgroundColor: Colors.orange50,
    // borderWidth: 3,
    borderColor: Colors.orange200,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 10,
    right: 0,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  contactText: {
    marginLeft: 8,
    color: Colors.gray600,
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.orange50,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.orange500,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.gray600,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.orange200,
    marginHorizontal: 16,
  },
  menuSection: {
    padding: 16,
    gap: 12,
  },
  menuItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemIcon: {
    backgroundColor: Colors.orange50,
    padding: 10,
    borderRadius: 12,
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 12,
    color: Colors.gray600,
  },
  actionButtons: {
    paddingHorizontal: 16,
    gap: 8,
  },
  touchableButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: Colors.orange500,
  },
  logoutButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.orange500,
  },
  logoutText: {
    color: Colors.orange500,
  },
  loginButton: {
    backgroundColor: Colors.orange500,
  },
});

export default ProfileScreen;
