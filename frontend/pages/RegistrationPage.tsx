import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [firstName, setFirstname] = useState("");
  const [lastName, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        "http://192.168.1.6:5000/api/users/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            firstName,
            lastName,
            email,
            password,
            dateOfBirth,
            gender,
            phone,
          }),
        }
      );
      const data = await response.json();

      if (response.ok) {
        Alert.alert("Registration Successful", "You can now log in.");
        router.replace("/login"); // Redirect to login page
      } else {
        Alert.alert("Registration Failed", data.message || "Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
  <View
    style={{
      flex: 1,
      padding: 24,
      backgroundColor: "#f8fafc",
    }}
  >
    <Text
      style={{
        fontSize: 32,
        fontWeight: "800",
        marginBottom: 32,
        color: "#175593",
        textAlign: "center",
        letterSpacing: -0.5,
      }}
    >
      Create Account
    </Text>
    
    <TextInput
      style={{
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: "#fff",
        color: "#111827",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
      placeholder="Username"
      value={username}
      onChangeText={setUsername}
    />
    
    <TextInput
      style={{
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: "#fff",
        color: "#111827",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
      placeholder="First Name"
      value={firstName}
      onChangeText={setFirstname}
    />
    
    <TextInput
      style={{
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: "#fff",
        color: "#111827",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
      placeholder="Last Name"
      value={lastName}
      onChangeText={setLastname}
    />
    
    <TextInput
      style={{
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: "#fff",
        color: "#111827",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
      placeholder="Email"
      value={email}
      onChangeText={setEmail}
      autoCapitalize="none"
      keyboardType="email-address"
    />
    
    <TextInput
      style={{
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: "#fff",
        color: "#111827",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
      placeholder="Password"
      value={password}
      onChangeText={setPassword}
      secureTextEntry
    />
    
    <TextInput
      style={{
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: "#fff",
        color: "#111827",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
      placeholder="Date of Birth (YYYY-MM-DD)"
      value={dateOfBirth}
      onChangeText={setDateOfBirth}
    />
    
    <Text
      style={{
        fontSize: 16,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 12,
        marginLeft: 4,
      }}
    >
      Gender
    </Text>
    
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
        }}
        onPress={() => setGender("Male")}
      >
        <View
          style={[
            {
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: "#d1d5db",
              marginRight: 8,
              alignItems: "center",
              justifyContent: "center",
            },
            gender === "Male" && {
              borderColor: "#175593",
              backgroundColor: "#175593",
            },
          ]}
        />
        <Text
          style={{
            fontSize: 15,
            color: "#374151",
            fontWeight: "500",
          }}
        >
          Male
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
          justifyContent: "center",
        }}
        onPress={() => setGender("Female")}
      >
        <View
          style={[
            {
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: "#d1d5db",
              marginRight: 8,
              alignItems: "center",
              justifyContent: "center",
            },
            gender === "Female" && {
              borderColor: "#175593",
              backgroundColor: "#175593",
            },
          ]}
        />
        <Text
          style={{
            fontSize: 15,
            color: "#374151",
            fontWeight: "500",
          }}
        >
          Female
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
          justifyContent: "flex-end",
        }}
        onPress={() => setGender("Other")}
      >
        <View
          style={[
            {
              width: 20,
              height: 20,
              borderRadius: 10,
              borderWidth: 2,
              borderColor: "#d1d5db",
              marginRight: 8,
              alignItems: "center",
              justifyContent: "center",
            },
            gender === "Other" && {
              borderColor: "#175593",
              backgroundColor: "#175593",
            },
          ]}
        />
        <Text
          style={{
            fontSize: 15,
            color: "#374151",
            fontWeight: "500",
          }}
        >
          Other
        </Text>
      </TouchableOpacity>
    </View>
    
    <TextInput
      style={{
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: "#fff",
        color: "#111827",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
      placeholder="Phone"
      value={phone}
      onChangeText={setPhone}
      keyboardType="phone-pad"
    />
    
    <TouchableOpacity
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
      onPress={handleRegister}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text
          style={{
            color: "#fff",
            fontWeight: "700",
            fontSize: 16,
            letterSpacing: 0.5,
          }}
        >
          Create Account
        </Text>
      )}
    </TouchableOpacity>
  </View>
);
}

