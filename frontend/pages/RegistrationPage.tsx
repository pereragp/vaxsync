import { useRouter } from "expo-router";
import React, { useState } from "react";
import UserAPI from "../api/userApi";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomAlert from "../components/CustomAlert";

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
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
  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const router = useRouter();

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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!username.trim() || !email.trim() || !password.trim()) {
          showAlert(
            "Error",
            "Please fill in all account credentials",
            [{ text: "OK" }],
            "warning"
          );
          return false;
        }
        // Password validation: at least 8 chars, 1 letter, 1 number
        if (
          password.length < 8 ||
          !/[A-Za-z]/.test(password) ||
          !/\d/.test(password)
        ) {
          showAlert(
            "Error",
            "Password must be at least 8 characters and contain at least one letter and one number.",
            [{ text: "OK" }],
            "warning"
          );
          return false;
        }
        return true;
      case 2:
        if (
          !firstName.trim() ||
          !lastName.trim() ||
          !phone.trim() ||
          !dateOfBirth.trim() ||
          !gender.trim()
        ) {
          showAlert(
            "Error",
            "Please fill in all personal information",
            [{ text: "OK" }],
            "warning"
          );
          return false;
        }
        // Sri Lankan mobile number validation: 10 digits, starts with 07, third digit 0-9
        if (!/^07[0-9]{8}$/.test(phone)) {
          showAlert(
            "Error",
            "Mobile number must be a valid Sri Lankan number (e.g., 0712345678).",
            [{ text: "OK" }],
            "warning"
          );
          return false;
        }
        return true;
      case 3:
        if (!bloodType.trim()) {
          showAlert(
            "Error",
            "Please select your blood type",
            [{ text: "OK" }],
            "warning"
          );
          return false;
        }
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleRegister();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRegister = async () => {
    setLoading(true);

    try {
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

      showAlert(
        "Registration Successful",
        "Your account has been created! You can now login.",
        [{ text: "OK", onPress: () => router.replace("/login") }],
        "success"
      );
    } catch (error) {
      showAlert(
        "Registration Failed",
        "Please check your information and try again.",
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
            style={{ paddingTop: 50, paddingBottom: 60, paddingHorizontal: 24 }}
          >
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                  borderWidth: 3,
                  borderColor: "rgba(255,255,255,0.3)",
                }}
              >
                <Ionicons name="person-add" size={36} color="white" />
              </View>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "800",
                  color: "white",
                  marginBottom: 6,
                  letterSpacing: -0.5,
                }}
              >
                Create Account
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.9)",
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                Join VaxSync to manage vaccinations
              </Text>

              {/* Step Indicator */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {[1, 2, 3].map((step) => (
                  <View
                    key={step}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <View
                      style={{
                        width: step === currentStep ? 36 : 28,
                        height: step === currentStep ? 36 : 28,
                        borderRadius: step === currentStep ? 18 : 14,
                        backgroundColor:
                          step <= currentStep
                            ? "white"
                            : "rgba(255,255,255,0.3)",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: step === currentStep ? 3 : 0,
                        borderColor: "rgba(255,255,255,0.5)",
                      }}
                    >
                      {step < currentStep ? (
                        <Ionicons name="checkmark" size={16} color="#10b981" />
                      ) : (
                        <Text
                          style={{
                            fontSize: step === currentStep ? 16 : 14,
                            fontWeight: "700",
                            color:
                              step <= currentStep
                                ? "#3b82f6"
                                : "rgba(255,255,255,0.7)",
                          }}
                        >
                          {step}
                        </Text>
                      )}
                    </View>
                    {step < 3 && (
                      <View
                        style={{
                          width: 40,
                          height: 2,
                          backgroundColor:
                            step < currentStep
                              ? "white"
                              : "rgba(255,255,255,0.3)",
                          marginHorizontal: 8,
                        }}
                      />
                    )}
                  </View>
                ))}
              </View>
            </View>
          </LinearGradient>

          {/* Form Container */}
          <View style={{ flex: 1, paddingHorizontal: 24, marginTop: -30 }}>
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
              {/* Step 1: Account Credentials Section */}
              {currentStep === 1 && (
                <View style={{ marginBottom: 24 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: "#dbeafe",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="key" size={18} color="#3b82f6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: "#1f2937",
                        }}
                      >
                        Account Credentials
                      </Text>
                      <Text
                        style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}
                      >
                        Step 1 of 3
                      </Text>
                    </View>
                  </View>

                  {/* Username */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#6b7280",
                        marginBottom: 8,
                        marginLeft: 4,
                        letterSpacing: 0.5,
                      }}
                    >
                      USERNAME
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#f9fafb",
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: "#e5e7eb",
                        paddingHorizontal: 14,
                      }}
                    >
                      <Ionicons name="at" size={18} color="#6b7280" />
                      <TextInput
                        placeholder="Choose a username"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        style={{
                          flex: 1,
                          padding: 14,
                          fontSize: 15,
                          color: "#111827",
                          marginLeft: 8,
                        }}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  {/* Email */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#6b7280",
                        marginBottom: 8,
                        marginLeft: 4,
                        letterSpacing: 0.5,
                      }}
                    >
                      EMAIL ADDRESS
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#f9fafb",
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: "#e5e7eb",
                        paddingHorizontal: 14,
                      }}
                    >
                      <Ionicons name="mail" size={18} color="#6b7280" />
                      <TextInput
                        placeholder="your.email@example.com"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={{
                          flex: 1,
                          padding: 14,
                          fontSize: 15,
                          color: "#111827",
                          marginLeft: 8,
                        }}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  {/* Password */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#6b7280",
                        marginBottom: 8,
                        marginLeft: 4,
                        letterSpacing: 0.5,
                      }}
                    >
                      PASSWORD
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#f9fafb",
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: "#e5e7eb",
                        paddingHorizontal: 14,
                      }}
                    >
                      <Ionicons name="lock-closed" size={18} color="#6b7280" />
                      <TextInput
                        placeholder="Create a strong password (min. 8 characters)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        style={{
                          flex: 1,
                          padding: 14,
                          fontSize: 15,
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
                          size={18}
                          color="#6b7280"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Step 2: Personal Information Section */}
              {currentStep === 2 && (
                <View style={{ marginBottom: 24 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: "#dbeafe",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="person" size={18} color="#3b82f6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: "#1f2937",
                        }}
                      >
                        Personal Information
                      </Text>
                      <Text
                        style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}
                      >
                        Step 2 of 3
                      </Text>
                    </View>
                  </View>

                  {/* First Name */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#6b7280",
                        marginBottom: 8,
                        marginLeft: 4,
                        letterSpacing: 0.5,
                      }}
                    >
                      FIRST NAME
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#f9fafb",
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: "#e5e7eb",
                        paddingHorizontal: 14,
                      }}
                    >
                      <Ionicons name="person" size={18} color="#6b7280" />
                      <TextInput
                        placeholder="First name"
                        value={firstName}
                        onChangeText={setFirstname}
                        style={{
                          flex: 1,
                          padding: 14,
                          fontSize: 15,
                          color: "#111827",
                          marginLeft: 8,
                        }}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  {/* Last Name */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#6b7280",
                        marginBottom: 8,
                        marginLeft: 4,
                        letterSpacing: 0.5,
                      }}
                    >
                      LAST NAME
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#f9fafb",
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: "#e5e7eb",
                        paddingHorizontal: 14,
                      }}
                    >
                      <Ionicons
                        name="person-outline"
                        size={18}
                        color="#6b7280"
                      />
                      <TextInput
                        placeholder="Last name"
                        value={lastName}
                        onChangeText={setLastname}
                        style={{
                          flex: 1,
                          padding: 14,
                          fontSize: 15,
                          color: "#111827",
                          marginLeft: 8,
                        }}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  {/* Phone */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#6b7280",
                        marginBottom: 8,
                        marginLeft: 4,
                        letterSpacing: 0.5,
                      }}
                    >
                      PHONE NUMBER
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#f9fafb",
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: "#e5e7eb",
                        paddingHorizontal: 14,
                      }}
                    >
                      <Ionicons name="call" size={18} color="#6b7280" />
                      <TextInput
                        placeholder="Phone number"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        style={{
                          flex: 1,
                          padding: 14,
                          fontSize: 15,
                          color: "#111827",
                          marginLeft: 8,
                        }}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  </View>

                  {/* Date of Birth */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#6b7280",
                        marginBottom: 8,
                        marginLeft: 4,
                        letterSpacing: 0.5,
                      }}
                    >
                      DATE OF BIRTH
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#f9fafb",
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: "#e5e7eb",
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          backgroundColor: "#f3e8ff",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                        }}
                      >
                        <Ionicons name="calendar" size={18} color="#8b5cf6" />
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 15,
                          fontWeight: "500",
                          color: dateOfBirth ? "#111827" : "#9ca3af",
                        }}
                      >
                        {dateOfBirth
                          ? new Date(dateOfBirth).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Tap to select date"}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#3b82f6"
                      />
                    </TouchableOpacity>

                    {/* Native Date Picker */}
                    {showDatePicker && Platform.OS === "ios" && (
                      <Modal
                        transparent
                        animationType="slide"
                        visible={showDatePicker}
                        onRequestClose={() => setShowDatePicker(false)}
                      >
                        <View
                          style={{
                            flex: 1,
                            backgroundColor: "rgba(0,0,0,0.5)",
                            justifyContent: "flex-end",
                          }}
                        >
                          <View
                            style={{
                              backgroundColor: "white",
                              borderTopLeftRadius: 24,
                              borderTopRightRadius: 24,
                              padding: 16,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 16,
                              }}
                            >
                              <TouchableOpacity
                                onPress={() => setShowDatePicker(false)}
                              >
                                <Text
                                  style={{ color: "#3b82f6", fontSize: 16 }}
                                >
                                  Cancel
                                </Text>
                              </TouchableOpacity>
                              <Text
                                style={{
                                  fontSize: 17,
                                  fontWeight: "600",
                                  color: "#1f2937",
                                }}
                              >
                                Select Date
                              </Text>
                              <TouchableOpacity
                                onPress={() => setShowDatePicker(false)}
                              >
                                <Text
                                  style={{
                                    color: "#3b82f6",
                                    fontSize: 16,
                                    fontWeight: "600",
                                  }}
                                >
                                  Done
                                </Text>
                              </TouchableOpacity>
                            </View>
                            <DateTimePicker
                              value={selectedDate}
                              mode="date"
                              display="spinner"
                              onChange={(_event: any, date?: Date) => {
                                if (date) {
                                  setSelectedDate(date);
                                  setDateOfBirth(
                                    date.toISOString().split("T")[0]
                                  );
                                }
                              }}
                              maximumDate={new Date()}
                            />
                          </View>
                        </View>
                      </Modal>
                    )}
                    {showDatePicker && Platform.OS === "android" && (
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={(_event: any, date?: Date) => {
                          setShowDatePicker(false);
                          if (date) {
                            setSelectedDate(date);
                            setDateOfBirth(date.toISOString().split("T")[0]);
                          }
                        }}
                        maximumDate={new Date()}
                      />
                    )}
                  </View>

                  {/* Gender */}
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#6b7280",
                        marginBottom: 8,
                        marginLeft: 4,
                        letterSpacing: 0.5,
                      }}
                    >
                      GENDER
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      {[
                        { label: "Male", icon: "male" },
                        { label: "Female", icon: "female" },
                        { label: "Other", icon: "transgender" },
                      ].map((option) => {
                        const isSelected = gender === option.label;
                        return (
                          <TouchableOpacity
                            key={option.label}
                            onPress={() => setGender(option.label)}
                            style={{ flex: 1, marginHorizontal: 4 }}
                          >
                            {isSelected ? (
                              <LinearGradient
                                colors={["#3b82f6", "#2563eb"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={{
                                  padding: 14,
                                  borderRadius: 12,
                                  borderWidth: 2,
                                  borderColor: "#3b82f6",
                                }}
                              >
                                <View style={{ alignItems: "center" }}>
                                  <Ionicons
                                    name={option.icon as any}
                                    size={22}
                                    color="white"
                                  />
                                  <Text
                                    style={{
                                      textAlign: "center",
                                      fontWeight: "700",
                                      marginTop: 6,
                                      color: "white",
                                    }}
                                  >
                                    {option.label}
                                  </Text>
                                </View>
                              </LinearGradient>
                            ) : (
                              <View
                                style={{
                                  padding: 14,
                                  borderRadius: 12,
                                  borderWidth: 2,
                                  borderColor: "#e5e7eb",
                                  backgroundColor: "white",
                                }}
                              >
                                <View style={{ alignItems: "center" }}>
                                  <Ionicons
                                    name={option.icon as any}
                                    size={22}
                                    color="#6b7280"
                                  />
                                  <Text
                                    style={{
                                      textAlign: "center",
                                      fontWeight: "700",
                                      marginTop: 6,
                                      color: "#374151",
                                    }}
                                  >
                                    {option.label}
                                  </Text>
                                </View>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}

              {/* Step 3: Medical Information Section */}
              {currentStep === 3 && (
                <View style={{ marginBottom: 20 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: "#fee2e2",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name="medical" size={18} color="#ef4444" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: "#1f2937",
                        }}
                      >
                        Medical Information
                      </Text>
                      <Text
                        style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}
                      >
                        Step 3 of 3 - Final Step
                      </Text>
                    </View>
                  </View>

                  {/* Blood Type */}
                  <View>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: "#6b7280",
                        marginBottom: 12,
                        marginLeft: 4,
                        letterSpacing: 0.5,
                      }}
                    >
                      BLOOD TYPE
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 4 }}
                    >
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                        (type) => {
                          const isSelected = bloodType === type;
                          return (
                            <TouchableOpacity
                              key={type}
                              onPress={() => setBloodType(type)}
                              style={{ marginRight: 8 }}
                            >
                              {isSelected ? (
                                <LinearGradient
                                  colors={["#ef4444", "#dc2626"]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 0, y: 1 }}
                                  style={{
                                    paddingHorizontal: 18,
                                    paddingVertical: 14,
                                    borderRadius: 12,
                                    borderWidth: 2,
                                    borderColor: "#ef4444",
                                    minWidth: 70,
                                    alignItems: "center",
                                  }}
                                >
                                  <Ionicons
                                    name="water"
                                    size={16}
                                    color="white"
                                  />
                                  <Text
                                    style={{
                                      fontWeight: "700",
                                      fontSize: 17,
                                      marginTop: 4,
                                      color: "white",
                                    }}
                                  >
                                    {type}
                                  </Text>
                                </LinearGradient>
                              ) : (
                                <View
                                  style={{
                                    paddingHorizontal: 18,
                                    paddingVertical: 14,
                                    borderRadius: 12,
                                    borderWidth: 2,
                                    borderColor: "#e5e7eb",
                                    backgroundColor: "white",
                                    minWidth: 70,
                                    alignItems: "center",
                                  }}
                                >
                                  <Ionicons
                                    name="water"
                                    size={16}
                                    color="#ef4444"
                                  />
                                  <Text
                                    style={{
                                      fontWeight: "700",
                                      fontSize: 17,
                                      marginTop: 4,
                                      color: "#1f2937",
                                    }}
                                  >
                                    {type}
                                  </Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        }
                      )}
                    </ScrollView>
                    <View
                      style={{
                        marginTop: 12,
                        padding: 12,
                        backgroundColor: "#dbeafe",
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: "#bfdbfe",
                      }}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Ionicons
                          name="information-circle"
                          size={14}
                          color="#3b82f6"
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#1e40af",
                            marginLeft: 8,
                            flex: 1,
                          }}
                        >
                          Swipe to see all blood types • Tap to select
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Navigation Buttons */}
              <View style={{ marginTop: 24 }}>
                {/* Main Action Button */}
                <TouchableOpacity
                  onPress={handleNext}
                  disabled={loading}
                  style={{
                    backgroundColor: loading
                      ? "#9ca3af"
                      : currentStep === 3
                        ? "#10b981"
                        : "#3b82f6",
                    padding: 18,
                    borderRadius: 16,
                    alignItems: "center",
                    shadowColor: currentStep === 3 ? "#10b981" : "#3b82f6",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                    marginBottom: 12,
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
                        Creating Account...
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons
                        name={
                          currentStep === 3
                            ? "checkmark-circle"
                            : "arrow-forward"
                        }
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
                        {currentStep === 3 ? "Create Account" : "Next Step"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Back/Cancel Button */}
                <TouchableOpacity
                  onPress={
                    currentStep === 1 ? () => router.push("/login") : handleBack
                  }
                  style={{
                    backgroundColor: "white",
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: "#e5e7eb",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons
                      name={currentStep === 1 ? "log-in" : "arrow-back"}
                      size={20}
                      color="#6b7280"
                    />
                    <Text
                      style={{
                        color: "#6b7280",
                        fontWeight: "700",
                        fontSize: 16,
                        marginLeft: 8,
                      }}
                    >
                      {currentStep === 1 ? "Sign In Instead" : "Previous Step"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
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
    </SafeAreaView>
  );
}
