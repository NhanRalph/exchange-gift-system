import { useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import Constants from "expo-constants";
const API_EDIT_PROFILE = (Constants.expoConfig as any).extra.API_EDIT_PROFILE;
const API_SEND_CONFIRM_EMAIL = (Constants.expoConfig as any).extra
  .API_SEND_CONFIRM_EMAIL;

interface UpdateProfilePayload {
  username: string;
  fullname: string;
  email: string;
  profilePicture: string;
  otp: string | null;
}

export const useProfile = (originalEmail: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const sendConfirmationEmail = async (newEmail: string) => {
    if (newEmail === originalEmail) {
      return true;
    }

    try {
      setIsLoading(true);
      setError(null);

      await axiosInstance.post(`${API_SEND_CONFIRM_EMAIL}`, {
        email: newEmail,
      });
      setShowOtpInput(true);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send confirmation email"
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (
    profileData: Omit<UpdateProfilePayload, "otp">
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const payload: UpdateProfilePayload = {
        ...profileData,
        otp: profileData.email !== originalEmail ? otpInput : null,
      };

      console.log("useProfile - Sending payload:", payload);

      const response = await axiosInstance.put(`${API_EDIT_PROFILE}`, payload);
      console.log("useProfile - Response:", response.data);

      setShowOtpInput(false);
      setOtpInput("");
      return response.data;
    } catch (err) {
      console.error("useProfile - Error details:", {
        error: err,
      });

      const errorMsg =
        err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    otpInput,
    showOtpInput,
    setOtpInput,
    sendConfirmationEmail,
    updateProfile,
  };
};
