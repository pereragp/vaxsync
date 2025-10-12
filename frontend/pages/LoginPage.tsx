import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import UserAPI from "../api/userApi";
import CustomAlert from "../components/CustomAlert";
import ForgotPasswordModal from "../components/ForgotPasswordModal2";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Custom alert state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: any[];
    icon: "success" | "error" | "warning" | "info" | "question";
  }>({
    visible: false,
    title: "",
    message: "",
    buttons: [],
    icon: "info",
  });

  // Helper function to show custom alert
  const showAlert = (
    title: string,
    message: string,
    buttons: any[] = [{ text: "OK" }],
    icon: "success" | "error" | "warning" | "info" | "question" = "info"
  ) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      buttons,
      icon,
    });
  };

  const handleForgotPasswordSuccess = () => {
    showAlert(
      "Password Reset Successful! 🎉",
      "Your password has been updated successfully. You can now log in with your new password.",
      [{ text: "OK" }],
      "success"
    );
  };

  const handleLogin = async () => {
    setLoading(true);

    try {
      // Basic validation
      if (!email.trim() || !password.trim()) {
        showAlert(
          "Error",
          "Please enter both email and password",
          [{ text: "OK" }],
          "warning"
        );
        setLoading(false);
        return;
      }

      const data = await UserAPI.login(email, password);
      await AsyncStorage.setItem("userToken", data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(data.existingUser));
      showAlert(
        "Welcome Back!",
        "Login successful. Redirecting to your schedule...",
        [{ text: "OK", onPress: () => router.replace("/schedule") }],
        "success"
      );
    } catch (error) {
      // Error already handled by custom alert, no need for console logging
      showAlert(
        "Login Failed",
        "Invalid email or password. Please check your credentials and try again.",
        [{ text: "OK" }],
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Gradient Header */}
          <LinearGradient
            colors={["#1e40af", "#3b82f6", "#60a5fa"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: 60, paddingBottom: 80, paddingHorizontal: 24 }}
          >
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                  borderWidth: 3,
                  borderColor: "rgba(255,255,255,0.3)",
                }}
              >
                <Ionicons name="shield-checkmark" size={40} color="white" />
              </View>
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "800",
                  color: "white",
                  marginBottom: 4,
                  letterSpacing: 1,
                }}
              >
                VaxSync
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "rgba(255,255,255,0.95)",
                  marginBottom: 8,
                  letterSpacing: -0.3,
                }}
              >
                Welcome Back
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.85)",
                  textAlign: "center",
                }}
              >
                Sign in to manage your vaccinations
              </Text>
            </View>
          </LinearGradient>

          {/* Form Container */}
          <View style={{ flex: 1, paddingHorizontal: 24, marginTop: -40 }}>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 24,
                padding: 24,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
                marginBottom: 24,
              }}
            >
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
                    borderColor: "#e5e7eb",
                    paddingHorizontal: 16,
                  }}
                >
                  <Ionicons name="mail" size={20} color="#6b7280" />
                  <TextInput
                    placeholder="your.email@example.com"
                    value={email}
                    onChangeText={setEmail}
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
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={{ marginBottom: 28 }}>
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
                  Password
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#f9fafb",
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: "#e5e7eb",
                    paddingHorizontal: 16,
                  }}
                >
                  <Ionicons name="lock-closed" size={20} color="#6b7280" />
                  <TextInput
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
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
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
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
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: 16,
                        marginLeft: 8,
                      }}
                    >
                      Signing In...
                    </Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="log-in" size={20} color="white" />
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: 16,
                        marginLeft: 8,
                        letterSpacing: 0.5,
                      }}
                    >
                      Sign In
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Forgot Password Link */}
              <TouchableOpacity
                onPress={() => setShowForgotPasswordModal(true)}
                style={{
                  alignItems: "center",
                  paddingVertical: 12,
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: "#3b82f6",
                    fontSize: 15,
                    fontWeight: "600",
                    textDecorationLine: "underline",
                  }}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginVertical: 24,
                }}
              >
                <View
                  style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }}
                />
                <Text
                  style={{
                    marginHorizontal: 16,
                    color: "#6b7280",
                    fontSize: 14,
                    fontWeight: "500",
                  }}
                >
                  Do not have an account?
                </Text>
                <View
                  style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }}
                />
              </View>

              {/* Register Button */}
              <TouchableOpacity
                onPress={() => router.push("/register")}
                style={{
                  backgroundColor: "white",
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: "#3b82f6",
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="person-add" size={20} color="#3b82f6" />
                  <Text
                    style={{
                      color: "#3b82f6",
                      fontWeight: "700",
                      fontSize: 16,
                      marginLeft: 8,
                    }}
                  >
                    Create New Account
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Alert */}
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        buttons={customAlert.buttons}
        icon={customAlert.icon}
        onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        visible={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onSuccess={handleForgotPasswordSuccess}
      />
    </SafeAreaView>
  );
}
