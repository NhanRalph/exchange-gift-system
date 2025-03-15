import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { format } from "date-fns";
import { Product } from "@/src/shared/type";
import axiosInstance from "@/src/api/axiosInstance";
import Icon from "react-native-vector-icons/MaterialIcons";
import Colors from "@/src/constants/Colors";
import { useNavigation } from "@/src/hooks/useNavigation";
import { formatDate_DD_MM_YYYY } from "@/src/shared/formatDate";

const STATUS_COLORS: { [key: string]: string } = {
  Pending: Colors.orange500,
  Approved: Colors.lightGreen,
  Rejected: Colors.lightRed,
  Out_of_date: "#48494d",
  In_Transaction: Colors.blue500,
  Exchanged: Colors.purple500,
};

const STATUS_LABELS = {
  Pending: "Đang chờ",
  Approved: "Đã duyệt",
  Rejected: "Từ chối",
  Out_of_date: "Hết hạn",
  In_Transaction: "Đang trao đổi",
  Exchanged: "Đã trao đổi",
};

const STATUS_CAMPAIGN_COLORS: { [key: string]: string } = {
  Pending: Colors.orange500,
  Approved: Colors.lightGreen,
  Rejected: Colors.lightRed,
  Canceled: Colors.gray500,
  Hold_On: Colors.gray500,
};

const STATUS_CAMPAIGN_LABELS = {
  Pending: "Chờ chấp nhận",
  Approved: "Đã được chấp nhận",
  Rejected: "Không được chấp nhận",
  Canceled: "Đã bị huỷ",
  Hold_On: "Tạm hoãn do trong giao dịch khác",
};

const MyRequestsToCampaign = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});
  const [isShowActions, setIsShowActions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const PAGE_SIZE = 10;

  const fetchProducts = async (page: number) => {
    setIsLoading(true);
    try {
      const productsResponse = await axiosInstance.get(
        `items/campaign/current-user?pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
      );

      if (productsResponse?.data?.data) {
        const { data, totalItems } = productsResponse.data.data;

        // const sortedProducts = data.sort((a: Request, b: Request) => {
        //   const statusOrder: { [key: string]: number } = {
        //     Pending: 1,
        //     Hold_On: 2,
        //     Approved: 3,
        //     Rejected: 4,
        //     Completed: 5,
        //     Not_Completed: 6,
        //   };
        //   return statusOrder[a.status] - statusOrder[b.status];
        // });

        if (page === 1) {
          setProducts(data);
        } else {
          setProducts((prev) => [...prev, ...data]);
        }

        setTotalPages(Math.ceil(totalItems / PAGE_SIZE));
      } else {
        console.warn("No data found in response:", productsResponse);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
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

  //   const handleSearch = (query: string) => {
  //     setSearchQuery(query);
  //     setCurrentPage(1);
  //     // Reset products and fetch first page with search query
  //     fetchProducts(1);
  //   };

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const renderItem = ({ item }: { item: Product }) => {
    
    const isExpanded = expandedItems[item.id] || false;
    const isExpired = new Date(item.expiresAt) < new Date();
    const isCampaignItem = item.itemCampaign && item.itemCampaign.length > 0;

    return (
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
              <Icon name="category" size={20} color={Colors.orange500} />
              <Text style={styles.detailText}>
                {`${item.category.parentName}, `} {item.category.name}
              </Text>
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

        <View style={styles.cardFooter}>
          {isExpanded ? (
            <>
              <View style={styles.footer}>
                <Text style={styles.titleFooter}>Đã gửi yêu cầu tới cho:</Text>
                <Text style={styles.statusFooter}>Trạng thái</Text>
              </View>
              {item.itemCampaign?.map((item, index) => (
                <TouchableOpacity
                  key={`${item.campaignId} - ${index}`}
                  style={styles.campaignCard}
                  onPress={() => {
                    navigation.navigate("CampaignDetail", {
                      campaignId: item.campaignId,
                    });
                  }}
                >
                  <View style={styles.campaignInfo}>
                    <Image
                      source={{ uri: item.bannerPicture }}
                      style={styles.bannerImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.campaignName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <View style={styles.campaignFooter}>
                      <Text style={styles.campaignDates}>
                        {formatDate_DD_MM_YYYY(item.startDate)} -{" "}
                        {formatDate_DD_MM_YYYY(item.endDate)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.campaignStatus}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: `${
                            STATUS_CAMPAIGN_COLORS[item?.status]
                          }15`,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: STATUS_CAMPAIGN_COLORS[item?.status] },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: STATUS_CAMPAIGN_COLORS[item?.status] },
                        ]}
                      >
                        {
                          STATUS_CAMPAIGN_LABELS[
                            item?.status as keyof typeof STATUS_CAMPAIGN_LABELS
                          ]
                        }
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity 
                onPress={() => toggleExpand(item.id)}
                style={[{ width: "100%", flexDirection: "row", justifyContent: "center", height: 40, alignItems: "center" }]}
              >
                <Text style={styles.expiryText}>
                  Thu gọn
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                onPress={() => toggleExpand(item.id)}
                style={[{ width: "100%", flexDirection: "row", justifyContent: "center", height: 40, alignItems: "center" }]}
              >
                <Text style={styles.expiryText}>
                  Đã gửi yêu cầu tới cho chiến dịch
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.id + index}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="block" size={50} />
            <Text style={styles.emptyText}>Không có yêu cầu nào</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  listContainer: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: "#FFFFFF",
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
  },
  itemImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  itemDetails: {
    padding: 16,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: "#333333",
  },
  campaignBadge: {
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  campaignText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  footer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleFooter: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
  },
  statusFooter: {
    fontSize: 14,
    color: "#666666",
  },
  expiryText: {
    fontSize: 12,
    color: "#666666",
  },
  expired: {
    color: "#F44336",
  },
  location: {
    fontSize: 12,
    color: "#666666",
    flex: 1,
    textAlign: "right",
    marginLeft: 8,
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
  cardFooter: {
    // flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  campaignCard: {
    marginHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginBottom: 16,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 3,
    padding: 10,
    gap: 10,
  },
  bannerImage: {
    width: 50,
    height: 50,
    objectFit: "cover",
    borderRadius: 8,
  },
  campaignStatus: {
    flexShrink: 1,
  },
  campaignInfo: {
    flex: 6,
  },
  campaignName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  campaignDescription: {
    fontSize: 8,
    color: "#666",
    marginVertical: 5,
  },
  campaignDetail: {
    fontSize: 12,
    color: "#666",
    marginVertical: 5,
  },
  campaignFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  campaignDates: {
    fontSize: 8,
    color: "#888",
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

export default MyRequestsToCampaign;
