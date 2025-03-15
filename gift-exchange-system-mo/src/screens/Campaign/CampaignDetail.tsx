import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  FlatList,
  Modal,
  Pressable,
  Platform,
  RefreshControl,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useRoute } from "@/src/hooks/useNavigation";
import axiosInstance from "@/src/api/axiosInstance";
import Colors from "@/src/constants/Colors";
import {
  Category,
  CategoryCampaign,
  CampaignDetail as ICampaignDetail,
  Product,
  User,
} from "@/src/shared/type";
import { formatDate_HHmm_DD_MM_YYYY } from "@/src/shared/formatDate";
import { CustomAlert } from "@/src/components/CustomAlert";
import { useAuthCheck } from "@/src/hooks/useAuth";
import Constants from "expo-constants";
const API_GET_CAMPAIGN = (Constants.expoConfig as any).extra.API_GET_CAMPAIGN;

const { width, height } = Dimensions.get("window");
const IMAGE_HEIGHT = width * 0.75; // Maintain 4:3 aspect ratio

enum CampaignStatus {
  PLANNED = "Planned",
  CANCELLED = "Canceled",
  ONGOING = "Ongoing",
  COMPLETED = "Completed",
}

const STATUS_TRANSLATIONS = {
  [CampaignStatus.PLANNED]: "Đã lên kế hoạch",
  [CampaignStatus.CANCELLED]: "Đã bị hủy",
  [CampaignStatus.ONGOING]: "Đang diễn ra",
  [CampaignStatus.COMPLETED]: "Đã hoàn tất",
} as const;

const STATUS_COLORS: { [key: string]: string } = {
  [CampaignStatus.PLANNED]: Colors.orange500,
  [CampaignStatus.CANCELLED]: Colors.lightRed,
  [CampaignStatus.ONGOING]: Colors.blue500,
  [CampaignStatus.COMPLETED]: Colors.lightGreen,
};

