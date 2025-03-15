import React, { createContext, useContext, useState } from "react";
import {
  Category,
  SubCategory,
  ItemCondition,
  DayTimeFrame,
  Campaign,
} from "@/src/shared/type";

interface PostContextType {
  // Form states
  isFirstRender: boolean;
  title: string;
  description: string;
  selectedCategory: Category | null;
  selectedSubCategory: SubCategory | null;
  selectedAddressId: string;
  images: string[];
  selectedImage: string | null;
  video: string | null;
  condition: ItemCondition | "";
  isExchange: boolean;
  isGift: boolean;
  timePreference: string;
  dayTimeFrames: DayTimeFrame[];
  desiredCategoryId: string;
  desiredSubCategoryId: string | null;
  isTermsAccepted: boolean;
  campaigns: Campaign[];
  selectedCampaign: Campaign | null;

  // UI states
  isUploadingImage: boolean;
  isUploadingVideo: boolean;
  isLoading: boolean;
  showTitleHint: boolean;
  showDescriptionHint: boolean;
  showSuccessAlert: boolean;
  showConfirmAlert: boolean;

  // Time picker specific setters
  selectedDayForFrame: string;
  frameStartTime: string;
  frameEndTime: string;
  showStartTimePicker: boolean;
  showEndTimePicker: boolean;

  // Setters
  setIsFirstRender: (isFirstRender: boolean) => void;
  setTitle: (title: string) => void;
  setDescription: (desc: string) => void;
  setSelectedCategory: (category: Category | null) => void;
  setSelectedSubCategory: (subCategory: SubCategory | null) => void;
  setSelectedAddressId: (id: string) => void;
  setImages: (images: string[] | ((prev: string[]) => string[])) => void;
  setSelectedImage: (image: string | null) => void;
  setVideo: (video: string | null) => void;
  setCondition: (condition: ItemCondition | "") => void;
  setIsExchange: (isExchange: boolean) => void;
  setIsGift: (isGift: boolean) => void;
  setTimePreference: (preference: string) => void;
  setDayTimeFrames: (
    frames: DayTimeFrame[] | ((prev: DayTimeFrame[]) => DayTimeFrame[])
  ) => void;
  setDesiredCategoryId: (id: string) => void;
  setDesiredSubCategoryId: (id: string | null) => void;
  setIsTermsAccepted: (accepted: boolean) => void;
  setCampaigns: (campaign: Campaign[]) => void;
  setSelectedCampaign: (campaign: Campaign | null) => void;

  // UI setters
  setIsUploadingImage: (loading: boolean) => void;
  setIsUploadingVideo: (loading: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setShowTitleHint: (show: boolean) => void;
  setShowDescriptionHint: (show: boolean) => void;
  setShowSuccessAlert: (show: boolean) => void;
  setShowConfirmAlert: (show: boolean) => void;

  // Time picker specific setters
  setSelectedDayForFrame: (day: string) => void;
  setFrameStartTime: (time: string) => void;
  setFrameEndTime: (time: string) => void;
  setShowStartTimePicker: (show: boolean) => void;
  setShowEndTimePicker: (show: boolean) => void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isFirstRender, setIsFirstRender] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedSubCategory, setSelectedSubCategory] =
    useState<SubCategory | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [condition, setCondition] = useState<ItemCondition | "">("");
  const [isExchange, setIsExchange] = useState(false);
  const [isGift, setIsGift] = useState(true);
  const [timePreference, setTimePreference] = useState("all_day");
  const [dayTimeFrames, setDayTimeFrames] = useState<DayTimeFrame[]>([]);
  const [desiredCategoryId, setDesiredCategoryId] = useState("");
  const [desiredSubCategoryId, setDesiredSubCategoryId] = useState<
    string | null
  >(null);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  // UI states
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTitleHint, setShowTitleHint] = useState(false);
  const [showDescriptionHint, setShowDescriptionHint] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Time picker specific states
  const [selectedDayForFrame, setSelectedDayForFrame] = useState<string>("");
  const [frameStartTime, setFrameStartTime] = useState<string>("09:00");
  const [frameEndTime, setFrameEndTime] = useState<string>("21:00");
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  return (
    <PostContext.Provider
      value={{
        isFirstRender,
        title,
        description,
        selectedCategory,
        selectedSubCategory,
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
        setSelectedCategory,
        setSelectedSubCategory,
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
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export const usePostContext = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error("usePostContext must be used within a PostProvider");
  }
  return context;
};
