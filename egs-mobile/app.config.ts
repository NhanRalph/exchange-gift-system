import "dotenv/config";

export default {
  expo: {
    newArchEnabled: true,
    name: "Cho Tặng",
    slug: "gift-exchange-system-mo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./src/assets/Cho.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./src/assets/splash2.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription:
          "Cho phép ứng dụng truy cập vào camera của bạn",
      },
      bundleIdentifier: "com.phucdeptrai0508.giftexchangesystemmo",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./src/assets/Cho.png",
        backgroundColor: "#ffffff",
      },
      package: "com.phucdeptrai0508.giftexchangesystemmo",
      permissions: [
        "CAMERA",
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "ACCESS_MOCK_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
      ],
    },
    web: {
      favicon: "./src/assets/Cho.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-camera",
        {
          cameraPermission: "Cho phép ứng dụng truy cập vào camera của bạn",
        },
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow $(PRODUCT_NAME) to use your location.",
          locationWhenInUsePermission: "Show current location on map.",
        },
      ],
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsDownloadToken: process.env.API_TOKEN_GOONG,
        },
      ],
    ],
    extra: {
      API_URL: process.env.API_URL,
      API_SIGNALR_URL: process.env.API_SIGNALR_URL,
      API_GOONG_URL: process.env.API_GOONG_URL,
      API_APP_ID_AGORA: process.env.API_APP_ID_AGORA,
      API_TOKEN_AGORA: process.env.API_TOKEN_AGORA,
      API_TOKEN_GOONG: process.env.API_TOKEN_GOONG,
      API_CHANNEL_NAME_AGORA: process.env.API_CHANNEL_NAME_AGORA,

      // Authentication
      API_LOGIN: process.env.API_LOGIN,
      API_REGISTER: process.env.API_REGISTER,

      // Transaction & Requests
      API_VALIDATE_QR: process.env.API_VALIDATE_QR,
      API_CREATE_TRANSACTION: process.env.API_CREATE_TRANSACTION,
      API_GET_OWN_TRANSACTIONS: process.env.API_GET_OWN_TRANSACTIONS,
      API_GET_TRANSACTION_BY_ID: process.env.API_GET_TRANSACTION_BY_ID,
      API_GET_VALIDATE_TIME_TRANSACTION:
        process.env.API_GET_VALIDATE_TIME_TRANSACTION,
      API_APPROVE_TRANSACTION: process.env.API_APPROVE_TRANSACTION,
      API_REJECT_TRANSACTION: process.env.API_REJECT_TRANSACTION,
      API_CANCEL_TRANSACTION: process.env.API_CANCEL_TRANSACTION,

      // Rating & Points
      API_RATING_TRANSACTION: process.env.API_RATING_TRANSACTION,
      API_CREATE_RATING_TRANSACTION: process.env.API_CREATE_RATING_TRANSACTION,
      API_CREATE_POINT_TRANSACTION: process.env.API_CREATE_POINT_TRANSACTION,

      // Notifications
      API_DELETE_ONE_NOTIFICATION: process.env.API_DELETE_ONE_NOTIFICATION,
      API_DELETE_ALL_NOTIFICATION: process.env.API_DELETE_ALL_NOTIFICATION,
      API_GET_ALL_NOTIFICATION: process.env.API_GET_ALL_NOTIFICATION,

      // User & Profile
      API_GET_PROFILE: process.env.API_GET_PROFILE,
      API_EDIT_PROFILE: process.env.API_EDIT_PROFILE,
      API_GET_OWNER_ADDRESS: process.env.API_GET_OWNER_ADDRESS,
      API_SEND_CONFIRM_EMAIL: process.env.API_SEND_CONFIRM_EMAIL,

      // Items & Categories
      API_CATEGORY: process.env.API_CATEGORY,
      API_GET_ALL_PRODUCT: process.env.API_GET_ALL_PRODUCT,
      API_GET_PRODUCT_BY_ID: process.env.API_GET_PRODUCT_BY_ID,
      API_CREATE_POST: process.env.API_CREATE_POST,
      API_SEARCH_ITEMS: process.env.API_SEARCH_ITEMS,
      API_GET_BUSY_TIME: process.env.API_GET_BUSY_TIME,

      // Requests
      API_GET_REQUESTS: process.env.API_GET_REQUESTS,
      API_GET_REQUESTS_FOR_ME: process.env.API_GET_REQUESTS_FOR_ME,
      API_APPROVE_REQUEST: process.env.API_APPROVE_REQUEST,
      API_REJECT_REQUEST: process.env.API_REJECT_REQUEST,
      API_CANCEL_REQUEST: process.env.API_CANCEL_REQUEST,
      API_CREATE_REQUEST: process.env.API_CREATE_REQUEST,
      API_CHARITARIAN_REQUEST_ITEM: process.env.API_CHARITARIAN_REQUEST_ITEM,

      // Reporting & Validation
      API_CREATE_REPORT: process.env.API_CREATE_REPORT,
      API_GET_QR_CODE: process.env.API_GET_QR_CODE,
      API_VALIDATE_DISTANCE: process.env.API_VALIDATE_DISTANCE,

      // Campaigns
      API_GET_CAMPAIGN: process.env.API_GET_CAMPAIGN,

      router: {
        origin: false,
      },
      eas: {
        projectId: "cd15166f-64e2-46f1-93cd-f9ff4c7ba134",
      },
    },
    runtimeVersion: "1.0.0",
    updates: {
      url: "https://u.expo.dev/cd15166f-64e2-46f1-93cd-f9ff4c7ba134",
      enabled: true,
      fallbackToCacheTimeout: 0,
    },
  },
};
