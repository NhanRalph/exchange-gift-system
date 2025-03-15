import React, { useState, useRef } from "react";
import {
  View,
  Image,
  FlatList,
  Dimensions,
  StyleSheet,
  Text,
} from "react-native";

interface ImageCarouselProps {
  images: string[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const screenWidth = Dimensions.get("window").width;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0) {
        if (viewableItems[0].index !== null) {
          setActiveIndex(viewableItems[0].index);
        }
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = ({ item }: { item: string }) => (
    <View style={[styles.imageContainer, { width: screenWidth }]}>
      <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
    </View>
  );

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(_, index) => index.toString()}
      />
      <View style={styles.pagination}>
        <Text style={styles.paginationText}>
          {activeIndex + 1}/{images.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    height: 400,
    overflow: "hidden",
    padding: 16,
  },
  image: {
    borderRadius: 16,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  pagination: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  paginationText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default ImageCarousel;
