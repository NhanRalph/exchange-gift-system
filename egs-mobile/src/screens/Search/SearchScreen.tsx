import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  SectionList,
  Image,
  Platform,
  Modal,
  FlatList,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Colors from "@/src/constants/Colors";
import { useNavigation } from "@/src/hooks/useNavigation";
import axiosInstance from "@/src/api/axiosInstance";
import { Product } from "@/src/shared/type";
import { SearchMode, searchModes, getSearchValue } from "@/src/utils/search";
import { useAuthCheck } from "@/src/hooks/useAuth";
import { ActivityIndicator } from "react-native";
import Constants from "expo-constants";
const API_GET_ALL_PRODUCT = (Constants.expoConfig as any).extra.API_GET_ALL_PRODUCT;

const SearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("default");
  const [isFocused, setIsFocused] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const { userData } = useAuthCheck();

  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchRecentProducts(1);
  }, []);

  const fetchRecentProducts = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `${API_GET_ALL_PRODUCT}?pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
      );

      const { data, totalItems } = response.data.data;

      const filteredProducts = data.filter((product: Product) => {
        const isApprovedAndNotMine =
          product.status === "Approved" && product.owner_id !== userData.userId;

        const isMine = product.owner_id === userData.userId;

        return isApprovedAndNotMine || isMine;
      });

      if (page === 1) {
        setRecentProducts(filteredProducts);
      } else {
        setRecentProducts((prev) => [...prev, ...filteredProducts]);
      }

      setTotalPages(Math.ceil(totalItems / PAGE_SIZE));
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Error fetching recent products:", error);
    }
  };

  const loadMore = () => {
    if (!isLoading && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      fetchRecentProducts(currentPage + 1);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecentProducts(1);
    setRefreshing(false);
  };

  const handleSearch = () => {
    if (!searchTerm) return;
    navigation.navigate("SearchResultsScreen", {
      searchTerm,
      searchMode,
    });
  };

  const getSearchModeIcon = () => {
    switch (searchMode) {
      case "need":
        return "category";
      case "have":
        return "people";
      default:
        return "search";
    }
  };

  const renderSearchModeModal = () => (
    <Modal
      visible={showModeModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowModeModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowModeModal(false)}
      >
        <View style={styles.modalContent}>
          {searchModes.map((mode) => (
            <TouchableOpacity
              key={mode.value}
              style={styles.modalOption}
              onPress={() => {
                setSearchMode(mode.value);
                setShowModeModal(false);
              }}
            >
              <Icon
                name={mode.icon}
                size={24}
                color={searchMode === mode.value ? Colors.orange500 : "#666"}
              />
              <View style={styles.modalOptionContent}>
                <Text
                  style={[
                    styles.modalOptionText,
                    searchMode === mode.value && styles.activeOptionText,
                  ]}
                >
                  {mode.label}
                </Text>
                <Text style={styles.modalOptionDescription}>
                  {mode.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() =>
        navigation.navigate("ProductDetail", { productId: item.id })
      }
    >
      <Image source={{ uri: item.images?.[0] }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productCategory}>{item.category.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Icon name={getSearchModeIcon()} size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={handleSearch}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm("")}>
              <Icon name="close" size={20} color="#666" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.modeButton}
            onPress={() => setShowModeModal(true)}
          >
            <Icon name="tune" size={20} color={Colors.orange500} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={recentProducts}
        renderItem={renderProductItem}
        keyExtractor={(item: Product) => item.id}
        ListHeaderComponent={() => (
          <Text style={styles.sectionHeader}>Gợi ý tìm kiếm</Text>
        )}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          isLoading ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#f97316" />
            </View>
          ) : null
        }
      />

      {renderSearchModeModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === "android" ? 16 : 0,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  modeButton: {
    padding: 4,
    borderLeftWidth: 1,
    borderLeftColor: "#ddd",
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#666",
  },
  activeOptionText: {
    color: Colors.orange500,
    fontWeight: "500",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    padding: 16,
    backgroundColor: "#fff",
  },
  listContent: {
    paddingBottom: 16,
  },
  productItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
    gap: 12,
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: "#666",
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

export default SearchScreen;
