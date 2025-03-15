import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Card, Text } from "react-native-paper";
import axiosInstance from "@/api/axiosInstance";
import { useNavigation } from "@/hooks/useNavigation";
import Icon from "react-native-vector-icons/MaterialIcons";
import Colors from "@/src/constants/Colors";
import { useAuthStore } from "@/src/stores/authStore";
import Constants from "expo-constants";
const API_GET_PROFILE = (Constants.expoConfig as any).extra.API_GET_PROFILE;

const setUserDataSelector = (state: ReturnType<typeof useAuthStore.getState>) =>
  state.setUserData;

const RequestSubActionScreen = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const setUserData = useAuthStore(setUserDataSelector);

  const fetchUserData = async () => {
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
  }, []);

  const handleAuthenticatedNavigation = (screenName: string) => {
    try {
      if (screenName === "MyRequestsToCampaign") {
        navigation.navigate("MyRequestsToCampaign");
      } else if (screenName === "RequestsForMe") {
        // navigation.navigate('MyRequests', { productId: '', type: 'requestsForMe' });
        navigation.navigate("CharitarianRequestItem");
      } else if (screenName === "MyRequests") {
        navigation.navigate("MyRequests", {
          productId: "",
          type: "itemRequestTo",
        });
      }
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert("Lỗi", "Không thể chuyển đến trang yêu cầu");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.orange500} />
      </View>
    );
  }

  const menuItems = [
    {
      title: "Các yêu cầu của tôi",
      icon: "art-track",
      onPress: () => handleAuthenticatedNavigation("MyRequests"),
    },
    {
      title: "Các yêu cầu được gửi đến tôi",
      icon: "article",
      onPress: () => handleAuthenticatedNavigation("RequestsForMe"),
    },
    {
      title: "Các yêu cầu của tôi đến các chiến dịch từ thiện",
      icon: "ballot",
      onPress: () => handleAuthenticatedNavigation("MyRequestsToCampaign"),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <View style={styles.menuItemContent}>
                <View style={styles.menuItemIcon}>
                  <Icon name={item.icon} size={20} color={Colors.orange500} />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                </View>
                <Icon
                  name="arrow-forward-ios"
                  size={20}
                  color={Colors.gray400}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  menuCard: {
    backgroundColor: "white",
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  menuContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: Colors.darkText,
    flex: 1,
  },
  menuSection: {
    gap: 12,
  },
  menuItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 13,
    color: Colors.gray600,
  },
});

export default RequestSubActionScreen;
