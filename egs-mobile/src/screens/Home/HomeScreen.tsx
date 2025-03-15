import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Modal,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import axiosInstance from "@/src/api/axiosInstance";
import Colors from "@/src/constants/Colors";
import { useNavigation } from "@/src/hooks/useNavigation";
import { Product, CampaignResponse, Campaign } from "@/src/shared/type";
import { useAuthCheck } from "@/src/hooks/useAuth";
import { CampaignCarousel } from "@/src/components/CampaignCarousel";
import TimeNow from "@/src/components/TimeNow/TimeNow";
import Constants from "expo-constants";
const API_GET_CAMPAIGN = (Constants.expoConfig as any).extra.API_GET_CAMPAIGN;
const API_GET_ALL_PRODUCT = (Constants.expoConfig as any).extra.API_GET_ALL_PRODUCT;

interface SortOption {
  value: "createdAt" | "name" | "condition";
  label: string;
}

const { width } = Dimensions.get("window");

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const userId = useAuthCheck().userData.userId;

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "condition" | "createdAt">(
    "createdAt"
  );
  const [pageIndex, setPageIndex] = useState(1);
  const [sizeIndex] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async (loadMore = false) => {
    try {
      setLoading(!loadMore);
      if (loadMore) setIsLoadingMore(true);

      const response = await axiosInstance.get(
        `${API_GET_ALL_PRODUCT}?status=Approved&pageIndex=${
          loadMore ? pageIndex + 1 : 1
        }&sizeIndex=${sizeIndex}`
      );

      console.log("Response: ", response.data);

      const productsData = response.data.data.data;
      const totalPages = response.data.data.totalPage;

      if (loadMore) {
        setProducts((prev) => [...prev, ...productsData]);
        setPageIndex((prev) => prev + 1);
        setHasMore(pageIndex < totalPages);
      } else {
        setProducts(productsData);
        setPageIndex(1);
        setHasMore(true);
      }

      getFilterProducts(
        loadMore ? [...products, ...productsData] : productsData
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const response = await axiosInstance.get(
        `${API_GET_CAMPAIGN}/list?pageIndex=1&pageSize=10`
      );
      const campaignData = response.data as CampaignResponse;
      const filteredCampaigns = campaignData.data.data.filter(
        (campaign: Campaign) => campaign.status === "Ongoing"
      );
      setCampaigns(filteredCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchProducts();
  }, [userId, sortBy, selectedCategory]);

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchProducts(true);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(false);
    setRefreshing(false);
  };

  const categories = [
    ...new Set(products.map((product) => product.category.name)),
  ];

  const renderSearchContainer = () => (
    <TouchableOpacity
      style={styles.searchContainer}
      onPress={() => navigation.navigate("SearchScreen")}
    >
      <Icon name="search" size={20} style={styles.searchIcon} color="#666" />
      <Text style={styles.searchPlaceholder}>Tìm kiếm sản phẩm...</Text>
    </TouchableOpacity>
  );

  const getFilterProducts = (products: Product[]) => {
    let filteredProducts = products;

    if (userId !== "") {
      filteredProducts = filteredProducts.filter(
        (product) => product.owner_id !== userId
      );
    }

    filteredProducts = filteredProducts
      .filter((product) => product.status === "Approved")
      .filter((product) =>
        selectedCategory ? product.category.name === selectedCategory : true
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "condition":
            return a.condition.localeCompare(b.condition);
          case "createdAt":
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          default:
            return 0;
        }
      });

    setFilteredProducts(filteredProducts);
  };

  const renderProductCard = ({ item: product }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("ProductDetail", { productId: product.id })
      }
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {/* Image with loading placeholder */}
        <Image
          source={{ uri: product.images?.[0] }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Status badges */}
        <View style={styles.statusBadgeContainer}>
          {product.isGift && (
            <View style={styles.giftBadge}>
              <Icon name="card-giftcard" size={16} color="#fff" />
              <Text style={styles.giftText}>Tặng</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardContent}>
        {/* Product info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.description} numberOfLines={1}>
            {product.description}
          </Text>
        </View>

        {/* Tags/Badges */}
        <View style={styles.badgeContainer}>
          {product.condition === "New" ? (
            <View style={[styles.badge, styles.conditionBadgeNew]}>
              <Icon name="info" size={12} color={Colors.lightGreen} />
              <Text style={styles.conditionTextNew}>Mới</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.conditionBadge]}>
              <Icon name="info" size={12} color={Colors.orange500} />
              <Text style={styles.conditionText}>Đã sử dụng</Text>
            </View>
          )}

          <View style={[styles.badge, styles.categoryBadge]}>
            {/* <Icon name="category" size={12} color="#666" /> */}
            <Text style={styles.categoryText}>{product.category.name}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TimeNow />
      {renderSearchContainer()}
      <CampaignCarousel campaigns={campaigns} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => setIsSearchFocused(false)}
      style={{ flex: 1 }}
    >
      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.container,
          filteredProducts.length === 0 && { flex: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() =>
          isLoadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#f97316" />
            </View>
          ) : null
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="block" size={50} />
            <Text style={styles.emptyText}>Không có sản phẩm nào</Text>
          </View>
        )}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#D3D3D3",
    borderRadius: 12,
    fontSize: 18,
    marginVertical: 16,
    backgroundColor: "#F8F8F8",
  },
  container: {
    padding: 16,
    paddingVertical: 24,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginVertical: 16,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  filterTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
  },
  selectedCategoryButton: {
    backgroundColor: "#f97316",
    borderColor: "#f97316",
  },
  categoryButtonText: {
    color: "#000",
  },
  selectedCategoryButtonText: {
    color: "#fff",
  },
  resultCount: {
    color: "#666",
    marginBottom: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  card: {
    width: (width - 48) / 2,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    height: 140,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f5f5f5",
  },
  statusBadgeContainer: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    gap: 4,
  },
  giftBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.orange500,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  giftText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  unavailableBadge: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unavailableText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  wishlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    padding: 12,
    gap: 8,
  },
  productInfo: {
    gap: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  description: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  conditionBadge: {
    backgroundColor: Colors.orange50,
  },
  conditionBadgeNew: {
    backgroundColor: "#e6fbf7",
  },
  categoryBadge: {
    backgroundColor: "#f5f5f5",
  },
  conditionText: {
    fontSize: 12,
    color: Colors.orange500,
    fontWeight: "500",
  },
  conditionTextNew: {
    fontSize: 12,
    color: Colors.lightGreen,
    fontWeight: "500",
  },
  categoryText: {
    fontSize: 12,
    color: "#666",
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: "#666",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 11,
    color: "#666",
    flex: 1,
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeDestructive: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  outlineBadge: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  badgeText: {
    fontSize: 12,
    color: "#000",
  },
  outlineBadgeText: {
    fontSize: 12,
    color: "#666",
  },
  sortButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  sortButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortButtonText: {
    color: "#000",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sortOptionText: {
    fontSize: 16,
    color: "#000",
  },
  sortOptionTextSelected: {
    fontWeight: "600",
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
  },
  searchButton: {
    padding: 8,
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
  },
  clearButton: {
    padding: 8,
  },
  searchModeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.orange500,
    marginHorizontal: 4,
    alignItems: "center",
  },
  activeModeButton: {
    backgroundColor: Colors.orange500,
  },
  modeButtonText: {
    fontSize: 12,
    color: Colors.orange500,
  },
  activeModeButtonText: {
    color: "#fff",
  },
  suggestionsContainer: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    elevation: 4,
    zIndex: 1000,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#000",
  },
  suggestionSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    elevation: 2,
    marginBottom: 16,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
});

export default HomeScreen;
