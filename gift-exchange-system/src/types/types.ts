export interface Product {
  id: string;
  name: string;
  description: string;
  itemCampaign: {
    itemCampaignId: string;
    campaignId: string;
    name: string;
    description: string;
    bannerPicture: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  category: {
    id: string;
    parentId: string;
    parentName: string;
    name: string;
  };
  desiredCategory: {
    id: string;
    parentId: string;
    name: string;
  } | null;
  condition: string;
  isGift: boolean;
  availableTime: string;
  owner_Name: string;
  owner_id: string;
  profilePicture: string;
  available: boolean;
  createdAt: string;
  expiresAt: string;
  updatedAt: string | null;
  images: string[];
  video: string | null;
  quantity: number;
  dateRemaining: number;
  status: string;
  address: Address;
  itemRequestTo: number;
  requestForItem: number;
  checking: {
    badWordsInName: string[];
    badWordsInDescription: string[];
    imageTags: {
      [key: string]: Array<{
        confidence: number;
        tag: {
          en: string;
        };
        isMatchingCategory: boolean;
      }>;
    };
  };
  requester: User | null;
  charitarian: User | null;
  transactionRequestIdOfItem: string | null;
  itemPendingRequestTo: number;
  pendingRequestForItem: number;
  rejectMessage: string | null;
}

interface User {
  id: string;
  name: string;
  image: string;
}

export interface Address {
  addressId: string;
  address: string;
  addressCoordinates: string;
}

export interface ProductOfCampaign {
  id: string;
  name: string;
  description: string;
  category: {
    id: string;
    parentId: string;
    parentName: string;
    name: string;
  };
  itemCampaign: {
    itemCampaignId: string;
    campaignId: string;
    name: string;
    description: string;
    bannerPicture: string;
    startDate: string;
    endDate: string;
    status: string;
  };
  images: string[];
  owner_Name: string;
}

// interface SubInfoAddress {
//   addressId: string;
//   address: string;
//   addressCoordinates: AddressCoordinates;
// }

export interface AddressCoordinates {
  latitude: string;
  longitude: string;
}

export interface ProductAttribute {
  id: string;
  productId: string;
  attributeId: string;
  value: string;
}

export interface ApiResponse {
  isSuccess: boolean;
  code: number;
  data: Product;
  message: string;
}

export interface FormData {
  [key: string]: any;
  name: string;
  description: string;
  category: string;
  categoryId: string;
  condition: string;
  image: string;
  quantity: number;
  available: boolean;
  attributes: Record<string, any>;
  province: string;
  district: string;
  ward: string;
  specificAddress: string;
  address: string;
  itemAttribute: {
    attributeId: string;
    value: string;
  }[];
  images: string[];
}

export interface CategoryAttribute {
  id: string;
  categoryId: string;
  attributeName: string;
  data_type: string;
  is_required: boolean;
}

export interface Category {
  id: string;
  name: string;
  status: string;
  parentId: string | null;
  parentName: string | null;
  subCategories: SubCategory[] | null;
}

export interface SubCategory {
  id: string;
  parentId: string;
  parentName: string;
  name: string;
}

export interface ApiCreateCampaignResponse<T> {
  isSuccess: boolean;
  code: number;
  data: T;
  message: string;
}

export interface AttributeValue {
  id: string;
  product_id: string;
  attribute_id: string;
  value: string;
}

export interface Report {
  id: string;
  transactionId: string;
  reporter: {
    id: string;
    name: string;
    image: string;
  };
  reported: {
    id: string;
    name: string;
    image: string;
  };
  reportReasons: ReportReason[];
  createdAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requesterItem: {
    itemId: string;
    itemName: string;
    itemImages: string[];
    itemQuantity: number;
    itemVideo: string | null;
  };
  charitarianItem: {
    itemId: string;
    itemName: string;
    itemImages: string[];
    itemQuantity: number;
    itemVideo: string | null;
  };
}

export interface TimeRange {
  day: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface TransactionResponse {
  isSuccess: boolean;
  code: number;
  data: Transaction[];
  message: string;
}

export interface Transaction {
  id: string;
  status: string;
  requestId: string;
  requestNote: string;
  requester: User;
  requesterItem: TransactionItem;
  charitarian: User;
  charitarianItem: TransactionItem;
  createdAt: string;
  updateAt: string;
  appointmentDate: string;
  requesterAddress: Address;
  requesterPhone: string;
  charitarianAddress: Address;
  charitarianPhone: string;
  rejectMessage: string | null;
  transactionImages: string[];

  volunteer: any | null;
  volunteerAddress: any | null;
}

interface TransactionItem {
  itemId: string;
  itemName: string;
  itemVideo: string | null;
  itemImages: string[];
  itemQuantity: number;
}
export interface ReportResponse {
  isSuccess: boolean;
  code: number;
  data: ReportDetail;
  message: string;
}

export interface ReportDetail {
  id: string;
  transactionId: string;
  reporter: User;
  reported: User;
  reportReasons: ReportReason[];
  createdAt: string;
  status: string;
  requesterItem: TransactionItem | null;
  charitarianItem: TransactionItem | null;
}

interface ReportReason {
  id: string;
  parentId: string;
  reason: string;
  point: number;
}

export interface LoginResponse {
  isSuccess: boolean;
  code: number;
  data: {
    userId: string;
    username: string;
    email: string;
    role: string;
    token: string;
    refreshToken: string;
    profileURL: string;
  };
  message: string;
}

export interface Campaign {
  id: string;
  name: string;
  bannerPicture: string;
  startDate: string;
  endDate: string;
  status: string;
  categories?: CategoryCampaign[];
  pendingItemCampaigns: number;
  itemCampaigns: number;
}

export interface CampaignResponse {
  isSuccess: boolean;
  code: number;
  data: {
    totalItems: number;
    pageSize: number;
    currentPage: number;
    data: Campaign[];
    totalPage: number;
  };
  message: string;
}

export interface CategoryCampaign {
  id: string;
  parentId: string;
  parentName: string;
  name: string;
}

export interface CampaignDetail extends Campaign {
  id: string;
  name: string;
  description: string;
  bannerPicture: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  images: string[];
  categories: CategoryCampaign[];
  totalParticipants: number;
  totalItems: number;
  topParticipants?: {
    userId: string;
    username: string;
    email: string;
    phone: string;
    profilePicture: string;
    point: number;
    address: {
      addressId: string;
      address: string;
      addressCoordinates: {
        latitude: string;
        longitude: string;
      };
      isDefault: boolean;
    }[];
    dateJoined: string;
  }[];
}

export interface CreateCampaignForm {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  bannerPicture: string;
  images: string[];
  categories: string[];
}

export interface FormDataType {
  name: string;
  description: string;
  bannerPicture: string;
  startDate: string;
  endDate: string;
  images: string[];
  categories: string[];
}

export interface ItemCampaign {
  itemCampaignId: string;
  campaignId: string;
  name: string;
  description: string;
  bannerPicture: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface CampaignItem extends Product {
  itemCampaign: ItemCampaign;
}

export interface CampaignItemsResponse {
  isSuccess: boolean;
  code: number;
  data: {
    totalItems: number;
    pageSize: number;
    currentPage: number;
    data: CampaignItem[];
    totalPage: number;
  };
  message: string;
}

export interface CampaignDetail {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  categories: CategoryCampaign[];
  description: string;
}

export interface GroupedItems {
  [userId: string]: {
    user: {
      id: string;
      name: string;
      image: string;
    };
    addresses: {
      [addressId: string]: {
        address: Address;
        items: Product[];
      };
    };
  };
}

export interface SuggestedAppointment {
  date: string;
  volunteer: {
    id: string;
    name: string;
    image: string;
  };
}

export interface Volunteer {
  userId: string;
  fullname: string;
  username: string;
  password: string;
  email: string;
  altAvailableTime: string | null;
  availableTime: string;
  address: Array<{
    address: string;
  }>;
}
