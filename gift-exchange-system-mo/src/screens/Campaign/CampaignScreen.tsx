import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Campaign } from "@/src/shared/type";
import axiosInstance from "@/src/api/axiosInstance";
import { formatDate_DD_MM_YYYY } from "@/src/shared/formatDate";
import Colors from "@/src/constants/Colors";
import { useNavigation } from "@/src/hooks/useNavigation";
import TimeNow from "@/src/components/TimeNow/TimeNow";

const CampaignScreen = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(1);
  const [sizeIndex] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async (loadMore = false) => {
    try {
      const response = await axiosInstance.get(
        `campaign/list?pageIndex=${
          loadMore ? pageIndex + 1 : 1
        }&sizeIndex=${sizeIndex}`
      );

      if (response.data.isSuccess) {
        const campaignData = response.data.data.data;
        const totalPages = response.data.data.totalPage;

        const filteredCampaigns = campaignData.filter(
          (campaign: Campaign) => campaign.status === "Ongoing"
        );

        if (loadMore) {
          setCampaigns((prev) => [...prev, ...filteredCampaigns]);
          setPageIndex((prev) => prev + 1);
          setHasMore(pageIndex < totalPages);
        } else {
          setCampaigns(filteredCampaigns);
          setPageIndex(1);
          setHasMore(true);
        }
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchCampaigns(true);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCampaigns(false);
    setRefreshing(false);
  };

  const renderCampaign = ({ item }: { item: Campaign }) => (
    <TouchableOpacity style={styles.campaignCard} onPress={() => {navigation.navigate("CampaignDetail", { campaignId: item.id })}}>
      <View style={styles.campaignImageContainer}>
        <Image
          source={{ uri: item.bannerPicture }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.campaignInfo}>
        <Text style={styles.campaignName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.campaignDescription} numberOfLines={1}>
          {item.description}
        </Text>
        <View style={styles.campaignFooter}>
          <Text style={styles.campaignDates}>
            {formatDate_DD_MM_YYYY(item.startDate)} -{" "}
            {formatDate_DD_MM_YYYY(item.endDate)}
          </Text>
        </View>
        <Text style={styles.campaignDetail} numberOfLines={1}>
          {item.totalParticipants} <Icon name="groups" size={12}/>  |  <Icon name="archive" size={12}/> {item.totalItems} sản phẩm
        </Text>
      </View>
      <Icon name="arrow-forward" size={18} color="#000" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
        <TimeNow />
        <Text style={styles.title}>Chiến dịch thiện nguyện</Text>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.orange500} />
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(item) => item.id}
          renderItem={renderCampaign}
          contentContainerStyle={[
            styles.listContent,
            campaigns.length === 0 && { flex: 1 },
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
              <Text style={styles.emptyText}>Chưa có chiến dịch nào</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 16,
    // padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  listContent: {
    padding: 16,
  },
  campaignCard: {
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
    width: "100%",
    height: 100,
    objectFit: "cover",
    borderRadius: 8,
  },
  campaignImageContainer: {
    flex: 4,
  },
  campaignInfo: {
    flex: 6,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  campaignDescription: {
    fontSize: 12,
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
    fontSize: 12,
    color: "#888",
  },
  campaignStatus: {
    fontSize: 12,
    fontWeight: "bold",
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

export default CampaignScreen;
