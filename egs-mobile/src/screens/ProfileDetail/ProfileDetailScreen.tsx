import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import axiosInstance from "@/src/api/axiosInstance";
import Colors from "@/src/constants/Colors";
import { User } from "@/src/shared/type";

import { useProfile } from "@/src/hooks/useProfile";
import { useAuthStore } from "@/src/stores/authStore";
import Constants from "expo-constants";
const API_GET_PROFILE = (Constants.expoConfig as any).extra.API_GET_PROFILE;

const DEFAULT_PROFILE_PICTURE =
  "https://res.cloudinary.com/djh9baokn/image/upload/v1731336465/png-clipart-man-wearing-blue-shirt-illustration-computer-icons-avatar-user-login-avatar-blue-child_ijzlxf.png";

const ProfileDetailScreen = () => {
  const { userData } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    isLoading,
    error,
    otpInput,
    showOtpInput,
    setOtpInput,
    sendConfirmationEmail,
    updateProfile,
  } = useProfile(userData?.email || "");

  const [formData, setFormData] = useState<User>({
    id: "",
    username: "",
    role: "",
    fullname: "",
    email: "",
    phone: "",
    profilePicture: DEFAULT_PROFILE_PICTURE,
    address: {
      addressId: "",
      address: "",
      addressCoordinates: {
        latitude: "",
        longitude: "",
      },
      isDefault: false,
    },
    dob: null,
    gender: null,
    point: 0,
    dateJoined: "",
  });

  const [emailConfirmed, setEmailConfirmed] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axiosInstance.get(`${API_GET_PROFILE}`);
      if (response.data.isSuccess) {
        setProfile(response.data.data);
        setFormData(response.data.data);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch profile");
      console.error(error);
    }
  };

  const handleSendEmail = async () => {
    try {
      setLoading(true);
      const emailSent = await sendConfirmationEmail(formData.email);
      setLoading(false);

      if (emailSent) {
        Alert.alert(
          "Success",
          "Verification email sent. Please check your email."
        );
      } else {
        Alert.alert("Error", "Failed to send verification email.");
      }
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "An error occurred while sending email.");
    }
  };

  const handleSave = async () => {
    if (!emailConfirmed) {
      Alert.alert("Error", "Please confirm your email before saving.");
      return;
    }

    if (!otpInput || otpInput.trim().length !== 6) {
      Alert.alert("Error", "Please enter a valid OTP code.");
      return;
    }

    try {
      setLoading(true);

      const updatePayload = {
        username: formData.username,
        fullname: "Nguyen Van A",
        email: formData.email,
        profilePicture: formData.profilePicture,
      };

      const response = await updateProfile(updatePayload);

      setLoading(false);

      if (response.isSuccess) {
        Alert.alert("Success", "Profile updated successfully");
        setProfile(formData);
        setIsEditing(false);
      } else {
        Alert.alert("Error", response.message || "Update failed.");
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        "Error",
        error.message || "An error occurred while updating the profile."
      );
    }
  };

  const handleOtpInput = (otp: string) => {
    setOtpInput(otp);
    if (otp.length === 6) {
      setEmailConfirmed(true);
    } else {
      setEmailConfirmed(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setFormData({ ...formData, profilePicture: result.assets[0].uri });
    }
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, dob: selectedDate.toISOString() });
    }
  };

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={isEditing ? pickImage : undefined}
        >
          <Image
            source={{ uri: formData.profilePicture }}
            style={styles.profileImage}
          />
          {isEditing && (
            <View style={styles.editImageOverlay}>
              <Text style={styles.editImageText}>Edit</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.editButton,
            { backgroundColor: emailConfirmed ? Colors.orange500 : "#ccc" },
          ]}
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          disabled={loading || (isEditing && !emailConfirmed)}
        >
          <Text style={styles.editButtonText}>
            {loading ? "Saving..." : isEditing ? "Save" : "Edit Profile"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Form */}
      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholderTextColor="#c4c4c4"
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => {
              setFormData({ ...formData, email: text });
              setEmailConfirmed(false);
            }}
            editable={isEditing}
            keyboardType="email-address"
          />
          {isEditing && (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendEmail}
              disabled={loading || emailConfirmed}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          )}
        </View>

        {showOtpInput && isEditing && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Verification Code</Text>
            <View style={styles.otpContainer}>
              <TextInput
                placeholderTextColor="#c4c4c4"
                style={[styles.input, styles.otpInput]}
                value={otpInput}
                onChangeText={handleOtpInput}
                placeholder="Enter OTP code"
                keyboardType="number-pad"
                maxLength={6}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            placeholderTextColor="#c4c4c4"
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            editable={isEditing}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            placeholderTextColor="#c4c4c4"
            style={styles.input}
            value={formData.address.address}
            onChangeText={(text) =>
              setFormData({
                ...formData,
                address: { ...formData.address, address: text },
              })
            }
            editable={isEditing}
            multiline
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date Joined</Text>
          <Text style={styles.input}>
            {profile.dateJoined
              ? new Date(profile.dateJoined).toLocaleDateString()
              : "Not set"}
          </Text>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={formData.dob ? new Date(formData.dob) : new Date()}
          mode="date"
          onChange={handleDateChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  profileImageContainer: {
    position: "relative",
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    marginBottom: 15,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  editImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 5,
    alignItems: "center",
  },
  editImageText: {
    color: "#fff",
    fontSize: 12,
  },
  editButton: {
    backgroundColor: Colors.orange500,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  input: {
    borderColor: "#c4c4c4",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: "top",
    width: "100%",
    marginBottom: 16,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  coordinatesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  coordinateInput: {
    flex: 0.48,
  },
  otpContainer: {
    marginVertical: 8,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  sendButton: {
    marginTop: 10,
    backgroundColor: Colors.orange500,
    padding: 10,
    borderRadius: 8,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});

export default ProfileDetailScreen;
