import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import axiosInstance from "@/src/api/axiosInstance";
import Colors from "@/src/constants/Colors";
import { Product } from "@/src/shared/type";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@/src/hooks/useNavigation";
import { useAuthCheck } from "@/src/hooks/useAuth";

const STATUS_COLORS: { [key: string]: string } = {
  Pending: Colors.orange500,
  Approved: Colors.lightGreen,
  Rejected: Colors.lightRed,
  Out_of_date: "#48494d",
  In_Transaction: Colors.blue500,
  Exchanged: Colors.purple500,
};

const REQUEST_COLORS: { [key: string]: string } = {
  itemRequestTo: Colors.orange500,
  requestForItem: Colors.lightGreen,
};

const STATUS_LABELS = {
  Pending: "Đang chờ",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Out_of_date: "Hết hạn",
  In_Transaction: "Đang trao đổi",
  Exchanged: "Đã trao đổi",
};

const MyProducts = () => {
  const [activeTab, setActiveTab] = useState("approved");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState<{
    approved: Product[];
    pending: Product[];
    outOfDate: Product[];
  }>({
    approved: [],
    pending: [],
    outOfDate: [],
  });
  const PAGE_SIZE = 5;

  const { userData } = useAuthCheck();

  const navigation = useNavigation();

  const loadApprovedProducts = async (page: number, isLoadMore = false) => {
    try {
      // Fetch approved products
      const response = await axiosInstance.get(
        `items/user/${userData.userId}?status=Approved&status=In_Transaction&status=Exchanged&pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
      );
      const responseData = response.data.data;
  
      setTotalPages(responseData.totalPage);
  
      // Process each product to check for related campaigns
      const productsWithCampaignInfo = await Promise.all(
        responseData.data.map(async (product: Product) => {
          try {
            // Call campaign API for the product's category parentId
            const campaignResponse = await axiosInstance.get(
              `campaign/category?categories=${product.category.parentId}&pageIndex=1&sizeIndex=10`
            );
            
            // Check if any campaigns are returned
            const hasCampaign = campaignResponse.data.data.data.length > 0;
  
            // Add the hasCampaign field to the product
            return { ...product, hasCampaign };
          } catch (campaignError) {
            console.error(
              `Error fetching campaigns for category ${product.category.parentId}:`,
              campaignError
            );
            return { ...product, hasCampaign: false }; // Default to false on error
          }
        })
      );
  
      if (isLoadMore) {
        setProducts((prev) => ({
          ...prev,
          approved: [...prev.approved, ...productsWithCampaignInfo],
        }));
      } else {
        setProducts((prev) => ({
          ...prev,
          approved: productsWithCampaignInfo,
        }));
      }
    } catch (error) {
      console.error("Error loading approved products:", error);
    }
  };

  const loadPendingProducts = async (page: number, isLoadMore = false) => {
    try {
      const response = await axiosInstance.get(
        `items/user/${userData.userId}?status=Pending&pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
      );
      const responseData = response.data.data;

      setTotalPages(responseData.totalPage);

      if (isLoadMore) {
        setProducts((prev) => ({
          ...prev,
          pending: [...prev.pending, ...responseData.data],
        }));
      } else {
        setProducts((prev) => ({
          ...prev,
          pending: responseData.data,
        }));
      }
    } catch (error) {
      console.error("Error loading pending products:", error);
    }
  };

  const loadOutOfDateProducts = async (page: number, isLoadMore = false) => {
    try {
      const response = await axiosInstance.get(
        `items/user/${userData.userId}?status=Out_of_date&status=Rejected&pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
      );
      const responseData = response.data.data;

      setTotalPages(responseData.totalPage);

      if (isLoadMore) {
        setProducts((prev) => ({
          ...prev,
          outOfDate: [...prev.outOfDate, ...responseData.data],
        }));
      } else {
        setProducts((prev) => ({
          ...prev,
          outOfDate: responseData.data,
        }));
      }
    } catch (error) {
      console.error("Error loading out of date products:", error);
    }
  };

  const loadProducts = async (
    page: number,
    isLoadMore = false,
    activeTab: string
  ) => {
    if (isLoading || (totalPages !== 0 && page > totalPages)) return;

    setIsLoading(true);
    // setLoading(true);
    try {
      switch (activeTab) {
        case "approved":
          await loadApprovedProducts(page, isLoadMore);
          break;
        case "pending":
          await loadPendingProducts(page, isLoadMore);
          break;
        case "outOfDate":
          await loadOutOfDateProducts(page, isLoadMore);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadProducts(1, false, activeTab);
  }, [activeTab]); // Reset và load lại khi đổi tab

  const handleLoadMore = () => {
    if (!isLoading && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      loadProducts(currentPage + 1, true, activeTab);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts(1, false, activeTab);
    setRefreshing(false);
  };

  // useEffect(() => {
  //   // Fetch data from the API
  //   axiosInstance
  //     .get("/items/current-user")
  //     .then((response) => {
  //       const data = response.data.data;
  //       setProducts({
  //         approved: data["ApprovedItems"],
  //         rejected: data["RejectedItems"],
  //         pending: data["PendingItems"],
  //         outOfDate: data["OutOfDateItems"],
  //         exchanged: data["ExchangedItems"],
  //         inTransaction: data["InTransactionItems"],
  //       });
  //     })
  //     .catch((error) => {
  //       console.error("Error fetching data:", error);
  //     });
  // }, []);

  const getFilteredProducts = (products: Product[], searchQuery: string) => {
    if (!searchQuery.trim()) return products;

    const searchLower = searchQuery.toLowerCase().trim();
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.category?.name?.toLowerCase().includes(searchLower) ||
        product.condition.toLowerCase().includes(searchLower)
      );
    });
  };

  const getActiveProducts = () => {
    switch (activeTab) {
      case "approved":
        return [...products.approved];
      case "pending":
        return products.pending;
      case "outOfDate":
        return [...products.outOfDate];
      default:
        return [];
    }
  };

  const setSearchQueryHandler = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    loadProducts(1, false, activeTab);
  };

  const currentProducts = getActiveProducts();
  const filteredProducts = getFilteredProducts(currentProducts, searchQuery);

  const renderProducts = (items: Product[]) => {
    return items.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() =>
          navigation.navigate("ProductDetail", { productId: item.id })
        }
      >
        <View style={styles.cardHeader}>
          <View style={{ width: "60%" }}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${STATUS_COLORS[item?.status]}15` },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: STATUS_COLORS[item?.status] },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: STATUS_COLORS[item?.status] },
              ]}
            >
              {STATUS_LABELS[item?.status as keyof typeof STATUS_LABELS]}
            </Text>
          </View>
        </View>
        <View style={styles.productInfo}>
          <Image source={{ uri: item.images[0] }} style={styles.image} />
          <View style={styles.productDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailText}>{item.description}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="category" size={20} color={Colors.orange500} />
              <Text style={styles.detailText}> 
              {`${item.category.parentName}, `} {item.category.name}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="loop" size={20} color={Colors.orange500} />
              <Text style={styles.detailText}>
                {item.condition === "new" ? "Mới" : "Đã sử dụng"}
              </Text>
            </View>
            {item.isGift ? (
              <View style={styles.detailItem}>
                <Icon name="card-giftcard" size={20} color={Colors.orange500} />
                <Text style={[styles.detailText, styles.giftText]}>
                  Sản phẩm này là quà tặng
                </Text>
              </View>
            ) : (
              <></>
            )}
            
            {item.isRequestFromCampaign ? (
              <View style={styles.detailItem}>
                <Text style={[styles.detailText, styles.giftText]}>
                  *Có yêu cầu từ chiến dịch thiện nguyện
                </Text>
              </View>
            ) : (
              <></>
            )}
          </View>
        </View>
        {activeTab === "approved" && (
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.requestButton}
              onPress={() =>
                navigation.navigate("MyRequests", {
                  productId: item.id,
                  type: "itemRequestTo",
                })
              }
              disabled={item.itemRequestTo === 0}
            >
              <Text style={styles.requestLabel}>Yêu cầu đã gửi</Text>
              <View style={styles.requestInfo}>
                <Icon name="call-made" size={16} color={Colors.orange500} />
                <Text style={styles.requestCount}>
                  {item.itemPendingRequestTo} / {item.itemRequestTo} đang chờ
                  duyệt
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.requestButton}
              onPress={() =>
                navigation.navigate("MyRequests", {
                  productId: item.id,
                  type: "requestsForMe",
                })
              }
              disabled={item.requestForItem === 0}
            >
              <Text style={styles.requestLabel}>Yêu cầu nhận được</Text>
              <View style={styles.requestInfo}>
                <Icon name="call-received" size={16} color={Colors.lightRed} />
                <Text style={[styles.requestCount, { color: Colors.lightRed }]}>
                  {item.pendingRequestForItem} / {item.requestForItem} đang chờ
                  duyệt
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    ));
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.orange500} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "approved" && styles.activeTab]}
          onPress={() => setActiveTab("approved")}
        >
          <Text style={{ fontSize: 16 }}>Đã duyệt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.activeTab]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={{ fontSize: 16 }}>Chờ phê duyệt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "outOfDate" && styles.activeTab]}
          onPress={() => setActiveTab("outOfDate")}
        >
          <Text style={{ fontSize: 16 }}>Đã huỷ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Icon
            name="search"
            size={20}
            color={Colors.gray500}
            style={styles.searchIcon}
          />
          <TextInput
            placeholderTextColor="#c4c4c4"
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên, mô tả, danh mục..."
            value={searchQuery}
            onChangeText={() => setSearchQueryHandler(searchQuery)}
          />
          {searchQuery !== "" && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Icon name="close" size={20} color={Colors.gray500} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
        // contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 1000;

          if (isCloseToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {filteredProducts.length > 0 ? (
          <>
            {renderProducts(filteredProducts)}
            {isLoading && (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={Colors.orange500} />
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Icon name="search-off" size={48} color={Colors.gray500} />
            <Text style={styles.emptyStateText}>
              Không tìm thấy sản phẩm nào phù hợp
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    backgroundColor: "#fff",
    paddingTop: 10,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f1f1f1",
    borderRadius: 5,
  },
  activeTabButton: {
    backgroundColor: Colors.orange500,
  },
  tabText: {
    fontSize: 16,
    color: "#333",
  },
  activeTabText: {
    color: "#fff",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.orange200,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  approvedBadge: {
    backgroundColor: "#28a745",
  },
  pendingBadge: {
    backgroundColor: "#ffc107",
  },
  badgeText: {
    color: "#fff",
    fontSize: 14,
  },
  productInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  image: {
    width: 80,
    height: 80,
    marginRight: 16,
    borderRadius: 8,
  },
  productDetails: {
    flex: 1,
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.orange500,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
  },
  giftText: {
    color: Colors.orange500,
    fontWeight: "bold",
  },
  searchContainer: {
    margin: 16,
    marginTop: 0,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.gray800,
    // paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.gray500,
    marginTop: 12,
    textAlign: "center",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  requestButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  requestInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  requestCount: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.orange500,
    marginLeft: 6,
  },
  requestLabel: {
    fontSize: 12,
    color: Colors.gray600,
  },
  divider: {
    width: 1,
    height: "100%",
    backgroundColor: "#eee",
    marginHorizontal: 8,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default MyProducts;
