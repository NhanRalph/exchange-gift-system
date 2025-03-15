import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  Button,
  Alert,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Camera, CameraView } from "expo-camera";
import { useNavigation } from "../hooks/useNavigation";
import axiosInstance from "../api/axiosInstance";
import { API_VALIDATE_QR } from "@env";

const WINDOW_WIDTH = Dimensions.get("window").width;
const SCAN_AREA_SIZE = WINDOW_WIDTH * 0.7; // Kích thước khung scan (70% chiều rộng màn hình)

export default function QRScanner() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  const navigation = useNavigation();

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    try {
      const dataResponse = JSON.parse(data);

      if (!dataResponse.isTransactionCampaign) {
        //mode normal
        console.log("Normal QR code scanned", dataResponse);

        const checkValidateQR = await axiosInstance.get(
          `${API_VALIDATE_QR}/${encodeURIComponent(
            JSON.stringify(dataResponse)
          )}`
        );

        if (!checkValidateQR.data.isSuccess) {
          Alert.alert("Error", checkValidateQR.data.message, [
            {
              text: "OK",
              onPress: () => setScanned(false),
            },
          ]);
          return;
        } else {
          const transactionData = checkValidateQR.data.data;
          console.log("Normal QR code scanned", transactionData);
          navigation.navigate("ResultScanTransaction", {
            transactionResult: transactionData,
          });
          setScanned(false);
        }
      } else {
        //mode campaign
        console.log("Campaign QR code scanned", dataResponse);
        const checkValidateQR = await axiosInstance.get(
          `transaction/volunteer/validate-qr?qrdata=${encodeURIComponent(
            JSON.stringify(dataResponse)
          )}`
        );

        if (!checkValidateQR.data.isSuccess) {
          Alert.alert("Error", checkValidateQR.data.message, [
            {
              text: "OK",
              onPress: () => setScanned(false),
            },
          ]);
          return;
        } else {
          const transactionData = checkValidateQR.data.data;
          console.log("Campaign QR code scanned", transactionData);
          navigation.navigate("ResultScanTransaction", {
            transactionResult: transactionData,
          });

          setScanned(false);
        }
      }
    } catch (error) {
      Alert.alert("Error", `Invalid QR code format ${error}`, [
        {
          text: "OK",
          onPress: () => setScanned(false),
        },
      ]);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: "#888" }}>Quay lại</Text>
      </TouchableOpacity>

      {/* Overlay với lỗ hổng ở giữa */}
      <View style={styles.overlay}>
        <View style={styles.overlayRow} />
        <View style={styles.overlayCenter}>
          <View style={styles.overlayItem} />
          <View style={styles.scanArea}>
            {/* Khung scan */}
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
          <View style={styles.overlayItem} />
        </View>
        <View style={styles.overlayRow} />
      </View>

      {scanned && (
        <Button
          title={"Tap to Scan Again"}
          onPress={() => setScanned(false)}
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayRow: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  overlayCenter: {
    flexDirection: "row",
    height: SCAN_AREA_SIZE,
  },
  overlayItem: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: "relative",
  },
  // Góc trên trái
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: "#fff",
  },
  // Góc trên phải
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderColor: "#fff",
  },
  // Góc dưới trái
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 20,
    height: 20,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: "#fff",
  },
  // Góc dưới phải
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: "#fff",
  },
  button: {
    position: "absolute",
    bottom: 50,
    left: 50,
    right: 50,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
});
