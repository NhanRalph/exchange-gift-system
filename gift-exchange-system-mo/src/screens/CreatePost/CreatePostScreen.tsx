import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, Checkbox, RadioButton } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Picker } from "@react-native-picker/picker";
import {
  RouteProp,
  NavigationProp,
  useFocusEffect,
} from "@react-navigation/native";
import { RootStackParamList } from "@/src/layouts/types/navigationTypes";
import * as ImagePicker from "expo-image-picker";
import { CustomAlert } from "@/src/components/CustomAlert";
import { Dropdown } from "react-native-element-dropdown";

import MediaUploadSection from "@/src/components/MediaUploadSection";
import {
  Campaign,
  Category,
  ConditionOption,
  DayTimeFrame,
  ItemCondition,
  SubCategory,
  TIME_SLOTS,
} from "@/src/shared/type";

import useCategories from "@/src/hooks/useCategories";
import useCreatePost from "@/src/hooks/useCreatePost";
import { useCategoryStore } from "@/src/stores/categoryStore";
import Colors from "@/src/constants/Colors";
import {
  NotificationData,
  useNotificationStore,
} from "@/src/stores/notificationStore";
import { useAuthCheck } from "@/src/hooks/useAuth";
import { usePostContext } from "@/src/context/PostContext";
import { postService } from "@/src/services/postService";
import { formatDate, formatDate_DD_MM_YYYY } from "@/src/shared/formatDate";

interface CreatePostScreenProps {
  route: RouteProp<RootStackParamList, "CreatePost">;
  navigation: NavigationProp<RootStackParamList>;
}

