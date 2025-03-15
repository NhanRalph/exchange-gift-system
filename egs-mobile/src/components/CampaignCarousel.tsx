import Carousel from "react-native-reanimated-carousel";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useNavigation } from "../hooks/useNavigation";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Campaign } from "../shared/type";
import { formatDate_DD_MM_YYYY } from "../shared/formatDate";

export const CampaignCarousel: React.FC<{ campaigns: Campaign[] }> = ({
  campaigns,
}) => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();

  const renderCampaignItem = ({ item }: { item: Campaign }) => (
    <TouchableOpacity
      style={styles.campaignItem}
      onPress={() => {
        navigation.navigate("CampaignDetail", { campaignId: item.id });
      }}
    >
      <Image
        source={{ uri: item.bannerPicture }}
        style={styles.campaignImage}
        resizeMode="cover"
      />
      <View style={styles.campaignOverlay}>
        <Text style={styles.campaignName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.campaignDate}>
            {formatDate_DD_MM_YYYY(item.startDate)}{"  -  "}
            {formatDate_DD_MM_YYYY(item.endDate)}
          </Text>
          <Text style={styles.campaignDate}>
            {item.totalParticipants} <Icon name="groups" size={12}/>  |  <Icon name="archive" size={12}/> {item.totalItems}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (campaigns.length === 0) return null;

  return (
    <View style={styles.carouselContainer}>
      <Carousel
        loop
        width={width - 32}
        height={180}
        autoPlay={true}
        data={campaigns}
        scrollAnimationDuration={1000}
        autoPlayInterval={5000}
        renderItem={renderCampaignItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    marginBottom: 16,
  },
  campaignItem: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  campaignImage: {
    width: "100%",
    height: "100%",
  },
  campaignOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 12,
  },
  campaignName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  campaignDate: {
    color: "#fff",
    fontSize: 12,
  },
});
