import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  BackHandler,
  ScrollView,
} from "react-native";
import Spacing from "@/src/constants/Spacing";
import FontSize from "@/src/constants/FontSize";
import Colors from "@/src/constants/Colors";
import Font from "@/src/constants/Font";
import { Ionicons } from "@expo/vector-icons";
import AppTextInput from "@/src/components/AppTextInput";
import { useNavigation } from "@/src/hooks/useNavigation";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "@/src/stores/authStore";
import axiosInstance from "@/src/api/axiosInstance";
import { User } from "@/src/shared/type";
import { useNotificationStore } from "@/src/stores/notificationStore";
import { useProximityStore } from "@/src/stores/proximityStore";

const LoginScreen: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [isVolunteer, setIsVolunteer] = useState(false);
  const navigation = useNavigation();

  const { disconnectSignalR } = useNotificationStore();
  const { isVerifyOTP, setIsVerifyOTP } = useProximityStore();

  useFocusEffect(
    React.useCallback(() => {
      if (!isVerifyOTP) {
        disconnectSignalR();
      }
      const onBackPress = () => {
        return true;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );

  const handleLogout = async () => {
    try {
      const logout = useAuthStore.getState().logout;
      useNotificationStore.getState().setNotifications([]);
      await logout();
      navigation.goBack();
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  };

  const handleLogin = async () => {
    if (isVolunteer) {
      const response = await axiosInstance.post(
        "/authentication/account/login",
        {
          username: username,
          password: password,
        }
      );

      if (!response.data.isSuccess) {
        throw new Error(response.data.message);
      }

      const { token, refreshToken, userId, email, role, profileURL, fullname } =
        response.data.data;

      const user: User = {
        id: userId,
        fullname,
        username,
        role,
        phone: phoneNumber,
        email: email,
        profilePicture: profileURL || "",
        address: {
          addressId: "",
          address: "",
          addressCoordinates: {
            latitude: "",
            longitude: "",
          },
          isDefault: false,
        },
        dob: null,
        gender: null,
      };

      const login = useAuthStore.getState().login;
      await login({
        accessToken: token,
        refreshToken: refreshToken,
        email: user.email || "",
        userId: user.id,
        userRole: user.role,
        user: user,
        fullname: user.fullname,
      });
      setIsVerifyOTP(true);

      navigation.navigate("Main", {
        screen: "Home",
      });
    } else {
      if (!phoneNumber) {
        Alert.alert("Error", "Please fill in your phone number");
        return;
      }

      setLoading(true);
      try {
        const response = await axiosInstance.post("/authentication/login", {
          phone: phoneNumber,
        });

        if (!response.data.isSuccess) {
          throw new Error(response.data.message);
        }

        const {
          token,
          refreshToken,
          userId,
          username,
          email,
          role,
          profileURL,
          fullname,
        } = response.data.data;

        const user: User = {
          id: userId,
          username,
          role,
          fullname,
          phone: phoneNumber,
          email: email,
          profilePicture: profileURL || "",
          address: {
            addressId: "",
            address: "",
            addressCoordinates: {
              latitude: "",
              longitude: "",
            },
            isDefault: false,
          },
          dob: null,
          gender: null,
        };

        // Chỉ navigate khi toàn bộ xử lý thành công
        navigation.navigate("OTPScreen", { user, token, refreshToken });
      } catch (error: any) {
        Alert.alert(
          "Login Error",
          error.response?.data?.message || "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoBack = () => {
    try {
      handleLogout();
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  return (
    <ScrollView>
      <TouchableOpacity
        onPress={handleGoBack}
        style={{
          position: "absolute",
          left: Spacing * 2,
          top: Spacing * 6,
          zIndex: 1,
        }}
      >
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
      </TouchableOpacity>
      <View style={{ padding: Spacing * 2 }}>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>
            Chào mừng bạn trở lại, hãy nhập thông tin để tiếp tục
          </Text>
        </View>

        {isVolunteer ? (
          <>
            <View style={{ marginVertical: Spacing * 1 }}>
              <AppTextInput
                placeholder="Tài khoản đăng nhập"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={{ marginVertical: Spacing * 1 }}>
              <AppTextInput
                placeholder="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </>
        ) : (
          <>
            <View style={{ marginVertical: Spacing * 3 }}>
              <AppTextInput
                placeholder="Số điện thoại"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.signInButton}
          disabled={loading}
          onPress={handleLogin}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.signInText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        {isVolunteer ? (
          <>
            <View style={{ marginVertical: Spacing * 1 }}>
              <TouchableOpacity
                onPress={() => setIsVolunteer(false)}
                style={{ padding: Spacing }}
              >
                <Text style={styles.createAccountText}>
                  Tôi không phải tình nguyện viên
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => navigation.navigate("RegisterScreen")}
              style={{ padding: Spacing }}
            >
              <Text style={styles.createAccountText}>Tạo tài khoản mới</Text>
            </TouchableOpacity>
            <View style={{ marginVertical: Spacing * 3 }}>
              <Text style={styles.orContinueText}>Hoặc</Text>
              <TouchableOpacity
                onPress={() => setIsVolunteer(true)}
                style={{ padding: Spacing }}
              >
                <Text style={styles.createAccountText}>
                  Đăng nhập tình nguyện viên
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: FontSize.xLarge,
    color: Colors.orange600,
    fontFamily: Font["poppins-bold"],
    marginVertical: Spacing * 3,
  },
  subtitle: {
    fontFamily: Font["poppins-semiBold"],
    fontSize: FontSize.large,
    maxWidth: "60%",
    textAlign: "center",
  },
  forgotPassword: {
    fontFamily: Font["poppins-semiBold"],
    fontSize: FontSize.small,
    color: Colors.orange600,
    alignSelf: "flex-end",
  },
  signInButton: {
    padding: Spacing * 2,
    backgroundColor: Colors.orange600,
    marginVertical: Spacing * 3,
    borderRadius: Spacing,
    shadowColor: Colors.orange600,
    shadowOffset: { width: 0, height: Spacing },
    shadowOpacity: 0.3,
    shadowRadius: Spacing,
  },
  signInText: {
    fontFamily: Font["poppins-bold"],
    color: Colors.onPrimary,
    textAlign: "center",
    fontSize: FontSize.large,
  },
  createAccountText: {
    fontFamily: Font["poppins-semiBold"],
    color: Colors.text,
    textAlign: "center",
    fontSize: FontSize.small,
  },
  orContinueText: {
    fontFamily: Font["poppins-semiBold"],
    color: Colors.orange600,
    textAlign: "center",
    fontSize: FontSize.small,
  },
  socialIconsContainer: {
    marginTop: Spacing,
    flexDirection: "row",
    justifyContent: "center",
  },
  socialIcon: {
    padding: Spacing,
    backgroundColor: Colors.gray,
    borderRadius: Spacing / 2,
    marginHorizontal: Spacing,
  },
});

export default LoginScreen;