const CustomCheckbox = ({
  checked,
  onPress,
  label,
}: {
  checked: boolean;
  onPress: () => void;
  label: string;
}) => {
  return (
    <TouchableOpacity
      style={styles.customCheckboxContainer}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  navigation,
  route,
}) => {
  const { sendNotification } = useNotificationStore();
  const { userData } = useAuthCheck();
  const initialCategory = route.params?.category;
  const initialCategoryId = route.params?.categoryId;
  const initialSubCategory = route.params?.subCategory;
  const initialSubCategoryId = route.params?.subCategoryId;

  const { categories, subCategories, getSubCategories } = useCategories();
  const { addressData, loading, submitPost } = useCreatePost();
  const setCategoryStore = useCategoryStore((state) => state.setCategory);
  const setSubCategoryStore = useCategoryStore((state) => state.setSubCategory);
  const [isFromPreview, setIsFromPreview] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    () => {
      if (initialCategory) {
        setCategoryStore(initialCategory);
        return initialCategory;
      }
      if (initialCategoryId) {
        const category = categories.find((cat) => cat.id === initialCategoryId);
        if (category) setCategoryStore(category);
        return category || null;
      }
      return null;
    }
  );

  const [selectedSubCategory, setSelectedSubCategory] =
    useState<SubCategory | null>(() => {
      if (initialSubCategory) {
        setSubCategoryStore(initialSubCategory);
        return initialSubCategory;
      }
      if (initialSubCategoryId) {
        const subCategory = subCategories.find(
          (subCat) => subCat.id === initialSubCategoryId
        );
        if (subCategory) setSubCategoryStore(subCategory);
        return subCategory || null;
      }
      return null;
    });

  const {
    isFirstRender,
    title,
    description,
    selectedAddressId,
    images,
    selectedImage,
    video,
    condition,
    isExchange,
    isGift,
    timePreference,
    dayTimeFrames,
    desiredCategoryId,
    desiredSubCategoryId,
    isTermsAccepted,
    isUploadingImage,
    isUploadingVideo,
    isLoading,
    campaigns,
    setCampaigns,
    selectedCampaign,
    setSelectedCampaign,
    showTitleHint,
    showDescriptionHint,
    showSuccessAlert,
    showConfirmAlert,
    selectedDayForFrame,
    frameStartTime,
    frameEndTime,
    showStartTimePicker,
    showEndTimePicker,
    setSelectedDayForFrame,
    setFrameStartTime,
    setFrameEndTime,
    setShowStartTimePicker,
    setShowEndTimePicker,
    setIsFirstRender,
    setTitle,
    setDescription,
    setSelectedAddressId,
    setImages,
    setSelectedImage,
    setVideo,
    setCondition,
    setIsExchange,
    setIsGift,
    setTimePreference,
    setDayTimeFrames,
    setDesiredCategoryId,
    setDesiredSubCategoryId,
    setIsTermsAccepted,
    setIsUploadingImage,
    setIsUploadingVideo,
    setIsLoading,
    setShowTitleHint,
    setShowDescriptionHint,
    setShowSuccessAlert,
    setShowConfirmAlert,
  } = usePostContext();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setImages([]);
    setVideo("");
    setCondition("");
    setIsExchange(false);
    setIsGift(false);
    setTimePreference("allDay");
    setDayTimeFrames([]);
    setDesiredCategoryId("");
    setDesiredSubCategoryId("");
    setIsTermsAccepted(false);
    setSelectedAddressId("");
    setSelectedImage(null);
    setIsUploadingImage(false);
    setIsUploadingVideo(false);
    setIsLoading(false);
    setShowTitleHint(false);
    setShowDescriptionHint(false);
    setSelectedCampaign(null);
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!isFirstRender) {
        if (!isFromPreview) {
          resetForm();
          setIsFromPreview(false);
        }
      } else {
        setIsFirstRender(false);
      }

      return () => {
        // Cleanup
      };
    }, [isFirstRender, isFromPreview])
  );

  useEffect(() => {
    if (addressData.length > 0) {
      const defaultAddress = addressData.find((addr) => addr.isDefault);
      setSelectedAddressId(
        defaultAddress?.addressId || addressData[0].addressId
      );
    }
  }, [addressData]);

  useEffect(() => {
    if (desiredCategoryId) {
      getSubCategories(desiredCategoryId);
    }
  }, [desiredCategoryId]);

  useEffect(() => {
    if (selectedCategory) {
      fetchCampaigns();
      getSubCategories(selectedCategory.id);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (route.params?.shouldPublish) {
      handleSubmit();
      // Reset param để tránh trigger lại
      navigation.setParams({ shouldPublish: undefined });
    }
  }, [route.params?.shouldPublish]);

  const conditions: ConditionOption[] = [
    { id: ItemCondition.NEW, name: "Mới" },
    { id: ItemCondition.USED, name: "Đã sử dụng" },
  ];

  const WEEKDAYS = [
    { label: "Thứ 2", value: "mon" },
    { label: "Thứ 3", value: "tue" },
    { label: "Thứ 4", value: "wed" },
    { label: "Thứ 5", value: "thu" },
    { label: "Thứ 6", value: "fri" },
    { label: "Thứ 7", value: "sat" },
    { label: "Chủ nhật", value: "sun" },
  ];

  const fetchCampaigns = async () => {
    try {
      const response = await postService.getCampaignsByCategory(
        selectedCategory?.id as string
      );
      setCampaigns(response);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const handleAddTimeFrame = () => {
    if (!selectedDayForFrame) {
      Alert.alert("Lỗi!", "Vui lòng chọn ngày");
      return;
    }

    if (selectedDayForFrame === "all") {
      setDayTimeFrames([
        {
          day: "all",
          startTime: frameStartTime,
          endTime: frameEndTime,
        },
      ]);
      return;
    }

    if (dayTimeFrames.some((frame) => frame.day === selectedDayForFrame)) {
      Alert.alert("Lỗi!", "Ngày này đã có giờ");
      return;
    }

    const start = parseInt(frameStartTime.replace(":", ""));
    const end = parseInt(frameEndTime.replace(":", ""));
    if (start >= end) {
      Alert.alert("Lỗi!", "Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }

    setDayTimeFrames((prev) => [
      ...prev,
      {
        day: selectedDayForFrame,
        startTime: frameStartTime,
        endTime: frameEndTime,
      },
    ]);

    console.log("Day time frames:", dayTimeFrames);

    setSelectedDayForFrame("");
  };

  const handleRemoveTimeFrame = (day: string) => {
    setSelectedDayForFrame("");
    setDayTimeFrames((prev) => prev.filter((frame) => frame.day !== day));
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

  const handlePostTypeChange = (type: "exchange" | "gift") => {
    if (type === "exchange") {
      setIsExchange(true);
      setIsGift(false);
    } else {
      setIsExchange(false);
      setIsGift(true);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    setSelectedCategory(category || null);
    setSelectedSubCategory(null);

    if (category) {
      setCategoryStore(category);
      setSubCategoryStore(null);
      await getSubCategories(category.id);
    }
  };

  const handleSubCategoryChange = (subCategoryId: string) => {
    const subCategory = subCategories.find(
      (subCat) => subCat.id === subCategoryId
    );
    setSelectedSubCategory(subCategory || null);
    if (subCategory) {
      setSubCategoryStore(subCategory);
    }
  };

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

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Vui lòng nhập tiêu đề tin đăng");
      return false;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Vui lòng nhập mô tả chi tiết");
      return false;
    }
    if (!selectedCategory) {
      Alert.alert("Error", "Vui lòng chọn danh mục");
      return false;
    }
    if (!condition) {
      Alert.alert("Error", "Vui lòng chọn tình trạng sản phẩm");
      return false;
    }
    if (images.length === 0) {
      Alert.alert("Error", "Vui lòng tải lên ít nhất 1 ảnh");
      return false;
    }
    if (!timePreference) {
      Alert.alert("Error", "Vui lòng chọn giờ nhận");
      return false;
    }
    if (!desiredCategoryId && isExchange) {
      Alert.alert("Error", "Vui lòng chọn sản phẩm mong muốn trao đổi");
      return false;
    }
    return true;
  };

  const handleImageUpload = async () => {
    try {
      setIsUploadingImage(true);
      const uri = await postService.pickImage();

      if (!uri) return;

      if (uri) {
        const imageUrl = await postService.uploadImageToCloudinary(uri);
        setImages((prev) => [...prev, imageUrl]);
      }
    } catch (error) {
      Alert.alert("Upload Failed", "Please try again");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCaptureImage = async () => {
    try {
      setIsUploadingImage(true);
      const uri = await postService.captureImage();

      if (uri) {
        const imageUrl = await postService.uploadImageToCloudinary(uri);
        setImages((prev) => [...prev, imageUrl]);
      }
    } catch (error) {
      Alert.alert("Error", `Failed to capture and upload image ${error}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const pickVideo = async () => {
    try {
      setIsUploadingVideo(true);

      const uri = await postService.pickVideo();
      if (!uri) return;

      const videoUrl = await postService.uploadVideoToCloudinary(uri);

      setVideo(videoUrl);
    } catch (error) {
      Alert.alert("Upload Failed", "Failed to upload video. Please try again");
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const removeVideo = () => {
    console.log("Removing video from state");
    setVideo("");
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, idx) => idx !== index);
    setImages(newImages);
  };

  const handleAlertConfirm = () => {
    setShowSuccessAlert(false);
    navigation.navigate("Main", {
      screen: "Home",
    });
  };

  const handlePreview = () => {
    if (!validateForm()) return;

    const selectedAddress = addressData.find(
      (addr) => addr.addressId === selectedAddressId
    );

    setIsFromPreview(true);

    navigation.navigate("PreviewPost", {
      title,
      description,
      category: selectedCategory,
      subCategory: selectedSubCategory,
      condition,
      images,
      video,
      isExchange,
      isGift,
      timePreference,
      dayTimeFrames,
      campaign: selectedCampaign,
      address: selectedAddress?.address || "No address provided",
      desiredCategory: categories.find((cat) => cat.id === desiredCategoryId),
      desiredSubCategory: subCategories.find(
        (subCat) => subCat.id === desiredSubCategoryId
      ),
      addressId: selectedAddressId,
      onSubmitPost: submitPost,
    });
  };

  const handleSubmitConfirm = () => {
    setShowConfirmAlert(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setShowConfirmAlert(false);
      setIsLoading(true);

      const postData = {
        name: title.trim(),
        description: description.trim(),
        categoryId: selectedSubCategory!.id,
        isGift: isGift,
        quantity: 1,
        condition: condition,
        images,
        video,
        availableTime: getAvailableTimeString(timePreference),
        addressId: selectedAddressId,
        campaignId: selectedCampaign ? selectedCampaign.id : null,
        desiredCategoryId:
          desiredSubCategoryId === "" ? null : desiredSubCategoryId,
      };

      console.log("Form Data: ", postData);

      const response = await submitPost(postData);

      console.log("Submit response:", response);

      navigation.navigate("Main", {
        screen: "Home",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to create post");
      console.error("Submit error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTimePress = () => {
    setShowStartTimePicker(true);
  };

  const handleEndTimePress = () => {
    setShowEndTimePicker(true);
  };

  const CustomPerDayTimeSection = () => {
    return (
      <View style={styles.customPerDayContainer}>
        <Text style={styles.timeSelectionHeader}>
          Chọn thời gian có thể nhận
        </Text>

        {/* Day Selection Grid */}
        <View style={styles.daySelectionGrid}>
          <TouchableOpacity
            style={[
              styles.dayChip,
              selectedDayForFrame === "all" && styles.dayChipSelected,
            ]}
            onPress={() => setSelectedDayForFrame("all")}
          >
            <Text
              style={[
                styles.dayChipText,
                selectedDayForFrame === "all" && styles.dayChipTextSelected,
              ]}
            >
              Tất cả các ngày
            </Text>
          </TouchableOpacity>
          {WEEKDAYS.map((day) => {
            const isSelected = day.value === selectedDayForFrame;
            const isDisabled =
              dayTimeFrames.some((frame) => frame.day === day.value) ||
              selectedDayForFrame === "all";

            return (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayChip,
                  isSelected && styles.dayChipSelected,
                  isDisabled && styles.dayChipDisabled,
                ]}
                onPress={() => setSelectedDayForFrame(day.value)}
                disabled={isDisabled}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    isSelected && styles.dayChipTextSelected,
                    isDisabled && styles.dayChipTextDisabled,
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Time Selection */}
        {selectedDayForFrame && (
          <View style={styles.timePickerContainer}>
            <Text style={styles.timeFrameLabel}>
              Chọn giờ có thể nhận cho{" "}
              {selectedDayForFrame === "all"
                ? "tất cả các ngày"
                : WEEKDAYS.find((d) => d.value === selectedDayForFrame)?.label}
            </Text>

            <View style={styles.timePickersRow}>
              <View style={styles.timePickerWrapper}>
                <Text style={styles.timeLabel}>Từ</Text>
                <View style={styles.timeInputContainer}>
                  <TextInput
                    style={styles.timeInput}
                    value={frameStartTime}
                    editable={false}
                    placeholder="00:00"
                  />
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={handleStartTimePress}
                  >
                    <Text style={styles.timePickerButtonText}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.timePickerWrapper}>
                <Text style={styles.timeLabel}>Đến</Text>
                <View style={styles.timeInputContainer}>
                  <TextInput
                    style={styles.timeInput}
                    value={frameEndTime}
                    editable={false}
                    placeholder="00:00"
                  />
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={handleEndTimePress}
                  >
                    <Text style={styles.timePickerButtonText}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {showStartTimePicker && (
              <Picker
                selectedValue={frameStartTime}
                onValueChange={(itemValue) => {
                  setFrameStartTime(itemValue);
                  setShowStartTimePicker(false);
                }}
              >
                {TIME_SLOTS.map((slot) => (
                  <Picker.Item
                    key={slot.value}
                    label={slot.label}
                    value={slot.value}
                  />
                ))}
              </Picker>
            )}

            {showEndTimePicker && (
              <Picker
                selectedValue={frameEndTime}
                onValueChange={(itemValue) => {
                  setFrameEndTime(itemValue);
                  setShowEndTimePicker(false);
                }}
              >
                {TIME_SLOTS.map((slot) => (
                  <Picker.Item
                    key={slot.value}
                    label={slot.label}
                    value={slot.value}
                  />
                ))}
              </Picker>
            )}

            <TouchableOpacity
              style={styles.addFrameButton}
              onPress={handleAddTimeFrame}
            >
              <Text style={styles.addFrameButtonText}>Thêm thời gian</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Selected Time Frames */}
        {dayTimeFrames.length > 0 && (
          <View style={styles.selectedFramesContainer}>
            <Text style={styles.selectedFramesTitle}>Thời gian đã chọn:</Text>
            {dayTimeFrames.map((frame) => (
              <View key={frame.day} style={styles.selectedFrameCard}>
                <View style={styles.frameInfo}>
                  <Text style={styles.frameDayText}>
                    {frame.day === "all"
                      ? "Tất cả các ngày"
                      : WEEKDAYS.find((d) => d.value === frame.day)?.label}
                  </Text>
                  <Text style={styles.frameTimeText}>
                    {frame.startTime} - {frame.endTime}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveTimeFrame(frame.day)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeIcon}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Định dạng data cho dropdown
  const categoryData = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  const subCategoryData = subCategories.map((subCat) => ({
    label: subCat.name,
    value: subCat.id,
  }));

  const conditionData = conditions.map((condition) => ({
    label: condition.name,
    value: condition.id,
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng Tin</Text>
        <View style={styles.headerSpace} />
      </View>

      <ScrollView style={styles.content}>
        {/* Category Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh Mục</Text>
          <View style={styles.categoryContainer}>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={categoryData}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Chọn danh mục"
              value={selectedCategory?.id}
              onChange={(item) => {
                handleCategoryChange(item.value);
              }}
            />

            {selectedCategory && (
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                data={subCategoryData}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Chọn danh mục phụ"
                value={selectedSubCategory?.id}
                onChange={(item) => {
                  handleSubCategoryChange(item.value);
                }}
              />
            )}
          </View>

          {/* Condition Dropdown */}
          <View style={[styles.pickerWrapper, styles.conditionWrapper]}>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={conditionData}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Chọn tình trạng sản phẩm"
              value={condition}
              onChange={(item) => {
                setCondition(item.value);
              }}
            />
          </View>
        </View>

        {/* Media Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THÔNG TIN CHI TIẾT</Text>

          <MediaUploadSection
            images={images}
            video={video}
            selectedImage={selectedImage}
            isLoading={isUploadingImage}
            isVideoLoading={isUploadingVideo}
            onPickImage={handleImageUpload}
            onCaptureImage={handleCaptureImage}
            onPickVideo={pickVideo}
            onRemoveImage={removeImage}
            onRemoveVideo={removeVideo}
          />
        </View>

        {/* Post Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HÌNH THỨC</Text>
          <View style={styles.postTypeContainer}>
            <RadioButton.Group
              onValueChange={(value) =>
                handlePostTypeChange(value as "exchange" | "gift")
              }
              value={isExchange ? "exchange" : "gift"}
            >
              <View style={styles.radioOption}>
                <RadioButton.Item
                  label="Tôi muốn trao đổi"
                  value="exchange"
                  position="trailing"
                />
              </View>
              <View style={styles.radioOption}>
                <RadioButton.Item
                  label="Tôi muốn cho tặng miễn phí"
                  value="gift"
                  position="trailing"
                />
              </View>
            </RadioButton.Group>
          </View>

          {/* Desired Category Dropdown (for exchange) */}
          {isExchange && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Danh mục muốn trao đổi</Text>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                data={categoryData}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Chọn danh mục"
                value={desiredCategoryId}
                onChange={(item) => {
                  setDesiredCategoryId(item.value);
                  setDesiredSubCategoryId(null);
                }}
              />

              {desiredCategoryId && (
                <Dropdown
                  style={[styles.dropdown, { marginTop: 12 }]}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  data={subCategoryData}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Chọn danh mục phụ"
                  value={desiredSubCategoryId}
                  onChange={(item) => {
                    setDesiredSubCategoryId(item.value);
                  }}
                />
              )}
            </View>
          )}
        </View>

        {/* Title and Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            TIÊU ĐỀ TIN ĐĂNG VÀ MÔ TẢ CHI TIẾT
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Tiêu đề tin đăng"
            value={title}
            onChangeText={setTitle}
            onFocus={() => setShowTitleHint(true)}
            onBlur={() => setShowTitleHint(false)}
          />
          {showTitleHint && (
            <Text style={styles.hint}>
              Tiêu đề tốt nên ngắn gọn, đầy đủ thông tin quan trọng
            </Text>
          )}

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mô tả chi tiết"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            onFocus={() => setShowDescriptionHint(true)}
            onBlur={() => setShowDescriptionHint(false)}
          />

          {showDescriptionHint && (
            <Text style={styles.hint}>
              Không được phép ghi thông tin liên hệ trong mô tả
            </Text>
          )}
        </View>

        {/* Campaign Section */}
        {!isExchange &&
          condition &&
          images.length > 0 &&
          title.trim() !== "" &&
          description.trim() !== "" &&
          campaigns.length > 0 && (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>CHIẾN DỊCH THIỆN NGUYỆN</Text>
                  {/* <TouchableOpacity
                    style={styles.viewMoreButton}
                    // onPress={() => navigation.navigate("Campaigns")}
                  >
                    <Text style={styles.viewMoreButtonText}>Xem thêm</Text>

                    <Icon
                      name="arrow-right-alt"
                      size={12}
                      color={Colors.gray500}
                    />
                  </TouchableOpacity> */}
                </View>
                <View style={styles.campaignList}>
                  <Text style={styles.sectionSub}>
                    Sản phẩm của bạn phù hợp với một số chiến dịch sau, hãy tham
                    gia với chúng tôi để có thể giúp đỡ những mảnh đời khó khăn hơn bạn:
                  </Text>
                  {campaigns.map((campaign) => (
                    <TouchableOpacity
                      style={[
                        styles.campaignCard,
                        selectedCampaign?.id === campaign.id &&
                          styles.selectedCampaignCard,
                      ]}
                      key={campaign.id}
                      onPress={() => {
                        const newCampaign = selectedCampaign?.id === campaign.id ? null : campaign;
                        setSelectedCampaign(newCampaign);
                      }}

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
                        <Text
                          style={styles.campaignDescription}
                          numberOfLines={1}
                        >
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
                    </TouchableOpacity>
                  ))}
                </View>

                {/* you code here */}
              </View>
            </>
          )}

        {/* Time Availability Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THỜI GIAN CÓ THỂ NHẬN</Text>
          <RadioButton.Group
            onValueChange={(value) => setTimePreference(value)}
            value={timePreference}
          >
            <View style={styles.radioOption}>
              <RadioButton.Item
                label="Cả ngày (9h - 21h hằng ngày)"
                value="allDay"
                position="trailing"
              />
            </View>
            <View style={styles.radioOption}>
              <RadioButton.Item
                label="Giờ hành chính (9h - 17h)"
                value="officeHours"
                position="trailing"
              />
            </View>
            <View style={styles.radioOption}>
              <RadioButton.Item
                label="Chỉ buổi tối (17h - 21h)"
                value="evening"
                position="trailing"
              />
            </View>
            <View style={styles.radioOption}>
              <RadioButton.Item
                label="Khung giờ tự chọn"
                value="custom"
                position="trailing"
              />
            </View>
          </RadioButton.Group>

          {timePreference === "custom" && <CustomPerDayTimeSection />}
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ĐỊA CHỈ</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#0000ff" />
          ) : (
            <View style={styles.addressContainer}>
              {addressData.map((address) => (
                <TouchableOpacity
                  key={address.addressId}
                  style={[
                    styles.addressCard,
                    selectedAddressId === address.addressId &&
                      styles.selectedAddressCard,
                  ]}
                  onPress={() => setSelectedAddressId(address.addressId)}
                >
                  <View style={styles.addressRadioContainer}>
                    <View style={styles.radioOuter}>
                      {selectedAddressId === address.addressId && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <View style={styles.addressTextContainer}>
                      <Text style={styles.addressText}>{address.address}</Text>
                      {address.isDefault && (
                        <Text style={styles.defaultBadge}>Mặc định</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Terms and Conditions Checkbox */}
        <View style={styles.section}>
          <CustomCheckbox
            checked={isTermsAccepted}
            onPress={() => setIsTermsAccepted(!isTermsAccepted)}
            label="Tôi cam kết các thông tin là chính xác và đúng với thực tế"
          />
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.footerButton,
            styles.previewButton,
            !isTermsAccepted && styles.disabledButton,
          ]}
          onPress={handlePreview}
          disabled={!isTermsAccepted}
        >
          <Text style={{ color: "black" }}>Xem trước</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.footerButton,
            styles.publishButton,
            !isTermsAccepted && styles.disabledButton,
          ]}
          onPress={handleSubmitConfirm}
          disabled={!isTermsAccepted || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Đăng bài</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Confirm Alert */}
      <CustomAlert
        visible={showConfirmAlert}
        title="Xác nhận"
        message="Bạn có chắc chắn muốn đăng sản phẩm này?"
        onConfirm={handleSubmit}
        onCancel={() => setShowConfirmAlert(false)}
        showCancelButton={true}
      />

      {/* Success Alert */}
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
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    fontSize: 24,
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSpace: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginBottom: 12,
  },
  viewMoreButtonText: {
    fontSize: 12,
    color: Colors.gray500,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sectionSub: {
    color: Colors.gray500,
    fontSize: 14,
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginBottom: 12,
  },
  mediaButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  uploadButton: {
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  videoPreview: {
    width: "100%",
    height: 200,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  hint: {
    color: "#666",
    fontSize: 12,
    marginBottom: 12,
    fontStyle: "italic",
  },
  addressContainer: {
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  footerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  previewButton: {
    backgroundColor: "#f0f0f0",
  },
  publishButton: {
    backgroundColor: "#f97314",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  postTypeContainer: {
    marginBottom: 16,
  },
  radioOption: {
    marginVertical: 4,
  },
  exchangeHint: {
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  timePicker: {
    flex: 1,
    marginLeft: 8,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  addressCard: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedAddressCard: {
    borderColor: Colors.orange500,
    // backgroundColor: Colors.orange50,
  },
  addressRadioContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.orange500,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: Colors.orange500,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: "#333",
  },
  defaultBadge: {
    fontSize: 12,
    color: Colors.orange500,
    marginTop: 4,
  },
  categoryContainer: {
    gap: 12,
  },
  selectedCategoryDisplay: {
    backgroundColor: Colors.orange50,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  selectedCategoryText: {
    color: Colors.orange600,
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1ABC9C",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  customTimeContainer: {
    gap: 16,
    marginTop: 16,
  },
  timeSection: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  weekdaySection: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  timePickersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginTop: 8,
  },
  timePickerWrapper: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 15,
    color: Colors.gray700,
    marginBottom: 8,
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  timeInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.gray800,
  },
  timePickerButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: Colors.gray300,
  },
  timePickerButtonText: {
    fontSize: 12,
    color: Colors.gray600,
  },
  addFrameButton: {
    backgroundColor: Colors.orange500,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  addFrameButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  selectedFramesContainer: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 12,
  },
  selectedFramesTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  timeFrameItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  timeFrameText: {
    flex: 1,
  },
  removeFrameButton: {
    padding: 4,
  },
  removeFrameButtonText: {
    color: Colors.orange500,
    fontSize: 16,
  },
  timeSelectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    color: Colors.gray800,
  },
  daySelectionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.orange300,
  },
  dayChipSelected: {
    backgroundColor: Colors.orange500,
  },
  dayChipDisabled: {
    borderColor: Colors.gray300,
    backgroundColor: Colors.gray100,
  },
  dayChipText: {
    color: Colors.orange500,
    fontSize: 14,
  },
  dayChipTextSelected: {
    color: "white",
  },
  dayChipTextDisabled: {
    color: Colors.gray400,
  },
  timePickerContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedFrameCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  frameInfo: {
    flex: 1,
  },
  frameDayText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.gray800,
    marginBottom: 4,
  },
  frameTimeText: {
    fontSize: 14,
    color: Colors.gray600,
  },
  removeButton: {
    padding: 8,
  },
  removeIcon: {
    color: Colors.lightRed,
    fontSize: 20,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  customPerDayContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  timeFrameLabel: {
    fontSize: 15,
    color: Colors.gray700,
    marginBottom: 12,
  },
  pickerWrapper: {
    marginBottom: 12,
  },
  customInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  customInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 16,
    color: Colors.gray800,
  },
  dropdownButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: Colors.gray300,
  },
  dropdownButtonText: {
    fontSize: 12,
    color: Colors.gray600,
  },
  conditionWrapper: {
    marginTop: 16,
  },
  customCheckboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.orange500,
    backgroundColor: "white",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: Colors.orange500,
  },
  checkmark: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 15,
    color: Colors.gray800,
    flex: 1,
  },
  dropdown: {
    height: 50,
    borderColor: Colors.gray300,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "white",
  },
  placeholderStyle: {
    fontSize: 16,
    color: Colors.gray500,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: Colors.gray800,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
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
  modalScrollView: {
    flex: 1,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  textCenter: {
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: "bold",
    textAlign: "left",
  },
  requestInput: {
    borderColor: "#c4c4c4",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    width: "100%",
    marginBottom: 16,
  },
  textErrorMessage: {
    color: "#e53e3e",
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    width: "48%",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#FF3B30",
  },
  confirmButton: {
    backgroundColor: "#34C759",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.7,
  },
  modalButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  //campaign
  campaignSection: {
    marginTop: 8,
  },
  campaignHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  campaignHeaderIcon: {
    marginRight: 8,
    color: Colors.orange500,
  },
  campaignHeaderText: {
    fontSize: 14,
    color: Colors.gray700,
    flex: 1,
  },
  campaignList: {
    gap: 16,
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
    padding: 10,
  },
  selectedCampaignCard: {
    borderColor: Colors.orange500,
    borderWidth: 1,
  },
  campaignImageContainer: {
    flex: 4, // Chiếm 40% chiều rộng
  },
  campaignImage: {
    width: '100%',
    height: 100,
    objectFit: 'cover',
    borderRadius: 8,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  plannedBadge: {
    backgroundColor: Colors.blue500,
  },
  ongoingBadge: {
    backgroundColor: Colors.green500,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default CreatePostScreen;
