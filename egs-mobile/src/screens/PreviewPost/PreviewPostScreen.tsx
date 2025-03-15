import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/src/constants/Colors";
import { Video, ResizeMode } from "expo-av";
import { CustomAlert } from "@/src/components/CustomAlert";
import { RootStackParamList } from "@/src/layouts/types/navigationTypes";
import { RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { formatDate_DD_MM_YYYY } from "@/src/shared/formatDate";

type PreviewPostNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PreviewPost"
>;
type PreviewPostRouteProp = RouteProp<RootStackParamList, "PreviewPost">;

interface PreviewPostScreenProps {
  navigation: PreviewPostNavigationProp;
  route: PreviewPostRouteProp;
}

const PreviewPostScreen: React.FC<PreviewPostScreenProps> = ({
  route,
  navigation,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  const screenWidth = Dimensions.get("window").width;
  const imageWidth = screenWidth - 32;
  const [currentRoute, setCurrentRoute] = useState<string | null>(null);

  const {
    title,
    description,
    category,
    subCategory,
    condition,
    images,
    video,
    isExchange,
    isGift,
    timePreference,
    dayTimeFrames,
    address,
    desiredCategory,
    desiredSubCategory,
    addressId,
    onSubmitPost,
    campaign,
  } = route.params;

  const renderIconWithLabel = (
    iconName: keyof typeof Ionicons.glyphMap,
    label: string
  ) => (
    <View style={styles.iconLabelContainer}>
      <Ionicons name={iconName} size={16} color={Colors.gray600} />
      <Text style={styles.iconLabel}>{label}</Text>
    </View>
  );

  const renderConditionBadge = (condition: string) => (
    <View style={styles.conditionBadge}>
      <Text style={styles.conditionText}>{condition}</Text>
    </View>
  );

  const getAvailableTimeString = (timePreference: string) => {
    switch (timePreference) {
      case "allDay":
        return "allDay 09:00_21:00 mon_tue_wed_thu_fri_sat_sun";
      case "officeHours":
        return "officeHours 09:00_17:00 mon_tue_wed_thu_fri";
      case "evening":
        return "evening 17:00_21:00 mon_tue_wed_thu_fri_sat_sun";
      case "custom":
        return getCustomPerDayTimeString();
      default:
        return "";
    }
  };

  const getCustomPerDayTimeString = (): string => {
    if (dayTimeFrames.length === 0) return "";

    if (dayTimeFrames.some((frame) => frame.day === "all")) {
      const frame = dayTimeFrames.find((frame) => frame.day === "all");
      return `custom ${frame?.startTime}_${frame?.endTime} mon_tue_wed_thu_fri_sat_sun`;
    }

    const frames = dayTimeFrames
      .map((frame) => `${frame.startTime}_${frame.endTime} ${frame.day}`)
      .join(" | ");

    return `customPerDay ${frames}`;
  };

  const handleAlertConfirm = () => {
    setShowSuccessAlert(false);
    navigation.navigate("Main", {
      screen: "Home",
    });
  };

  const handlePublishConfirm = () => {
    setShowConfirmAlert(true);
  };

  const handlePublish = async () => {
    try {
      setShowConfirmAlert(false);
      setIsLoading(true);

      const postData = {
        name: title.trim(),
        description: description.trim(),
        categoryId: subCategory?.id || null,
        isGift: isGift,
        quantity: 1,
        condition: condition,
        images,
        video,
        availableTime: getAvailableTimeString(timePreference),
        addressId: addressId,
        campaignId: campaign?.id || null,
        desiredCategoryId: desiredCategory?.id || null,
      };

      console.log("Form Data: ", postData);

      const response = await onSubmitPost(postData);

      if (response === true) {
        setShowSuccessAlert(true);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create post");
      console.error("Submit error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderTimePreference = () => {
    switch (timePreference) {
      case "allDay":
        return "Cả ngày (9h - 21h hằng ngày)";
      case "officeHours":
        return "Giờ hành chính (9h - 17h)";
      case "evening":
        return "Chỉ buổi tối (17h - 21h)";
      case "custom":
        return "Khung giờ tự chọn";
      default:
        return "";
    }
  };

  const getDayInVietnamese = (day: string): string => {
    switch (day) {
      case "mon":
        return "Thứ 2";
      case "tue":
        return "Thứ 3";
      case "wed":
        return "Thứ 4";
      case "thu":
        return "Thứ 5";
      case "fri":
        return "Thứ 6";
      case "sat":
        return "Thứ 7";
      case "sun":
        return "Chủ nhật";
      case "all":
        return "Tất cả các ngày";
      default:
        return day;
    }
  };

  const renderTimeFrame = (frame: any) => {
    if (frame.day === "all") {
      return `Tất cả các ngày: ${frame.startTime} - ${frame.endTime}`;
    }
    return `${getDayInVietnamese(frame.day)}: ${frame.startTime} - ${
      frame.endTime
    }`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xem Trước Bài Đăng</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView style={styles.content}>
        {/* Enhanced Media Section */}
        <View style={styles.mediaSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mediaContainer}
          >
            {/* Combine video and images into single array for rendering */}
            {[
              ...(video ? [{ type: "video", uri: video }] : []),
              ...images.map((img) => ({ type: "image", uri: img })),
            ].map((media, index, array) => (
              <View key={index} style={styles.imageWrapper}>
                {media.type === "video" ? (
                  <Video
                    source={{ uri: media.uri }}
                    style={[styles.videoPreview, { width: imageWidth }]}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                  />
                ) : (
                  <Image
                    source={{ uri: media.uri }}
                    style={[styles.mediaItem, { width: imageWidth }]}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {index + 1}/{array.length}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Enhanced Title & Description */}
        <View style={styles.mainInfoSection}>
          <Text style={styles.title}>{title}</Text>
          {renderConditionBadge(condition)}
          <Text style={styles.description}>{description}</Text>
        </View>

        {/* Enhanced Category Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Thông tin sản phẩm</Text>
          <View style={styles.categoryInfo}>
            {renderIconWithLabel(
              "folder-outline",
              `${category?.name} > ${subCategory?.name}`
            )}
            {renderIconWithLabel(
              isExchange ? "swap-horizontal" : "gift-outline",
              isExchange ? "Trao đổi" : "Cho tặng miễn phí"
            )}
          </View>

          {isExchange && desiredCategory && (
            <View style={styles.desiredItemCard}>
              <Text style={styles.desiredItemTitle}>
                Mong muốn trao đổi với:
              </Text>
              <Text style={styles.desiredItemText}>
                {`${desiredCategory.name}${
                  desiredSubCategory ? ` > ${desiredSubCategory.name}` : ""
                }`}
              </Text>
            </View>
          )}
        </View>

        {campaign && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>
              Bạn muốn quyên góp món đồ cho chiến dịch:
            </Text>
            <View
              style={[styles.campaignCard]}
              key={campaign.id}
              // onPress={() => setSelectedCampaign(campaign)}
            >
              <View style={styles.campaignImageContainer}>
                <Image
                  source={{ uri: campaign.bannerPicture }}
                  style={styles.campaignImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.campaignInfo}>
                <Text style={styles.campaignName} numberOfLines={1}>
                  {campaign.name}
                </Text>
                <Text style={styles.campaignDescription} numberOfLines={1}>
                  {campaign.description}
                </Text>
                <View style={styles.campaignFooter}>
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateText} numberOfLines={1}>
                      {formatDate_DD_MM_YYYY(campaign.startDate)} -{" "}
                      {formatDate_DD_MM_YYYY(campaign.endDate)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Enhanced Time Availability */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Thời gian có thể giao dịch</Text>
          {renderIconWithLabel("time-outline", renderTimePreference())}
          {timePreference === "custom" && (
            <View style={styles.timeFramesList}>
              {dayTimeFrames.map((frame: any, index: number) => (
                <Text key={index} style={styles.timeFrameItem}>
                  {renderTimeFrame(frame)}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Enhanced Address */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Địa điểm giao dịch</Text>
          {renderIconWithLabel("location-outline", address)}
        </View>
      </ScrollView>

      {/* Enhanced Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerButton, styles.editButton]}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Ionicons name="pencil" size={20} color={Colors.gray800} />
          <Text style={styles.editButtonText}>Sửa lại tin</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.footerButton,
            styles.publishButton,
            isLoading && styles.disabledButton,
          ]}
          onPress={handlePublishConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={20} color="#fff" />
              <Text style={styles.publishButtonText}>Đăng bài ngay</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <CustomAlert
        visible={showConfirmAlert}
        title="Xác nhận"
        message="Bạn có chắc chắn muốn đăng bài này?"
        onConfirm={handlePublish}
        onCancel={() => setShowConfirmAlert(false)}
        showCancelButton={true}
      />

      <CustomAlert
        visible={showSuccessAlert}
        title="Thành công"
        message="Bài đăng của bạn đã được tạo thành công!"
        onConfirm={handleAlertConfirm}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: -24, // Compensate for back button to center title
  },
  headerSpace: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  mediaSection: {
    height: 300,
    backgroundColor: Colors.gray100,
  },
  mediaContainer: {
    alignItems: "center",
  },
  imageWrapper: {
    position: "relative",
  },
  mediaItem: {
    height: 300,
    marginHorizontal: 16,
  },
  imageCounter: {
    position: "absolute",
    bottom: 12,
    right: 24,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  videoPreview: {
    height: 300,
    marginHorizontal: 16,
  },
  mainInfoSection: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.gray700,
    lineHeight: 24,
    marginTop: 12,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoCard: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.gray800,
    marginBottom: 12,
  },
  iconLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconLabel: {
    fontSize: 15,
    color: Colors.gray700,
    marginLeft: 8,
  },
  conditionBadge: {
    backgroundColor: Colors.orange100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  conditionText: {
    color: Colors.orange700,
    fontSize: 14,
    fontWeight: "600",
  },
  desiredItemCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.orange50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.orange200,
  },
  desiredItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.orange700,
    marginBottom: 4,
  },
  desiredItemText: {
    fontSize: 15,
    color: Colors.gray700,
  },
  timeFramesList: {
    marginTop: 8,
  },
  timeFrameItem: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 4,
    paddingLeft: 24,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
    backgroundColor: "#fff",
    gap: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: "row",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  editButton: {
    backgroundColor: Colors.gray100,
  },
  publishButton: {
    backgroundColor: Colors.orange500,
  },
  editButtonText: {
    color: Colors.gray800,
    fontWeight: "600",
    fontSize: 15,
  },
  publishButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  backButton: {
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 24,
    color: Colors.gray800,
  },
  campaignCard: {
    flexDirection: "row", // Hiển thị các phần tử trong card theo hàng ngang
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCampaignCard: {
    borderColor: Colors.orange500,
    borderWidth: 1,
  },
  campaignImageContainer: {
    flex: 4, // Chiếm 40% chiều rộng
  },
  campaignImage: {
    width: "100%",
  },
  campaignInfo: {
    flex: 6, // Chiếm 60% chiều rộng
    padding: 12,
    justifyContent: "space-between", // Dàn đều các thành phần
  },
  campaignName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray800,
    marginBottom: 4,
  },
  campaignDescription: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 12,
  },
  campaignFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: Colors.gray600,
    marginRight: 4,
  },
  dateText: {
    fontSize: 12,
    color: Colors.gray700,
  },
});

export default PreviewPostScreen;
