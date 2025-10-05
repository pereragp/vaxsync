import { useRouter } from "expo-router";
import React, { useState } from "react";
import UserAPI from "../api/userApi";
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
  const [bloodType, setBloodType] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);

    try {
      // Basic validation
      if (
        !username.trim() ||
        !firstName.trim() ||
        !lastName.trim() ||
        !email.trim() ||
        !password.trim() ||
        !dateOfBirth.trim() ||
        !gender.trim() ||
        !bloodType.trim() ||
        !phone.trim()
      ) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }

      const userData = {
        username,
        firstName,
        lastName,
        email,
        password,
        dateOfBirth,
        gender,
        bloodType,
        phone,
      };

      await UserAPI.register(userData);

      Alert.alert("Registration Successful", "You can now login..", [
        { text: "OK", onPress: () => router.replace("/login") },
      ]);
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert(
        "Registration Failed",
        "Please check your information and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Registration</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstname}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastname}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Date of Birth (YYYY-MM-DD)"
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
      />
      <Text style={styles.label}>Gender</Text>
      <View style={styles.radioGroup}>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => setGender("Male")}
        >
          <View
            style={[
              styles.radioCircle,
              gender === "Male" && styles.selectedRadio,
            ]}
          />
          <Text style={styles.radioText}>Male</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => setGender("Female")}
        >
          <View
            style={[
              styles.radioCircle,
              gender === "Female" && styles.selectedRadio,
            ]}
          />
          <Text style={styles.radioText}>Female</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.radioButton}
          onPress={() => setGender("Other")}
        >
          <View
            style={[
              styles.radioCircle,
              gender === "Other" && styles.selectedRadio,
            ]}
          />
          <Text style={styles.radioText}>Other</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Blood Type</Text>
      <View style={styles.bloodTypeContainer}>
        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.bloodTypeButton,
              bloodType === type && styles.selectedBloodType,
            ]}
            onPress={() => setBloodType(type)}
          >
            <Text
              style={[
                styles.bloodTypeText,
                bloodType === type && styles.selectedBloodTypeText,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#175593",
    alignSelf: "center",
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#175593",
  },
  radioGroup: {
    flexDirection: "row",
    marginBottom: 16,
    justifyContent: "space-between",
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#175593",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  selectedRadio: {
    backgroundColor: "#175593",
  },
  radioText: {
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#175593",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  bloodTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    justifyContent: "space-between",
  },
  bloodTypeButton: {
    borderWidth: 1,
    borderColor: "#175593",
    borderRadius: 6,
    padding: 8,
    margin: 4,
    minWidth: 50,
    alignItems: "center",
  },
  selectedBloodType: {
    backgroundColor: "#175593",
  },
  bloodTypeText: {
    fontSize: 14,
    color: "#175593",
  },
  selectedBloodTypeText: {
    color: "#fff",
  },
});
