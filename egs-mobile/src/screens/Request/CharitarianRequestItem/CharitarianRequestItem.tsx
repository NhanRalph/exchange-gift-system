import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import axiosInstance from "@/src/api/axiosInstance";
import Colors from "@/src/constants/Colors";
import { Product } from "@/src/shared/type";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from "@/src/hooks/useNavigation";
import Constants from "expo-constants";
const API_CHARITARIAN_REQUEST_ITEM = (Constants.expoConfig as any).extra.API_CHARITARIAN_REQUEST_ITEM;

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

const CharitarianRequestItem = () => {
  const [activeTab, setActiveTab] = useState("approved");
  const [products, setProducts] = useState<Product[]>([]);
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const PAGE_SIZE = 10;

  const fetchProducts = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(
        `${API_CHARITARIAN_REQUEST_ITEM}?pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
      );
      const { data, totalItems } = response.data.data;

      if (page === 1) {
        setProducts(data);
      } else {
        setProducts((prev) => [...prev, ...data]);
      }

      setTotalPages(Math.ceil(totalItems / PAGE_SIZE));
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, []);

  const loadMore = () => {
    if (!isLoading && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      fetchProducts(currentPage + 1);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(1);
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    // Reset products and fetch first page with search query
    fetchProducts(1);
  };

  const filteredProducts = products.filter((product: Product) => {
    const searchLower = searchQuery.toLowerCase();
    return product.name.toLowerCase().includes(searchLower);
  });

  const renderProducts = (items: Product[]) => {
    return items.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() =>
          navigation.navigate("MyRequests", {
            productId: item.id,
            type: "requestsForMe",
          })
        }
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View></View>
          {/* <View
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
          </View> */}
        </View>
        <View style={styles.productInfo}>
          <Image source={{ uri: item.images[0] }} style={styles.image} />
          <View style={styles.productDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailText}>{item.description}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="loop" size={20} color={Colors.orange500} />
              <Text style={styles.detailText}>
                Tình trạng: {item.condition}
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

            {item.isRequestFromCampaign && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailText, styles.giftText]}>
                  *Có yêu cầu từ chiến dịch thiện nguyện
                </Text>
              </View>
            )}
          </View>
        </View>
        {activeTab === "approved" && (
          <View style={styles.cardFooter}>
            <View style={styles.requestButton}>
              <Text style={styles.requestLabel}>Yêu cầu nhận được</Text>
              <View style={styles.requestInfo}>
                <Icon name="call-received" size={16} color={Colors.lightRed} />
                <Text style={[styles.requestCount, { color: Colors.lightRed }]}>
                  {item.pendingRequestForItem} / {item.requestForItem} đang chờ
                  duyệt
                </Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    ));
  };

  return (
    <View style={styles.container}>
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
            placeholder="Tìm kiếm theo tên sản phẩm..."
            value={searchQuery}
            onChangeText={() => handleSearch(searchQuery)}
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
            contentSize.height - 20;

          if (isCloseToBottom) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {activeTab === "approved" && renderProducts(filteredProducts)}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.orange500} />
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
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
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
    fontSize: 12,
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
  loadingContainer: {
    padding: 16,
    alignItems: "center",
  },
});

export default CharitarianRequestItem;
