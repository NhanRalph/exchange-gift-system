import { useState, useCallback } from "react";
import { RefreshControl } from "react-native";

export const useRefreshControl = (onRefresh: () => Promise<void>) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const refreshControl = useCallback(
    () =>
      new RefreshControl({
        refreshing,
        onRefresh: handleRefresh,
        tintColor: "#999",
        colors: ["#999"],
      }),
    [refreshing, handleRefresh]
  );

  return {
    refreshing,
    refreshControl,
  };
};
