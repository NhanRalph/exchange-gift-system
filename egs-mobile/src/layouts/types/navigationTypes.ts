import { AddressCoordinates, Campaign, DayTimeFrame } from "@/src/shared/type";
import { Category, Product, SubCategory, User } from "@/src/shared/type";
import { SearchMode } from "@/src/utils/search";

export type RootStackParamList = {
  Main: {
    screen: keyof BottomTabParamList;
  };
  HomeScreen: undefined;
  LoginScreen: undefined;
  RegisterScreen: undefined;
  WelcomeScreen: undefined;
  ResultScreen: { date: string };
  AuthLoadingScreen: undefined;
  SearchResults: { query: string };
  PackageDetail: { id: string };
  CartScreen: undefined;
  ProfileScreen: undefined;
  OrderScreen: undefined;
  OrderDetail: { orderId: string };
  OrderForm: undefined;
  OrderResult: { orderData: string } | { vnpayData: string };
  AddressScreen: undefined;
  AddAddressScreen: undefined;
  FilterResults: { brandName: string };
  EditProfileScreen: undefined;
  ChangePasswordScreen: undefined;
  ListFavoriteBlogScreen: undefined;
  CreatePost: {
    category?: Category;
    categoryId?: string;
    subCategory?: SubCategory;
    subCategoryId?: string;
    shouldPublish?: boolean;
  };
  ProductDetail: { productId: string };
  ProfileDetail: undefined;
  MyProducts: undefined;
  SearchScreen: undefined;
  SearchResultsScreen: {
    searchTerm: string;
    searchMode: SearchMode;
  };
  MyRequests: { productId: string; type: string };
  MyRequestsToCampaign: undefined;
  RequestDetail: { requestId: string };
  RequestsForMe: { productId: string };
  RequestSubAction: undefined;
  MyTransactions: { requestId: string };
  ChatScreen: undefined;
  PackageScreen: undefined;
  MyPackageScreen: undefined;
  OTPScreen: {
    user: User;
    token: string;
    refreshToken: string;
  };
  QRScanner: undefined;
  ResultScanTransaction: { transactionResult: any };
  CharitarianRequestItem: undefined;
  PreviewPost: {
    title: string;
    description: string;
    category: Category | null;
    subCategory: SubCategory | null;
    condition: string;
    images: string[];
    video: string | null;
    isExchange: boolean;
    isGift: boolean;
    timePreference: string;
    campaign: Campaign | null;
    dayTimeFrames: DayTimeFrame[];
    address: string;
    desiredCategory?: Category;
    desiredSubCategory?: SubCategory;
    addressId: string;
    onSubmitPost: (postData: any) => Promise<boolean>;
  };
  CampaignDetail: { campaignId: string };
  VolunteerTasks: undefined;
  VolunteerTaskDetail: {
    dateOnly: string;
    timeFrame: string;
    addressId: string;
    addressName: string;
    addressCoordinates: AddressCoordinates;
  };
};

export type BottomTabParamList = {
  Notifications: undefined;
  Home: undefined;
  Orders: undefined;
  Profile: undefined;
  Campaign: undefined;
  Blogs: undefined;
  Products: undefined;
  Cart: undefined;
};
