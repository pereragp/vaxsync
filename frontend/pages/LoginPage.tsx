import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Button,
} from "react-native";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    try {
      const response = await fetch("http://172.20.10.2:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Login Successful",
          `Welcome, ${data.firstName || data.username}!`
        );
        router.replace("/profile");
      } else {
        Alert.alert("Login Failed", data.message || "Invalid Credentials");
      }
    } catch (error) {
      Alert.alert("Error", "Network Error. Please try again.");
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
        backgroundColor: "#fff",
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "bold",
          marginBottom: 24,
          color: "#175593",
        }}
      >
        Login
      </Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          marginBottom: 16,
          borderBottomWidth: 1,
          borderColor: "#ccc",
          padding: 12,
        }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          marginBottom: 24,
          borderBottomWidth: 1,
          borderColor: "#ccc",
          padding: 12,
        }}
      />
      <TouchableOpacity
        onPress={handleLogin}
        style={{
          backgroundColor: "#175593",
          padding: 16,
          borderRadius: 8,
          alignItems: "center",
        }}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>
            Login
          </Text>
        )}
      </TouchableOpacity>

      <Button title="Register" onPress={() => router.push("/register")} />
    </View>
  );
}
