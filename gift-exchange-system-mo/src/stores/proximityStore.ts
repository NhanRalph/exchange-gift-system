import { create } from "zustand";

interface ProximityState {
  // requestIdInTransaction: string | null;
  // setRequestIdInTransaction: (id: string | null) => void;
  // hashMap: Record<
  //   string,
  //   {
  //     isNearDestination: boolean;
  //     recipientHasArrived: boolean;
  //     isVerifyTransaction: boolean;
  //   }
  // >;
  // initializeTransaction: (requestIdInTransaction: string) => void;
  // updateState: (
  //   requestIdInTransaction: string,
  //   key: "isNearDestination" | "recipientHasArrived" | "isVerifyTransaction",
  //   value: boolean
  // ) => void;
  OTP: string;
  setOTP: (value: string) => void;
  isVerifyOTP: boolean;
  setIsVerifyOTP: (value: boolean) => void;
}

export const useProximityStore = create<ProximityState>((set, get) => ({
  // requestIdInTransaction: null,
  // setRequestIdInTransaction: (id) => set({ requestIdInTransaction: id }),
  // // Initialize the hashMap
  // hashMap: {},

  // // Initialize a transaction with default values
  // initializeTransaction: (requestIdInTransaction) => {
  //   const state = get();
  //   if (!state.hashMap[requestIdInTransaction]) {
  //     set({
  //       hashMap: {
  //         ...state.hashMap,
  //         [requestIdInTransaction]: {
  //           isNearDestination: false,
  //           recipientHasArrived: false,
  //           isVerifyTransaction: false,
  //         },
  //       },
  //     });
  //   }
  // },

  // // Update a specific state in the hashMap
  // updateState: (requestIdInTransaction, key, value) => {
  //   const state = get();
  //   const transaction = state.hashMap[requestIdInTransaction];

  //   if (transaction) {
  //     set({
  //       hashMap: {
  //         ...state.hashMap,
  //         [requestIdInTransaction]: {
  //           ...transaction,
  //           [key]: value, // Update only the specified key
  //         },
  //       },
  //     });
  //   }
  // },

  // Handle OTP and Login
  OTP: "",
  setOTP: (value) => set({ OTP: value }),
  isVerifyOTP: false,
  setIsVerifyOTP: (value) => set({ isVerifyOTP: value }),
}));
