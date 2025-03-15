import axiosInstance from "@/src/api/axiosInstance";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function TimeNow() {
  const [time, setTime] = useState<string>("Đang tải...");

  const fetchTimeFromAPI = async () => {
    try {
      const response = await axiosInstance.get("time/now");
      return response.data.data; // Định dạng dữ liệu trả về tùy vào API
    } catch (error) {
      console.error("Lỗi khi lấy thời gian:", error);
      return "Lỗi!";
    }
  };

  useEffect(() => {
    const getTime = async () => {
      const currentTime = await fetchTimeFromAPI();
      setTime(currentTime);
    };
    getTime();

    // Cập nhật thời gian mỗi phút (nếu cần)
    const interval = setInterval(getTime, 1000);

    return () => clearInterval(interval); // Xóa interval khi component unmount
  }, []);
  return (
    <View style={{ flexDirection: "row", justifyContent: "flex-end", padding: 8 }}>
      <Text style={{ fontSize: 12, color: "gray" }}>{time}</Text>
    </View>
  );
}