const CampaignDetail: React.FC = () => {
  const navigation = useNavigation();
  const { isAuthenticated, userData } = useAuthCheck();
  const route = useRoute<"CampaignDetail">();
  const { campaignId } = route.params;

  const [campaign, setCampaign] = useState<ICampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showListItemsDialog, setShowListItemsDialog] = useState(false);
  const [listCategories, setListCategories] = useState<string[]>([]);
  const [listItems, setListItems] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [stringCategory, setStringCategory] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertData, setAlertData] = useState<{
    title: string;
    message: string;
    submessage: string | null;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    title: "",
    message: "",
    submessage: null,
    onConfirm: () => {},
    onCancel: () => {},
  });

  const PAGE_SIZE = 5;

  useEffect(() => {
    fetchCampaignDetail();
  }, [campaignId]);

  const fetchCampaignDetail = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `${API_GET_CAMPAIGN}/${campaignId}`
      );
      setCampaign(response.data.data);
    } catch (error) {
      console.error("Error fetching campaign detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoading && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      fetchItems(currentPage + 1, true, stringCategory);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchItems(1, false, stringCategory);
    setRefreshing(false);
  };

  const fetchItems = async (
    page: number,
    loadmore = false,
    stringCate: string
  ) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `items/category/current-user?${
          stringCate === "" ? "" : stringCate + "&"
        }campaignId=${campaign?.id}&pageIndex=${page}&sizeIndex=${PAGE_SIZE}`
      );
      const responseData = response.data.data;
      setTotalPages(responseData.totalPage);
      if (loadmore) {
        setListItems((prev) => [...prev, ...responseData.data]);
      } else {
        setListItems(responseData.data);
      }
    } catch (error) {
      console.error("Error fetching list items:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTranslation = (status: string) => {
    return STATUS_TRANSLATIONS[status as CampaignStatus] || status;
  };

  const handleShowListItemsDialog = async (campaign: ICampaignDetail) => {
    if (!isAuthenticated) {
      Alert.alert(
        "Yêu cầu đăng nhập",
        "Vui lòng đăng nhập để sử dụng tính năng này",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đăng nhập",
            onPress: () => {
              try {
                navigation.navigate("LoginScreen", undefined);
              } catch (error) {
                console.error("Navigation error:", error);
                Alert.alert("Lỗi", "Không thể chuyển đến trang đăng nhập");
              }
            },
          },
        ]
      );
      return;
    }

    // Lấy danh sách category IDs
    const listCateId = campaign.categories.map((category) => category.id);

    const stringCate = listCateId.map((id) => `categoryIds=${id}`).join("&");
    setStringCategory(stringCate);

    await fetchItems(1, false, stringCate);

    // Lưu danh sách ID (nếu cần)
    setListCategories(listCateId);

    setShowListItemsDialog(true);
  };

  const handleCancel = () => {
    setShowListItemsDialog(false);
    setSelectedProducts([]);
  };

  const checkItemInRequest = async (itemId: string) => {
    try {
      const response = await axiosInstance.post(
        `items/campaign/check-request?itemId=${itemId}`
      );

      if (response.data.isSuccess) {
        return response.data.data;
      }
    } catch (error) {
      console.error("Error checking item in request:", error);
      return false;
    }
  };

  const handleApproveIntoCampaign = async (itemId: string) => {
    try {
      const data = [itemId];
      const response = await axiosInstance.post(
        `${API_GET_CAMPAIGN}/add-item?campaignId=${campaign?.id}`,
        data
      );

      if (response.data.isSuccess) {
        // Reset form
        setShowAlertDialog(true);
        setAlertData({
          title: "Thành công",
          message: `Chúng tôi sẽ gửi thông báo đến trong thời gian sớm nhất.`,
          submessage: null,
          onConfirm: () => {
            setShowAlertDialog(false);
          },
          onCancel: () => {
            setShowAlertDialog(false);
          },
        });
      }
    } catch (error) {
      setShowAlertDialog(true);
      setAlertData({
        title: "Thất bại",
        message:
          error instanceof Error ? error.message : "Bạn không thể tạo yêu cầu",
        submessage: null,
        onConfirm: () => setShowAlertDialog(false),
        onCancel: () => setShowAlertDialog(false),
      });
    }
  };

  const handleCancelRelatedRequest = async (itemId: string) => {
    try {
      const response = await axiosInstance.post(
        `items/campaign/cancel-related-request-of-item?itemId=${itemId}`
      );

      if (response.data.isSuccess) {
        handleApproveIntoCampaign(itemId);
      }
    } catch (error) {
      console.error("Error checking item in request:", error);
      return false;
    }
  };

  const handleConfirm = async () => {
    if (selectedProducts.length === 0) return;

    selectedProducts.map(async (selectedProduct) => {
      const checked = await checkItemInRequest(selectedProduct);

      if (!checked) {
        setShowListItemsDialog(false);
        setShowAlertDialog(true);
        setAlertData({
          title: "Thất bại",
          message:
            "Bạn sản phầm này của bạn đang nằm trong giao dịch đang được thực hiện, nếu bạn xác muốn tham gia chiến dịch này, bạn sẽ bị hủy các giao dịch hiện tại.",
          submessage: "Bạn có muốn tiếp tục không?",
          onConfirm: () => {
            handleCancelRelatedRequest(selectedProduct);
          },
          onCancel: () => {
            setShowAlertDialog(false), setShowListItemsDialog(true);
          },
        });
      } else {
        handleApproveIntoCampaign(selectedProduct);
      }
      setShowListItemsDialog(false);
      setSelectedProducts([]);
    });
  };

  const handlePressProduct = (productId: string) => {
    setSelectedProducts((prevSelected) => {
      if (prevSelected.includes(productId)) {
        return prevSelected.filter((id) => id !== productId); // Bỏ chọn nếu đã chọn trước đó
      } else {
        return [...prevSelected, productId]; // Thêm vào danh sách nếu chưa chọn
      }
    });
  };

  const renderTextListCategories = () => {
    return campaign?.categories
      .map((category: CategoryCampaign) => `${category.name}`)
      .join(", ");
  };

  const renderImageCounter = () => {
    if (!campaign?.images || campaign.images.length <= 1) return null;
    return (
      <View style={styles.imageCounter}>
        <Text style={styles.imageCounterText}>
          {currentImageIndex + 1}/{campaign.bannerPicture ? campaign.images.length + 1 : campaign.images.length}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.orange500} />
      </View>
    );
  }

  if (!campaign) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color={Colors.red500} />
        <Text style={styles.errorText}>Không tìm thấy chiến dịch</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Images Section */}
        <View style={styles.imagesContainer}>
          <FlatList
            data={
              campaign.bannerPicture
                ? [campaign.bannerPicture, ...campaign.images]
                : campaign.images
            }
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(
                e.nativeEvent.contentOffset.x / width
              );
              setCurrentImageIndex(newIndex);
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.image}
                resizeMode="cover"
              />
            )}
            keyExtractor={(item, index) => index.toString()}
          />
          {renderImageCounter()}
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Header Section */}
          <View>
            <Text style={styles.campaignName}>{campaign.name}</Text>
            <View style={styles.headerSection}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${STATUS_COLORS[campaign.status]}15` },
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: STATUS_COLORS[campaign.status] },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: STATUS_COLORS[campaign.status] },
                  ]}
                >
                  {getStatusTranslation(campaign.status)}
                </Text>
              </View>
            </View>

            <View style={styles.wrapperText}>
              <Text style={styles.campaignDetail}>
                <Icon name="groups" size={14} /> Số lượt tiếp cận:{" "}
                {campaign.totalParticipants}
              </Text>
              <Text style={styles.campaignDetail}>
                <Icon name="archive" size={14} /> Số sản phẩm đã quyên góp:{" "}
                {campaign.totalItems}
              </Text>
            </View>
          </View>

          {/* Time Section */}
          <View style={styles.timeCard}>
            <View style={styles.timeItem}>
              <Icon name="event" size={24} color={Colors.orange500} />
              <View style={styles.timeTextContainer}>
                <Text style={styles.timeLabel}>Bắt đầu</Text>
                <Text style={styles.timeValue}>
                  {formatDate_HHmm_DD_MM_YYYY(campaign.startDate)}
                </Text>
              </View>
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeItem}>
              <Icon name="event-busy" size={24} color={Colors.orange500} />
              <View style={styles.timeTextContainer}>
                <Text style={styles.timeLabel}>Kết thúc</Text>
                <Text style={styles.timeValue}>
                  {formatDate_HHmm_DD_MM_YYYY(campaign.endDate)}
                </Text>
              </View>
            </View>
          </View>

          {/* Description Section */}
          {campaign.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Mô tả chiến dịch</Text>
              <Text style={styles.descriptionText}>{campaign.description}</Text>
            </View>
          )}

          {/* Categories Section */}
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Danh mục cần quyên góp</Text>
            <View style={styles.categoriesList}>
              {campaign.categories.map((category) => (
                <View key={category.id} style={styles.categoryCard}>
                  <Text style={styles.childCategory}>{category.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Categories Section */}
          {campaign.images.length !== 0 && (
            <View>
              <Text style={styles.sectionTitle}>Hình ảnh về chiến dịch</Text>
              <FlatList
                data={campaign.images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const newIndex = Math.round(
                    e.nativeEvent.contentOffset.x / width
                  );
                  setCurrentImageIndex(newIndex);
                }}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => setSelectedImage(item)}>
                    <Image
                      source={{ uri: item }}
                      style={styles.subImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => index.toString()}
              />
            </View>
          )}

          {campaign.topParticipants.length !== 0 && (
            <View style={styles.topParticipantsSection}>
              <Text style={styles.sectionTitle}>Top người đóng góp</Text>
              <ScrollView contentContainerStyle={styles.scrollContainer}>
                {campaign.topParticipants.slice(0, 3).map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.card,
                      index === 0 && styles.firstPlace,
                      index === 1 && styles.secondPlace,
                      index === 2 && styles.thirdPlace,
                    ]}
                  >
                    <View style={styles.rank}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <Image
                      source={{ uri: item.profilePicture }}
                      style={styles.profilePicture}
                    />
                    <View style={styles.details}>
                      <Text style={styles.username}>{item.fullname}</Text>
                      <Text style={styles.points}>
                        {item.totalItemForCampaign} sản phẩm
                      </Text>
                    </View>
                    <Icon
                      name="star"
                      color={
                        index === 0
                          ? "#FFB800"
                          : index === 1
                          ? "#B0B0B0"
                          : "#D4794A"
                      }
                      size={24}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {campaign.status === "Ongoing" && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.requestButton]}
                onPress={() => handleShowListItemsDialog(campaign)}
              >
                <Text style={styles.buttonText}>Tham gia chiến dịch</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showListItemsDialog}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Chọn sản phẩm quyên góp</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.orange500} />
              </View>
            ) : (
              <>
                <ScrollView
                  style={styles.modalScrollView}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                      tintColor="#007AFF"
                    />
                  }
                  onScroll={({ nativeEvent }) => {
                    const { layoutMeasurement, contentOffset, contentSize } =
                      nativeEvent;
                    const isCloseToBottom =
                      layoutMeasurement.height + contentOffset.y >=
                      contentSize.height - 1000;

                    if (isCloseToBottom) {
                      handleLoadMore();
                    }
                  }}
                  scrollEventThrottle={400}
                >
                  <View>
                    <Text style={styles.modalHeader}>
                      Cảm ơn bạn đã muốn quyên góp, chiến dịch của chúng tôi
                      đang nhận các món đồ thuộc danh mục:{" "}
                      {renderTextListCategories()}
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.sectionTitle}>
                      Danh sách sản phẩm của bạn
                    </Text>
                  </View>

                  {/* List Items */}
                  {listItems.length === 0 && (
                    <View style={styles.errorContainer}>
                      <Icon
                        name="error-outline"
                        size={48}
                        color={Colors.red500}
                      />
                      <Text style={styles.errorText}>
                        Bạn không có sản phẩm nào phù hợp
                      </Text>
                    </View>
                  )}

                  {listItems.length > 1 && (
                    <>
                      {selectedProducts.length < listItems.length ? (
                        <TouchableOpacity
                          style={styles.selectAllButton}
                          onPress={() =>
                            setSelectedProducts(listItems.map((item) => item.id))
                          }
                        >
                          <Text style={styles.selectAllButtonText}>
                            Chọn tất cả
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.selectAllButton}
                          onPress={() => setSelectedProducts([])}
                        >
                          <Text style={styles.selectAllButtonText}>
                            Bỏ chọn tất cả
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}


                  <View style={styles.modalContent}>
                    {listItems.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        style={
                          selectedProducts.includes(product.id)
                            ? styles.selectedProductSection
                            : styles.currentProductSection
                        }
                        onPress={() => handlePressProduct(product.id)}
                      >
                        <Image
                          source={{ uri: product?.images[0] }}
                          style={styles.currentProductImage}
                        />
                        <View style={styles.currentProductInfo}>
                          <Text style={styles.currentProductName}>
                            {product?.name}
                          </Text>
                          <Text style={styles.currentProductCategory}>
                            {product?.category.parentName},{" "}
                            {product?.category.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Fixed Button Container */}
                <View style={styles.fixedButtonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                  >
                    <Text style={styles.buttonText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.confirmButton,
                      selectedProducts.length === 0 && styles.disabledButton,
                      // (product.isGift
                      //   ? selectedTimeSlots.length === 0
                      //   : (!selectedUserItem && moreImages.length === 0) ||
                      //     selectedTimeSlots.length === 0) && styles.disabledButton,
                    ]}
                    onPress={handleConfirm}
                    disabled={selectedProducts.length === 0}
                  >
                    <Text style={styles.buttonText}>Xác nhận</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedImage} transparent>
        <View style={styles.modalShowImageContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={{ color: "#888" }}>Đóng</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
      <CustomAlert
        visible={showAlertDialog}
        title={alertData.title}
        message={alertData.message}
        submessage={alertData.submessage}
        onConfirm={alertData.onConfirm}
        onCancel={alertData.onCancel}
        showCancelButton={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  centeredView: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    backgroundColor: "white",
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    height: "90%",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.gray900,
    paddingTop: 24,
    paddingBottom: 0,
    textAlign: "center",
  },
  modalScrollView: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  modalContent: {
    gap: 16,
  },
  modalHeader: {
    fontSize: 14,
    fontStyle: "italic",
    color: Colors.gray900,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.gray700,
  },
  content: {
    flex: 1,
  },
  imagesContainer: {
    height: IMAGE_HEIGHT,
    backgroundColor: Colors.gray100,
  },
  image: {
    width,
    height: IMAGE_HEIGHT,
  },
  subImage: {
    width: width / 4,
    height: width / 4,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  imageCounter: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  mainContent: {
    padding: 16,
    gap: 24,
  },
  headerSection: {
    flexDirection: "row",
  },
  wrapperStatus: {
    gap: 12,
    width: "30%",
  },
  wrapperText: {
    gap: 12,
    // width: "70%",
  },
  campaignName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.gray900,
    marginBottom: 12,
  },
  campaignDetail: {
    fontSize: 14,
    color: Colors.gray900,
    textAlign: "right",
  },
  statusBadge: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  timeCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 16,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  timeTextContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: Colors.gray600,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray900,
    marginTop: 4,
  },
  timeDivider: {
    height: 1,
    backgroundColor: Colors.gray200,
  },
  descriptionSection: {
    borderRadius: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.gray900,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.gray700,
  },
  categoriesSection: {
    // gap: 12,
  },
  topParticipantsSection: {
    alignItems: "center",
  },
  categoriesList: {
    gap: 8,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  parentCategory: {
    flex: 1,
    fontSize: 15,
    color: Colors.gray700,
    fontWeight: "500",
  },
  childCategory: {
    flex: 1,
    fontSize: 15,
    color: Colors.gray900,
    fontWeight: "500",
  },
  footerSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    paddingTop: 16,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: Colors.gray600,
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestButton: {
    backgroundColor: Colors.orange500,
    color: "white",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  currentProductSection: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  selectedProductSection: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderColor: Colors.orange500,
    borderWidth: 2,
    borderRadius: 8,
  },
  currentProductImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  currentProductInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  currentProductName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  currentProductCategory: {
    fontSize: 14,
    color: Colors.gray600,
  },
  fixedButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16, // Account for iPhone notch
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "white",
  },
  cancelButton: {
    width: "48%",
    backgroundColor: Colors.lightRed,
  },
  confirmButton: {
    width: "48%",
    backgroundColor: Colors.orange600,
  },
  disabledButton: {
    opacity: 0.5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  scrollContainer: {
    width: "100%",
    alignItems: "center",
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 8,
  },
  firstPlace: {
    backgroundColor: '#FFF9E6',
    borderColor: '#FFB800',
    borderWidth: 2,
  },
  secondPlace: {
    backgroundColor: '#F5F5F5',
    borderColor: '#B0B0B0',
    borderWidth: 2,
  },
  thirdPlace: {
    backgroundColor: '#FFF0E6',
    borderColor: '#D4794A',
    borderWidth: 2,
  },
  rank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4a4a4a',
  },
  profilePicture: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  points: {
    fontSize: 14,
    color: '#666',
  },
  modalShowImageContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: width * 0.9,
    height: height * 0.7,
  },
  closeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  selectAllButton: {
    width: "40%",
    padding: 12,
    backgroundColor: Colors.orange300,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectAllButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default CampaignDetail;
