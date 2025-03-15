import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Colors from "@/src/constants/Colors";
import { useNavigation, useRoute } from "@/src/hooks/useNavigation";
import axiosInstance from "@/src/api/axiosInstance";
import { Product } from "@/src/shared/type";
import { useAuthCheck } from "@/src/hooks/useAuth";
import { SearchMode, searchModes, getSearchValue } from "@/src/utils/search";
import Constants from "expo-constants";
const API_SEARCH_ITEMS = (Constants.expoConfig as any).extra.API_SEARCH_ITEMS;

type RouteParams = {
  searchTerm: string;
  searchMode: "default" | "need" | "have";
};

const SearchResultsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { searchTerm, searchMode } = route.params as RouteParams;

  console.log("Search Term: ", searchTerm);
  console.log("Search Mode: ", searchMode);
  const { userData } = useAuthCheck();

  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    fetchSearchResults(1);
  }, [searchTerm, searchMode]);

  const fetchSearchResults = async (page: number) => {
    setLoading(true);
    try {
      const searchValue = getSearchValue(searchTerm, searchMode);

      const response = await axiosInstance.get(
        `${API_SEARCH_ITEMS}?searchData=${searchValue}&pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
      );

      const { data, totalItems } = response.data.data;

      filterProducts(page, data);

      setTotalPages(Math.ceil(totalItems / PAGE_SIZE));
    } catch (error: any) {
      console.error("Error searching products:", error);

      if (error.response) {
        console.error("Error response:", error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const getSearchModeInfo = () => {
    return (
      searchModes.find((mode) => mode.value === searchMode) || searchModes[0]
    );
  };

  const filterProducts = (page: number, products: Product[]) => {
    let filtered = products.filter((product) => {
      // Điều kiện 1: Sản phẩm không phải của mình và trạng thái là "Approved"
      const isApprovedAndNotMine =
        product.status === "Approved" && product.owner_id !== userData.userId;

      // Điều kiện 2: Sản phẩm là của mình (bất kể trạng thái)
      const isMine = product.owner_id === userData.userId;

      // Kết hợp hai điều kiện
      return isApprovedAndNotMine || isMine;
    });

    if (page === 1) {
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts((prev) => [...prev, ...filtered]);
    }
  };

  const loadMore = () => {
    if (!loading && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      fetchSearchResults(currentPage + 1);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSearchResults(1);
    setRefreshing(false);
  };

  const renderHeader = () => {
    const modeInfo = getSearchModeInfo();
    return (
      <View style={styles.headerContent}>
        <View style={styles.searchInfo}>
          <Icon name={modeInfo.icon} size={20} color="#666" />
          <Text style={styles.searchMode}>{modeInfo.label}:</Text>
          <Text style={styles.searchTerm} numberOfLines={1}>
            {searchTerm}
          </Text>
        </View>
        {/* <Text style={styles.resultCount}>
          {filteredProducts.length} kết quả
        </Text> */}
      </View>
    );
  };

  const renderEmptyState = () =>
    !loading && (
      <View style={styles.emptyContainer}>
        <Icon name="search-off" size={64} color="#666" />
        <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
        <Text style={styles.emptyDescription}>
          Không có sản phẩm nào liên quan đến "{searchTerm}"
        </Text>
        <Text style={styles.emptyDescription}>
          Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc
        </Text>
      </View>
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
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
        {item.owner_id === userData?.userId && (
          <Text style={styles.ownProductWarning}>
            Bạn là chủ sở hữu món đồ này
          </Text>
        )}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.condition}</Text>
          </View>
          {item.isGift && (
            <View style={styles.giftIcon}>
              <Icon name="card-giftcard" size={20} color={Colors.orange500} />
            </View>
          )}
          <View style={[styles.badge, styles.outlineBadge]}>
            <Text style={styles.outlineBadgeText}>{item.category.name}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả tìm kiếm</Text>
      </View> */}

      {/* {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.orange500} />
        </View>
      ) : ( */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          loading ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#f97316" />
            </View>
          ) : null
        }
      />
      {/* )} */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: Platform.OS === "android" ? 16 : 0,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerContent: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  searchTerm: {
    fontSize: 16,
    fontWeight: "500",
  },
  resultCount: {
    fontSize: 14,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    flexGrow: 1,
  },
  productItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    gap: 12,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    color: Colors.orange600,
  },
  productDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: Colors.orange50,
  },
  badgeText: {
    fontSize: 12,
    color: "#000",
  },
  outlineBadge: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  outlineBadgeText: {
    fontSize: 12,
    color: "#666",
  },
  giftIcon: {
    marginHorizontal: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  searchMode: {
    fontSize: 14,
    color: "#666",
    marginRight: 4,
  },
  ownProductWarning: {
    fontSize: 12,
    color: Colors.orange500,
    fontStyle: "italic",
    marginBottom: 8,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

export default SearchResultsScreen;
