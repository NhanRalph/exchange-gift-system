import "./gesture-handler";
import React, { useEffect } from "react";
import { enableScreens } from "react-native-screens";
import { useFonts } from "expo-font";
import Navigation from "@/src/layouts/Navigation";
import fonts from "@/src/config/fonts";
import Toast from "react-native-toast-message";
import { useNotificationStore } from "@/src/stores/notificationStore";
import { useAuthStore } from "@/src/stores/authStore";
import { PostProvider } from "./src/context/PostContext";

enableScreens();

export default function App() {
  let [fontsLoaded] = useFonts(fonts);
  const { initializeConnection, disconnectSignalR } = useNotificationStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      initializeConnection();
    }
    return () => {
      disconnectSignalR();
    };
  }, [isAuthenticated]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PostProvider>
      <Navigation />
      <Toast />
    </PostProvider>
  );
}
