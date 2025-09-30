import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import UserAPI from "../api/userApi";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    try {
      // Basic validation
      if (!email.trim() || !password.trim()) {
        Alert.alert("Error", "Please enter both email and password");
        return;
      }

      const data = await UserAPI.login(email, password);
      await AsyncStorage.setItem("userToken", data.token);
      await AsyncStorage.setItem("userData", JSON.stringify(data.existingUser));
      Alert.alert("Login Successful", "You have been logged in successfully!", [
        { text: "OK", onPress: () => router.push("/profile") },
      ]);
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#f8fafc",
      }}
    >
      {/* Header Section */}
      <View style={{ alignItems: "center", marginBottom: 48 }}>
        <Text
          style={{
            fontSize: 32,
            fontWeight: "800",
            color: "#175593",
            marginBottom: 8,
            letterSpacing: -0.5,
          }}
        >
          Welcome Back
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#64748b",
            textAlign: "center",
          }}
        >
          Sign in to your account
        </Text>
      </View>

      {/* Form Container */}
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
          marginBottom: 24,
        }}
      >
        {/* Email Input */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 8,
            }}
          >
            Email Address
          </Text>
          <TextInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              backgroundColor: "#f9fafb",
              color: "#111827",
            }}
          />
        </View>

        {/* Password Input */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#374151",
              marginBottom: 8,
            }}
          >
            Password
          </Text>
          <TextInput
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              backgroundColor: "#f9fafb",
              color: "#111827",
            }}
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          style={{
            backgroundColor: "#175593",
            padding: 18,
            borderRadius: 12,
            alignItems: "center",
            shadowColor: "#175593",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: 16,
                letterSpacing: 0.5,
              }}
            >
              Sign In
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Register Section */}
      <View
        style={{
          alignItems: "center",
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: "#6b7280",
            marginBottom: 12,
          }}
        >
          Do not have an account?
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/register")}
          style={{
            backgroundColor: "transparent",
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#175593",
          }}
        >
          <Text
            style={{
              color: "#175593",
              fontWeight: "600",
              fontSize: 15,
            }}
          >
            Create Account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
