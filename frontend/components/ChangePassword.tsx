import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import userApi from "@/api/userApi";
import CustomAlert from "./CustomAlert";

interface ChangePasswordProps {
  visible: boolean;
  onClose: () => void;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePassword({
  visible,
  onClose,
}: ChangePasswordProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("success");

  const handleInputChange = (field: keyof PasswordForm, value: string) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const showAlert = (message: string, type: "success" | "error") => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const validateForm = (): boolean => {
    if (!passwordForm.currentPassword.trim()) {
      showAlert("Current password is required", "error");
      return false;
    }

    if (!passwordForm.newPassword.trim()) {
      showAlert("New password is required", "error");
      return false;
    }

    if (passwordForm.newPassword.length < 6) {
      showAlert("New password must be at least 6 characters long", "error");
      return false;
    }

    if (!passwordForm.confirmPassword.trim()) {
      showAlert("Please confirm your new password", "error");
      return false;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showAlert("New password and confirm password do not match", "error");
      return false;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      showAlert(
        "New password must be different from current password",
        "error"
      );
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await userApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      showAlert(
        response.message || "Password changed successfully!",
        "success"
      );

      //Reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      //Close modal after success
      setTimeout(() => {
        setAlertVisible(false);
        onClose();
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to change password. Please try again.";
      showAlert(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false,
    });
    onClose();
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <LinearGradient
        colors={["#1e40af", "#3b82f6", "#60a5fa"]}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingTop: 50 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingBottom: 20,
            }}
          >
            <TouchableOpacity
              onPress={handleClose}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: 20,
                padding: 8,
              }}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: "white",
                textAlign: "center",
                flex: 1,
                marginLeft: 10,
              }}
            >
              Change Password
            </Text>

            <View style={{ width: 40 }} />
          </View>

          {/* Form */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingTop: 10 }}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: 20,
                padding: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              {/* Current Password */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#333",
                    marginBottom: 8,
                  }}
                >
                  Current Password
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#f8f9fa",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#e9ecef",
                    paddingHorizontal: 15,
                  }}
                >
                  <TextInput
                    value={passwordForm.currentPassword}
                    onChangeText={(value) =>
                      handleInputChange("currentPassword", value)
                    }
                    placeholder="Enter current password"
                    secureTextEntry={!showPasswords.current}
                    style={{
                      flex: 1,
                      paddingVertical: 15,
                      fontSize: 16,
                      color: "#333",
                    }}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    onPress={() => togglePasswordVisibility("current")}
                    style={{ padding: 5 }}
                  >
                    <Ionicons
                      name={showPasswords.current ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#333",
                    marginBottom: 8,
                  }}
                >
                  New Password
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#f8f9fa",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#e9ecef",
                    paddingHorizontal: 15,
                  }}
                >
                  <TextInput
                    value={passwordForm.newPassword}
                    onChangeText={(value) =>
                      handleInputChange("newPassword", value)
                    }
                    placeholder="Enter new password (min 6 characters)"
                    secureTextEntry={!showPasswords.new}
                    style={{
                      flex: 1,
                      paddingVertical: 15,
                      fontSize: 16,
                      color: "#333",
                    }}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    onPress={() => togglePasswordVisibility("new")}
                    style={{ padding: 5 }}
                  >
                    <Ionicons
                      name={showPasswords.new ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={{ marginBottom: 30 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#333",
                    marginBottom: 8,
                  }}
                >
                  Confirm New Password
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#f8f9fa",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#e9ecef",
                    paddingHorizontal: 15,
                  }}
                >
                  <TextInput
                    value={passwordForm.confirmPassword}
                    onChangeText={(value) =>
                      handleInputChange("confirmPassword", value)
                    }
                    placeholder="Confirm new password"
                    secureTextEntry={!showPasswords.confirm}
                    style={{
                      flex: 1,
                      paddingVertical: 15,
                      fontSize: 16,
                      color: "#333",
                    }}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    onPress={() => togglePasswordVisibility("confirm")}
                    style={{ padding: 5 }}
                  >
                    <Ionicons
                      name={showPasswords.confirm ? "eye-off" : "eye"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={loading}
                style={{
                  backgroundColor: loading ? "#ccc" : "#3b82f6",
                  borderRadius: 12,
                  paddingVertical: 15,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="shield-checkmark"
                      size={20}
                      color="white"
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        color: "white",
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      Change Password
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Password Requirements */}
              <View
                style={{
                  marginTop: 20,
                  padding: 15,
                  backgroundColor: "#f8f9fa",
                  borderRadius: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: "#3b82f6",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#333",
                    marginBottom: 8,
                  }}
                >
                  Password Requirements:
                </Text>
                <Text style={{ fontSize: 13, color: "#666", lineHeight: 18 }}>
                  • At least 6 characters long{"\n"}• Different from current
                  password{"\n"}• New password and confirm password must match
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Custom Alert */}
        <CustomAlert
          visible={alertVisible}
          title={alertType === "success" ? "Success" : "Error"}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
        />
      </LinearGradient>
    </Modal>
  );
}
