import React, { useState } from "react";
import { View, Modal, TouchableOpacity, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "@/hooks/useNavigation";
import {
  BottomTabParamList,
  RootStackParamList,
} from "@/layouts/types/navigationTypes";
import { useAuthStore } from "../stores/authStore";

interface ButtonMoreActionHeaderProps {
  propNav: "Home" | "Favorites" | "Notifications" | "Profile";
}

export function ButtonMoreActionHeader({
  propNav,
}: ButtonMoreActionHeaderProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();
  const { userRole } = useAuthStore();

  const menuOptions: Array<{
    label: string;
    value: keyof RootStackParamList;
    screen?: string;
  }> = [
    { label: "Trang chủ", value: "Main", screen: "Home" },
    { label: "Cá nhân", value: "Main", screen: "Profile" },
    { label: "Sản phẩm của tôi", value: "MyProducts" },
    { label: "Yêu cầu của tôi", value: "RequestSubAction" },
    { label: "Giao dịch của tôi", value: "MyTransactions" },
  ];

  const menuVolunteerOptions: Array<{
    label: string;
    value: keyof RootStackParamList;
    screen?: string;
  }> = [
    { label: "Cá nhân", value: "Main", screen: "Profile" },
    { label: "Thông báo", value: "Main", screen: "Notifications" },
    { label: "Nhiệm vụ của tôi", value: "VolunteerTasks" },
  ];

  const handleOptionSelect = (
    value: keyof RootStackParamList,
    screen: keyof BottomTabParamList
  ) => {
    setModalVisible(false);
    if (value === "MyTransactions") {
      navigation.navigate("MyTransactions", { requestId: "" });
    }
    if (value === "MyProducts") {
      navigation.navigate("MyProducts");
    }
    if (value === "RequestSubAction") {
      navigation.navigate("RequestSubAction");
    }
    if (value === "VolunteerTasks") {
      navigation.navigate("VolunteerTasks");
    }
    if (value === "Main") {
      navigation.navigate("Main", {
        screen: screen,
      });
    }
  };

  const listMenuOptions =
    userRole === "User" ? menuOptions : menuVolunteerOptions;

  return (
    <View>
      <MaterialIcons
        name="more-vert"
        size={24}
        color="black"
        style={{ marginRight: 20 }}
        onPress={() => setModalVisible(true)}
      />

      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.menuContainer}>
            {listMenuOptions.map((option) => (
              <TouchableOpacity
                key={option.value + option.screen}
                style={styles.menuItem}
                onPress={() =>
                  handleOptionSelect(
                    option.value,
                    option.screen as keyof BottomTabParamList
                  )
                }
              >
                <Text style={styles.menuText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
  },
  menuContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
    marginTop: 50,
    marginRight: 20,
    marginLeft: "auto",
    width: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuText: {
    fontSize: 16,
  },
});
