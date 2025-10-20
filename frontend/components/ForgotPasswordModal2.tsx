import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import UserAPI from "../api/userApi";
import CustomAlert from "./CustomAlert";

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalStep = "email" | "reset";

export default function ForgotPasswordModal({
  visible,
  onClose,
  onSuccess,
}: ForgotPasswordModalProps) {
  const [currentStep, setCurrentStep] = useState<ModalStep>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    token?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  // CustomAlert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertIcon, setAlertIcon] = useState<
    "success" | "error" | "warning" | "info" | "question"
  >("error");

  // Helper function to show alert
  const showAlert = (
    title: string,
    message: string,
    icon: "success" | "error" | "warning" | "info" | "question" = "error"
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertIcon(icon);
    setAlertVisible(true);
  };

  const handleSendResetEmail = async () => {
    // Basic validation
    if (!email.trim()) {
      setErrors({ email: "Please enter your email address" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors({ email: "Please enter a valid email address" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await UserAPI.forgotPassword(email.trim());
      // Move to reset step
      setCurrentStep("reset");
    } catch (error: any) {
      // Log error to console
      console.log(
        `API request failed for /forgot-password: [Error: ${error.message || error}]`
      );

      // Handle different types of errors
      if (error.status === 404) {
        const errorMsg = "No account found with this email address";
        setErrors({ email: errorMsg });
        showAlert("Account Not Found", errorMsg, "error");
      } else if (error.message) {
        setErrors({ general: error.message });
        showAlert("Error", error.message, "error");
      } else {
        const errorMsg =
          "Network error. Please check your connection and try again.";
        setErrors({ general: errorMsg });
        showAlert("Network Error", errorMsg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const validateResetForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Token validation
    if (!token.trim()) {
      newErrors.token = "Token is required";
    }

    // Password validation
    if (!newPassword.trim()) {
      newErrors.newPassword = "Password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    // Confirm password validation
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateResetForm()) return;

    setLoading(true);
    setErrors({});

    try {
      await UserAPI.resetPassword(token.trim(), newPassword);
      onSuccess();
      handleClose();
    } catch (error: any) {
      // Log error to console
      console.log(
        `API request failed for /reset-password: [Error: ${error.message || error}]`
      );

      let errorMessage = "Failed to reset password. Please try again.";

      if (error.status === 400) {
        errorMessage =
          "Invalid or expired reset token. Please request a new password reset.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrors({ general: errorMessage });
      showAlert("Reset Password Failed", errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep("email");
    setEmail("");
    setToken("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setLoading(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const handleBackToEmail = () => {
    setCurrentStep("email");
    setToken("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 24,
              width: "100%",
              maxWidth: 400,
              maxHeight: "90%",
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 15,
            }}
          >
            {/* Header */}
            <LinearGradient
              colors={["#3b82f6", "#1e40af"]}
              style={{
                paddingHorizontal: 24,
                paddingTop: 24,
                paddingBottom: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {currentStep === "reset" && (
                  <TouchableOpacity
                    onPress={handleBackToEmail}
                    style={{ marginRight: 12 }}
                  >
                    <Ionicons name="arrow-back" size={24} color="white" />
                  </TouchableOpacity>
                )}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Ionicons
                    name={currentStep === "email" ? "mail" : "key"}
                    size={20}
                    color="white"
                  />
                </View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "white",
                  }}
                >
                  {currentStep === "email"
                    ? "Reset Password"
                    : "Enter New Password"}
                </Text>
              </View>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Content */}
            <ScrollView style={{ maxHeight: 500 }}>
              <View style={{ padding: 24 }}>
                {currentStep === "email" ? (
                  // Step 1: Email Input
                  <>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#6b7280",
                        textAlign: "center",
                        marginBottom: 24,
                        lineHeight: 22,
                      }}
                    >
                      Enter your email address and we will send you a reset
                      token.
                    </Text>

                    {/* General Error */}
                    {errors.general && (
                      <View
                        style={{
                          backgroundColor: "#fef2f2",
                          borderColor: "#fecaca",
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 20,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Ionicons
                          name="alert-circle"
                          size={20}
                          color="#dc2626"
                        />
                        <Text
                          style={{
                            color: "#dc2626",
                            fontSize: 14,
                            marginLeft: 8,
                            flex: 1,
                          }}
                        >
                          {errors.general}
                        </Text>
                      </View>
                    )}

                    {/* Email Input */}
                    <View style={{ marginBottom: 20 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "#6b7280",
                          marginBottom: 8,
                          marginLeft: 4,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Email Address
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "#f9fafb",
                          borderRadius: 16,
                          borderWidth: 2,
                          borderColor: errors.email ? "#ef4444" : "#e5e7eb",
                          paddingHorizontal: 16,
                        }}
                      >
                        <Ionicons name="mail" size={20} color="#6b7280" />
                        <TextInput
                          placeholder="your.email@example.com"
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text);
                            if (errors.email) {
                              setErrors((prev) => ({
                                ...prev,
                                email: undefined,
                              }));
                            }
                          }}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          style={{
                            flex: 1,
                            padding: 16,
                            fontSize: 16,
                            color: "#111827",
                            marginLeft: 8,
                          }}
                          placeholderTextColor="#9ca3af"
                          autoFocus={true}
                        />
                      </View>
                      {errors.email && (
                        <Text
                          style={{
                            color: "#ef4444",
                            fontSize: 14,
                            marginTop: 8,
                            marginLeft: 4,
                          }}
                        >
                          {errors.email}
                        </Text>
                      )}
                    </View>

                    {/* Send Email Button */}
                    <TouchableOpacity
                      onPress={handleSendResetEmail}
                      disabled={loading}
                      style={{
                        backgroundColor: loading ? "#9ca3af" : "#3b82f6",
                        padding: 18,
                        borderRadius: 16,
                        alignItems: "center",
                        shadowColor: "#3b82f6",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                        marginBottom: 16,
                      }}
                    >
                      {loading ? (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <ActivityIndicator color="#fff" size="small" />
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "700",
                              fontSize: 16,
                              marginLeft: 8,
                            }}
                          >
                            Sending...
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Ionicons name="send" size={20} color="white" />
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "700",
                              fontSize: 16,
                              marginLeft: 8,
                              letterSpacing: 0.5,
                            }}
                          >
                            Send Reset Token
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  // Step 2: Token & Password Reset
                  <>
                    <View
                      style={{
                        backgroundColor: "#f0f9ff",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 24,
                        borderLeftWidth: 4,
                        borderLeftColor: "#3b82f6",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#1e40af",
                          fontWeight: "600",
                          marginBottom: 8,
                        }}
                      >
                        📧 Check Your Email!
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6b7280",
                          lineHeight: 20,
                        }}
                      >
                        We have sent a reset token to{" "}
                        <Text style={{ fontWeight: "600" }}>{email}</Text>. Copy
                        the token from the email and paste it below.
                      </Text>
                    </View>

                    {/* General Error */}
                    {errors.general && (
                      <View
                        style={{
                          backgroundColor: "#fef2f2",
                          borderColor: "#fecaca",
                          borderWidth: 1,
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 20,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Ionicons
                          name="alert-circle"
                          size={20}
                          color="#dc2626"
                        />
                        <Text
                          style={{
                            color: "#dc2626",
                            fontSize: 14,
                            marginLeft: 8,
                            flex: 1,
                          }}
                        >
                          {errors.general}
                        </Text>
                      </View>
                    )}

                    {/* Token Input */}
                    <View style={{ marginBottom: 20 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "#6b7280",
                          marginBottom: 8,
                          marginLeft: 4,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Reset Token
                      </Text>
                      <View
                        style={{
                          backgroundColor: "#f9fafb",
                          borderRadius: 16,
                          borderWidth: 2,
                          borderColor: errors.token ? "#ef4444" : "#e5e7eb",
                          paddingHorizontal: 16,
                        }}
                      >
                        <TextInput
                          placeholder="Paste token from email"
                          value={token}
                          onChangeText={(text) => {
                            setToken(text);
                            if (errors.token) {
                              setErrors((prev) => ({
                                ...prev,
                                token: undefined,
                              }));
                            }
                          }}
                          multiline
                          style={{
                            padding: 16,
                            fontSize: 14,
                            color: "#111827",
                            fontFamily: "monospace",
                            minHeight: 60,
                          }}
                          placeholderTextColor="#9ca3af"
                        />
                      </View>
                      {errors.token && (
                        <Text
                          style={{
                            color: "#ef4444",
                            fontSize: 14,
                            marginTop: 8,
                            marginLeft: 4,
                          }}
                        >
                          {errors.token}
                        </Text>
                      )}
                    </View>

                    {/* New Password Input */}
                    <View style={{ marginBottom: 20 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "#6b7280",
                          marginBottom: 8,
                          marginLeft: 4,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        New Password
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "#f9fafb",
                          borderRadius: 16,
                          borderWidth: 2,
                          borderColor: errors.newPassword
                            ? "#ef4444"
                            : "#e5e7eb",
                          paddingHorizontal: 16,
                        }}
                      >
                        <Ionicons
                          name="lock-closed"
                          size={20}
                          color="#6b7280"
                        />
                        <TextInput
                          placeholder="Enter new password"
                          value={newPassword}
                          onChangeText={(text) => {
                            setNewPassword(text);
                            if (errors.newPassword) {
                              setErrors((prev) => ({
                                ...prev,
                                newPassword: undefined,
                              }));
                            }
                          }}
                          secureTextEntry={!showNewPassword}
                          style={{
                            flex: 1,
                            padding: 16,
                            fontSize: 16,
                            color: "#111827",
                            marginLeft: 8,
                          }}
                          placeholderTextColor="#9ca3af"
                        />
                        <TouchableOpacity
                          onPress={() => setShowNewPassword(!showNewPassword)}
                        >
                          <Ionicons
                            name={showNewPassword ? "eye-off" : "eye"}
                            size={20}
                            color="#6b7280"
                          />
                        </TouchableOpacity>
                      </View>
                      {errors.newPassword && (
                        <Text
                          style={{
                            color: "#ef4444",
                            fontSize: 12,
                            marginTop: 6,
                            marginLeft: 4,
                          }}
                        >
                          {errors.newPassword}
                        </Text>
                      )}
                    </View>

                    {/* Confirm Password Input */}
                    <View style={{ marginBottom: 20 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "#6b7280",
                          marginBottom: 8,
                          marginLeft: 4,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        Confirm New Password
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: "#f9fafb",
                          borderRadius: 16,
                          borderWidth: 2,
                          borderColor: errors.confirmPassword
                            ? "#ef4444"
                            : "#e5e7eb",
                          paddingHorizontal: 16,
                        }}
                      >
                        <Ionicons
                          name="lock-closed"
                          size={20}
                          color="#6b7280"
                        />
                        <TextInput
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChangeText={(text) => {
                            setConfirmPassword(text);
                            if (errors.confirmPassword) {
                              setErrors((prev) => ({
                                ...prev,
                                confirmPassword: undefined,
                              }));
                            }
                          }}
                          secureTextEntry={!showConfirmPassword}
                          style={{
                            flex: 1,
                            padding: 16,
                            fontSize: 16,
                            color: "#111827",
                            marginLeft: 8,
                          }}
                          placeholderTextColor="#9ca3af"
                        />
                        <TouchableOpacity
                          onPress={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          <Ionicons
                            name={showConfirmPassword ? "eye-off" : "eye"}
                            size={20}
                            color="#6b7280"
                          />
                        </TouchableOpacity>
                      </View>
                      {errors.confirmPassword && (
                        <Text
                          style={{
                            color: "#ef4444",
                            fontSize: 12,
                            marginTop: 6,
                            marginLeft: 4,
                          }}
                        >
                          {errors.confirmPassword}
                        </Text>
                      )}
                    </View>

                    {/* Reset Password Button */}
                    <TouchableOpacity
                      onPress={handleResetPassword}
                      disabled={loading}
                      style={{
                        backgroundColor: loading ? "#9ca3af" : "#10b981",
                        padding: 18,
                        borderRadius: 16,
                        alignItems: "center",
                        shadowColor: "#10b981",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 6,
                        marginBottom: 16,
                      }}
                    >
                      {loading ? (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <ActivityIndicator color="#fff" size="small" />
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "700",
                              fontSize: 16,
                              marginLeft: 8,
                            }}
                          >
                            Updating Password...
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="white"
                          />
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "700",
                              fontSize: 16,
                              marginLeft: 8,
                              letterSpacing: 0.5,
                            }}
                          >
                            Update Password
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/* Cancel Button */}
                <TouchableOpacity
                  onPress={handleClose}
                  style={{
                    backgroundColor: "transparent",
                    paddingVertical: 16,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#6b7280",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        icon={alertIcon}
        buttons={[
          {
            text: "OK",
            onPress: () => setAlertVisible(false),
            style: "default",
          },
        ]}
        onClose={() => setAlertVisible(false)}
      />
    </Modal>
  );
}
