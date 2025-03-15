import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialIcons";
import React, { useEffect, useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  Image,
} from "react-native";
import { BottomTabParamList } from "@/src/layouts/types/navigationTypes";
import Colors from "@/constants/Colors";
import { Category, SubCategory } from "@/shared/type";

import { useNavigation } from "@/hooks/useNavigation";
import useCategories from "@/hooks/useCategories";
import { useAuthStore } from "@/src/stores/authStore";
import { useNotificationStore } from "../stores/notificationStore";
import { useProximityStore } from "../stores/proximityStore";

import { Portal, Provider } from "react-native-paper";

const Tab = createBottomTabNavigator<BottomTabParamList>();

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

const CategoryModal = ({
  visible,
  onClose,
  categories,
  onSelectCategory,
}: {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  onSelectCategory: (category: Category) => void;
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <View style={styles.modalIndicator} />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color={Colors.gray600} />
          </TouchableOpacity>
        </View>

        <Text style={styles.modalTitle}>Chọn danh mục</Text>

        <View style={styles.categoriesList}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryItem}
              onPress={() => onSelectCategory(category)}
            >
              <Text style={styles.categoryText}>{category.name}</Text>
              <Icon name="chevron-right" size={24} color={Colors.gray400} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  </Modal>
);

const SubCategoryModal = ({
  visible,
  onClose,
  selectedCategory,
  subCategories,
  onSelectSubCategory,
}: {
  visible: boolean;
  onClose: () => void;
  selectedCategory: Category | null;
  subCategories: SubCategory[];
  onSelectSubCategory: (subCategory: SubCategory) => void;
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <View style={styles.modalIndicator} />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color={Colors.gray600} />
          </TouchableOpacity>
        </View>

        <Text style={styles.modalTitle}>
          {selectedCategory?.name
            ? `Danh mục ${selectedCategory.name}`
            : "Chọn danh mục phụ"}
        </Text>

        <View style={styles.categoriesList}>
          {subCategories.map((subCategory) => (
            <TouchableOpacity
              key={subCategory.id}
              style={styles.categoryItem}
              onPress={() => onSelectSubCategory(subCategory)}
            >
              <Text style={styles.categoryText}>{subCategory.name}</Text>
              <Icon name="chevron-right" size={24} color={Colors.gray400} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  </Modal>
);

export interface TabBarProps {
  route: keyof BottomTabParamList;
  component: React.ComponentType<any>;
  tabBarLabel: string;
  tabBarIconProps: {
    iconType: any;
    iconName: string;
  };
}

const CustomBottomTab: React.FC<{ tabs: TabBarProps[] }> = ({ tabs }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { userData, userRole } = useAuthStore();
  const { isVerifyOTP } = useProximityStore();
  const userEmail = useAuthStore((state) => state.email);
  const { categories, subCategories, getSubCategories, isLoading } =
    useCategories();
  const [modalVisible, setModalVisible] = useState(false);
  const [subCategoryModalVisible, setSubCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const slideAnim = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const subCategorySlideAnim = React.useRef(
    new Animated.Value(SCREEN_HEIGHT)
  ).current;
  const navigation = useNavigation();
  const { notifications, fetchInitialNotifications } = useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (isAuthenticated && isVerifyOTP) {
      fetchInitialNotifications(1, 10);
    }
  }, [isAuthenticated, userRole]);

  const handleCategorySelect = async (category: Category) => {
    setSelectedCategory(category);
    await getSubCategories(category.id);
    setModalVisible(false);
    setSubCategoryModalVisible(true);
  };

  const showModal = () => {
    if (!isAuthenticated) {
      Alert.alert(
        "Đăng nhập",
        "Bạn cần phải đăng nhập trước khi thực hiện hành động này",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đăng nhập",
            onPress: () => navigation.navigate("LoginScreen"),
          },
        ]
      );
      return;
    }

    if (!userEmail) {
      Alert.alert(
        "Cập nhật thông tin",
        "Vui lòng cập nhật email trước khi thực hiện hành động này",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Cập nhật",
            onPress: () => navigation.navigate("ProfileDetail"),
          },
        ]
      );
      return;
    }

    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const hideSubCategoryModal = () => {
    Animated.timing(subCategorySlideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSubCategoryModalVisible(false);
    });
  };

  const handleSubCategorySelect = (subCategory: SubCategory) => {
    hideSubCategoryModal();
    if (selectedCategory) {
      navigation.navigate("CreatePost", {
        category: selectedCategory,
        categoryId: selectedCategory.id,
        subCategory,
        subCategoryId: subCategory.id,
      });
    }
  };

  return (
    <Provider>
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          initialRouteName={tabs[0].route}
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: Colors.orange600,
            tabBarInactiveTintColor: "gray",
            tabBarStyle: {
              borderTopRightRadius: 20,
              borderTopLeftRadius: 20,
              height: 70,
              backgroundColor: "white",
            },
          }}
        >
          {tabs.map((tabProps: TabBarProps, idx) => (
            <Tab.Screen
              key={idx}
              name={tabProps.route}
              component={tabProps.component}
              options={{
                tabBarLabel: tabProps.tabBarLabel,
                tabBarIcon: ({ color, size }) =>
                  tabProps.route === "Profile" &&
                  isAuthenticated &&
                  isVerifyOTP ? (
                    <Image
                      source={{
                        uri: userData?.profilePicture,
                      }}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                      }}
                    />
                  ) : (
                    <Icon
                      name={tabProps.tabBarIconProps.iconName}
                      color={color}
                      size={20}
                    />
                  ),
                tabBarBadge:
                  tabProps.route === "Notifications" && unreadCount > 0
                    ? unreadCount
                    : undefined,
                tabBarBadgeStyle: {
                  backgroundColor: Colors.orange600,
                  fontSize: 12,
                },
              }}
            />
          ))}
        </Tab.Navigator>

        
        {userRole === "User" && (

<View style={styles.fabContainer}>
  <TouchableOpacity style={styles.fab} onPress={showModal}>
    <Icon name="add" size={20} color="white" />
  </TouchableOpacity>
</View>
          )}
      </View>
          {userRole === "User" && (
              <Portal>
                <CategoryModal
                  visible={modalVisible}
                  onClose={() => setModalVisible(false)}
                  categories={categories}
                  onSelectCategory={handleCategorySelect}
                />

                <SubCategoryModal
                  visible={subCategoryModalVisible}
                  onClose={() => setSubCategoryModalVisible(false)}
                  selectedCategory={selectedCategory}
                  subCategories={subCategories}
                  onSelectSubCategory={handleSubCategorySelect}
                />
              </Portal>

          )}
    </Provider>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: SCREEN_HEIGHT * 0.3,
    maxHeight: SCREEN_HEIGHT * 0.7,
    width: SCREEN_WIDTH,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray300,
    borderRadius: 2,
  },
  closeButton: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.gray900,
    textAlign: "center",
    marginVertical: 16,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  categoryText: {
    fontSize: 16,
    color: Colors.gray800,
    flex: 1,
  },
  fabContainer: {
    position: "absolute",
    alignSelf: "center",
    bottom: 40,
    zIndex: 1,
  },
  fab: {
    backgroundColor: Colors.orange600,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});

export default CustomBottomTab;
