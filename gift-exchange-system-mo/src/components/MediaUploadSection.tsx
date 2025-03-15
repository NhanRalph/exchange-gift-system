import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Modal, TouchableWithoutFeedback } from "react-native";

interface MediaUploadSectionProps {
  images: string[];
  video: string | null;
  selectedImage: string | null;
  onPickImage: () => void;
  onPickVideo: () => void;
  onRemoveImage: (index: number) => void;
  onRemoveVideo: () => void;
  isLoading?: boolean;
  isVideoLoading?: boolean;
  canUploadVideo?: boolean;
  maxNumberOfImages?: number;
  onCaptureImage: () => void;
}

const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  images,
  video,
  onPickImage,
  onCaptureImage,
  onPickVideo,
  onRemoveImage,
  onRemoveVideo,
  isLoading = false,
  isVideoLoading = false,
  canUploadVideo = true,
  maxNumberOfImages = 5,
}) => {
  const screenWidth = Dimensions.get("window").width;
  const boxSize = (screenWidth - 48 - 32) / maxNumberOfImages;
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const renderImageOptionsModal = () => (
    <Modal
      visible={showOptionsModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowOptionsModal(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowOptionsModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setShowOptionsModal(false);
                  onCaptureImage();
                }}
              >
                <Icon name="camera-alt" size={24} color="#f97314" />
                <Text style={styles.modalOptionText}>Chụp ảnh</Text>
              </TouchableOpacity>

              <View style={styles.modalSeparator} />

              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setShowOptionsModal(false);
                  onPickImage();
                }}
              >
                <Icon name="photo-library" size={24} color="#f97314" />
                <Text style={styles.modalOptionText}>Chọn từ thư viện</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderUploadBox = () => {
    if (isLoading) {
      return (
        <View style={[styles.uploadBox, { width: boxSize, height: boxSize }]}>
          <ActivityIndicator size="small" color="#f97314" />
          <Text style={styles.uploadText}>Đang tải...</Text>
        </View>
      );
    }

    return (
      <>
        <TouchableOpacity
          style={[styles.uploadBox, { width: boxSize, height: boxSize }]}
          onPress={() => setShowOptionsModal(true)}
        >
          <Icon name="add" size={24} color="#f97314" />
          <Text style={styles.imageCount}>
            {images.length}/{maxNumberOfImages}
          </Text>
        </TouchableOpacity>
        {renderImageOptionsModal()}
      </>
    );
  };

  const renderFirstUploadBox = () => {
    if (isLoading) {
      return (
        <>
          <ActivityIndicator size="large" color="#f97314" />
          <Text style={[styles.uploadText, { marginTop: 8 }]}>Đang tải...</Text>
        </>
      );
    }

    return (
      <View style={styles.uploadOptions}>
        <TouchableOpacity style={styles.uploadOption} onPress={onPickImage}>
          <Icon name="photo-library" size={32} color="#f97314" />
          <Text style={styles.uploadText}>Chọn từ thư viện</Text>
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity style={styles.uploadOption} onPress={onCaptureImage}>
          <Icon name="camera-alt" size={32} color="#f97314" />
          <Text style={styles.uploadText}>Chụp ảnh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderVideoSection = () => {
    if (isVideoLoading) {
      return (
        <View style={styles.videoLoadingContainer}>
          <ActivityIndicator size="large" color="#f97314" />
          <Text style={[styles.uploadText, { marginTop: 8 }]}>
            Đang tải video...
          </Text>
        </View>
      );
    }

    if (video) {
      // Extract video ID from Cloudinary URL
      const videoId = video.split("/").pop()?.split(".")[0];
      const thumbnailUrl = `https://res.cloudinary.com/dt4ianp80/video/upload/c_thumb,w_400,h_200/${videoId}.jpg`;

      return (
        <View style={styles.videoContainer}>
          {/* Show thumbnail */}
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.videoPreview}
            resizeMode="cover"
          />
          {/* Add play icon overlay */}
          <View style={styles.playIconContainer}>
            <Icon name="play-circle-outline" size={50} color="#fff" />
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemoveVideo}
            disabled={isVideoLoading}
          >
            <Icon name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.videoUploadBox}
        onPress={onPickVideo}
        disabled={isVideoLoading}
      >
        <Icon name="videocam" size={32} color="#f97314" />
        <Text style={styles.uploadText}>ĐĂNG TỐI ĐA 01 VIDEO</Text>
        <Text style={styles.subText}>BẠN ĐÃ ĐĂNG 0/5 VIDEO TRONG THÁNG</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageSection}>
        <View style={styles.imageGrid}>
          {images.length === 0 ? (
            <TouchableOpacity
              style={styles.originalUploadBox}
              onPress={onPickImage}
              disabled={isLoading}
            >
              <View style={styles.uploadContent}>{renderFirstUploadBox()}</View>
            </TouchableOpacity>
          ) : (
            <>
              {images.length < maxNumberOfImages && (
                <TouchableOpacity
                  style={[
                    styles.uploadBox,
                    { width: boxSize, height: boxSize },
                  ]}
                  onPress={onPickImage}
                  disabled={images.length >= maxNumberOfImages}
                >
                  {renderUploadBox()}
                </TouchableOpacity>
              )}

              {images.map((uri, index) => (
                <View
                  key={index}
                  style={[
                    styles.imageContainer,
                    { width: boxSize, height: boxSize },
                  ]}
                >
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => onRemoveImage(index)}
                    disabled={isLoading}
                  >
                    <Icon name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </View>
      </View>

      {/* Video Upload Section */}
      {canUploadVideo && (
        <View style={styles.videoSection}>{renderVideoSection()}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  imageSection: {
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  originalUploadBox: {
    width: "100%",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ddd",
  },
  uploadBox: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ddd",
  },
  uploadContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  uploadOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 32,
  },
  uploadOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  separator: {
    width: 1,
    height: "80%",
    backgroundColor: "#ddd",
    marginHorizontal: 16,
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 4,
  },
  videoUploadBox: {
    padding: 16,
    marginTop: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ddd",
    alignItems: "center",
  },
  uploadText: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
  },
  subText: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
  },
  imageCount: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  spinner: {
    transform: [{ scale: 1.2 }],
  },
  videoSection: {
    marginTop: 12,
  },
  videoContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    height: 200,
  },
  videoPreview: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f5f5f5",
  },
  playIconContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  videoLoadingContainer: {
    height: 200,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
    color: "#333",
  },
  modalSeparator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 5,
  },
});

export default MediaUploadSection;
