import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import userAPI, { User, Dependent } from "../api/userApi";
import { router } from "expo-router";
import DependentCard from "@/components/DependentCard";
import DependentModal from "@/components/DependentModal";
import ChangePassword from "../components/ChangePassword";
import CustomAlert from "../components/CustomAlert";
import NotificationSettings from "../components/NotificationSettings";

export default function ProfilePage() {
  //State variables
  const [user, setUser] = useState<User | null>(null);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedDependent, setSelectedDependent] = useState<Dependent | null>(
    null
  );
  const [showDependentModal, setShowDependentModal] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] =
    useState<boolean>(false);

  const genderOptions = ["Male", "Female", "Other"];
  const dependentTypeOptions = [
    "Child",
    "Spouse",
    "Parent",
    "Sibling",
    "Other",
  ];

  // Modal states
  const [showAddDependentModal, setShowAddDependentModal] = useState(false);
  const [showRelationshipDropdown, setShowRelationshipDropdown] =
    useState(false);
  const [currentDependentStep, setCurrentDependentStep] = useState(1);
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] =
    useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [quickEditValue, setQuickEditValue] = useState<any>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    bloodType: "",
  });
  const [showQuickEditDatePicker, setShowQuickEditDatePicker] = useState(false);
  const [quickEditDate, setQuickEditDate] = useState(new Date());

  // Add dependent form states
  const [dependentForm, setDependentForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "Male",
    dependentType: "",
  });

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  // Handle quick edit of individual fields
  const handleQuickEdit = (fieldName: string) => {
    if (!user) return;

    setEditingField(fieldName);

    // Pre-populate with current values
    if (fieldName === "name") {
      setQuickEditValue({
        ...quickEditValue,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } else if (fieldName === "dateOfBirth") {
      setQuickEditValue({
        ...quickEditValue,
        dateOfBirth: user.dateOfBirth,
      });
      setQuickEditDate(new Date(user.dateOfBirth));
    } else {
      setQuickEditValue({
        ...quickEditValue,
        [fieldName]: user[fieldName as keyof User] || "",
      });
    }

    setShowQuickEditModal(true);
  };

  // Handle quick edit submission
  const handleQuickEditSubmit = async () => {
    try {
      setLoading(true);

      let updateData: any = {};

      if (editingField === "name") {
        if (
          !quickEditValue.firstName.trim() ||
          !quickEditValue.lastName.trim()
        ) {
          showAlert(
            "Please enter both first and last name",
            "Validation error",
            [{ text: "OK" }],
            "warning"
          );
          setLoading(false);
          return;
        }
        updateData = {
          firstName: quickEditValue.firstName.trim(),
          lastName: quickEditValue.lastName.trim(),
        };
      } else if (editingField) {
        updateData = { [editingField]: quickEditValue[editingField] };
      }

      const updatedUser = await userAPI.updateProfile(updateData);
      setUser(updatedUser);
      setShowQuickEditModal(false);
      showAlert(
        "Success",
        "Profile updated successfully!",
        [{ text: "OK" }],
        "success"
      );
    } catch (error: any) {
      console.error("Error updating profile:", error);
      showAlert(
        "Error",
        error.message || "Failed to update profile",
        [{ text: "OK" }],
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

  // Reload data when page comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current user data using JWT token
      const userData = await userAPI.getCurrentUser();
      setUser(userData);

      // Try to fetch dependents using the user's ID
      const dependentsData = await userAPI.getDependents(userData._id);
      setDependents(dependentsData);
    } catch (error: any) {
      console.error("Error loading user data:", error);

      // More detailed error handling
      if (error.message.includes("No authentication token found")) {
        setError("Please log in to view your profile.");
      } else if (error.message.includes("401")) {
        setError("Your session has expired. Please log in again.");
      } else if (error.message.includes("404")) {
        setError(
          "User not found in database. Please check if the backend is running."
        );
      } else if (error.message.includes("Network request failed")) {
        setError(
          "Cannot connect to backend server. Please ensure the backend is running on http://10.170.82.39:5000"
        );
      } else {
        setError(error.message || "Failed to load user data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    showAlert(
      "Confirm Logout",
      "Are you sure you want to sign out?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await userAPI.logout();
              showAlert(
                "Logout Successful",
                "You have been logged out successfully!",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      router.replace("/login");
                    },
                  },
                ],
                "success"
              );
            } catch (error) {
              console.error("Logout Failed: ", error);
              showAlert(
                "Logout Failed",
                "Please try again...",
                [{ text: "OK" }],
                "error"
              );
            }
          },
        },
      ],
      "question"
    );
  };

  // Optional: Refresh dependents from server after adding
  const refreshDependents = async () => {
    if (user?._id) {
      try {
        const updatedDependents = await userAPI.getDependents(user._id);
        setDependents(updatedDependents);
      } catch (error) {
        console.error("Error refreshing dependents:", error);
      }
    }
  };

  // Handle dependent card press to show modal
  const handleDependentPress = (dependent: Dependent) => {
    setSelectedDependent(dependent);
    setShowDependentModal(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setShowDependentModal(false);
    setSelectedDependent(null);
  };

  // Handle dependent deleted from modal
  const handleDependentDeleted = () => {
    refreshDependents();
  };

  // Dependent form step validation
  const validateDependentStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Step 1: Personal Details
        if (!dependentForm.firstName.trim() || !dependentForm.lastName.trim()) {
          showAlert(
            "Please enter first and last name",
            "Validation error",
            [{ text: "OK" }],
            "warning"
          );
          return false;
        }
        if (!dependentForm.dateOfBirth) {
          showAlert(
            "Please select date of birth",
            "Validation error",
            [{ text: "OK" }],
            "warning"
          );
          return false;
        }
        if (!dependentForm.gender) {
          showAlert(
            "Please select a gender",
            "Validation error",
            [{ text: "OK" }],
            "warning"
          );
          return false;
        }
        return true;
      case 2:
        // Step 2: Relationship
        if (!dependentForm.dependentType) {
          showAlert(
            "Please select a relationship",
            "Validation error",
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

  const handleDependentNext = () => {
    if (validateDependentStep(currentDependentStep)) {
      if (currentDependentStep < 2) {
        setCurrentDependentStep(currentDependentStep + 1);
      } else {
        handleAddDependent();
      }
    }
  };

  const handleDependentBack = () => {
    if (currentDependentStep > 1) {
      setCurrentDependentStep(currentDependentStep - 1);
    } else {
      setShowAddDependentModal(false);
      setCurrentDependentStep(1);
    }
  };

  const handleAddDependent = async () => {
    try {
      setLoading(true);

      //Ensure user exists
      if (!user?._id) {
        showAlert(
          "Error",
          "User information not available",
          [{ text: "OK" }],
          "error"
        );
        setLoading(false);
        return;
      }

      //Call the backend API
      const newDependent = await userAPI.addDependent({
        firstName: dependentForm.firstName.trim(),
        lastName: dependentForm.lastName.trim(),
        dateOfBirth: dependentForm.dateOfBirth,
        gender: dependentForm.gender.trim(),
        dependentType: dependentForm.dependentType.trim(),
        guardianId: user._id,
      });

      //Update local state with new dependent
      setDependents([...dependents, newDependent]);

      //Close pop-up and reset form
      setShowAddDependentModal(false);
      setCurrentDependentStep(1);
      setDependentForm({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "Male",
        dependentType: "",
      });

      showAlert(
        "Success",
        "Dependent added successfully.",
        [{ text: "OK" }],
        "success"
      );
      await refreshDependents();
    } catch (error: any) {
      console.error("Error adding dependent: ", error);
      showAlert(
        "Error",
        error.message || "Failed to add dependent",
        [{ text: "OK" }],
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading && !user) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#175593" />
          <Text className="text-gray-600 mt-4">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View className="flex-1 justify-center items-center p-6">
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text className="text-xl font-bold text-gray-800 mt-4 mb-2">
            Error Loading Profile
          </Text>
          <Text className="text-gray-600 text-center mb-6">{error}</Text>
          <TouchableOpacity
            onPress={loadUserData}
            className="bg-blue-500 rounded-lg px-6 py-3"
          >
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />

      <ScrollView
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Blue Gradient Header */}
        <LinearGradient
          colors={["#1e40af", "#3b82f6", "#60a5fa"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 pt-4 pb-6"
        >
          {/* Small Title Bar */}
          <View className="flex-row items-center mb-4">
            <Text className="text-white text-lg font-semibold">Account</Text>
          </View>

          {/* Large Profile Card */}
          <View
            className="bg-white rounded-3xl p-6 shadow-2xl"
            style={{ elevation: 8 }}
          >
            <View className="items-center mb-5">
              {/* Larger Avatar */}
              <View className="relative mb-3">
                <View
                  className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center shadow-lg"
                  style={{ elevation: 4 }}
                >
                  {user?.avatar ? (
                    <Image
                      source={{ uri: user.avatar }}
                      className="w-24 h-24 rounded-full"
                    />
                  ) : (
                    <Ionicons name="person" size={48} color="#1e40af" />
                  )}
                </View>
                <View className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-2 border-4 border-white">
                  <Ionicons name="checkmark" size={12} color="white" />
                </View>
              </View>

              <Text className="text-2xl font-bold text-gray-800 text-center">
                {user?.firstName} {user?.lastName}
              </Text>
              <Text className="text-blue-600 text-base font-medium">
                @{user?.username}
              </Text>
              <View className="bg-blue-50 rounded-full px-4 py-2 mt-2">
                <Text className="text-blue-700 text-sm font-semibold">
                  {user && calculateAge(user.dateOfBirth)} years old •{" "}
                  {user?.gender}
                </Text>
              </View>
            </View>

            {/* Horizontal Stats Bar */}
            <View className="bg-gray-50 rounded-2xl p-4 flex-row justify-around">
              <View className="items-center">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="people" size={18} color="#1e40af" />
                </View>
                <Text className="text-2xl font-bold text-blue-600">
                  {dependents.length}
                </Text>
                <Text className="text-xs text-gray-600 font-medium">
                  Family Members
                </Text>
              </View>

              <View className="w-px bg-gray-300" />

              <View className="items-center">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="shield-checkmark" size={18} color="#10b981" />
                </View>
                <Text className="text-2xl font-bold text-green-600">
                  {dependents.length + 1}
                </Text>
                <Text className="text-xs text-gray-600 font-medium">
                  Health Records
                </Text>
              </View>

              <View className="w-px bg-gray-300" />

              <View className="items-center">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="time" size={18} color="#f59e0b" />
                </View>
                <Text className="text-2xl font-bold text-orange-600">
                  {(() => {
                    const joined = new Date(user?.createdAt || new Date());
                    const months = Math.floor(
                      (new Date().getTime() - joined.getTime()) /
                        (1000 * 60 * 60 * 24 * 30)
                    );
                    return months > 0 ? months : 1;
                  })()}
                  mo
                </Text>
                <Text className="text-xs text-gray-600 font-medium">
                  Member Since
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Content Container */}
        <View className="flex-1 bg-gray-50 -mt-3">
          {/* Personal Information - Modern Grid Layout */}
          <View className="pt-6 px-4">
            <View className="mb-4">
              {/* Section Header */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center mr-3">
                    <Ionicons name="person-circle" size={22} color="#3b82f6" />
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-gray-800">
                      Personal Information
                    </Text>
                    <Text className="text-xs text-gray-500">
                      Your account details
                    </Text>
                  </View>
                </View>
              </View>

              {/* Helpful Hint */}
              <View className="mb-4 bg-blue-50 rounded-xl p-3 flex-row items-center border border-blue-200">
                <Ionicons name="information-circle" size={18} color="#3b82f6" />
                <Text className="text-blue-700 text-xs ml-2 flex-1">
                  Tap any card to quickly update that information
                </Text>
              </View>

              {/* Modern Grid Cards */}
              <View>
                {/* Row 0: Full Name (Full Width) */}
                <TouchableOpacity
                  onPress={() => handleQuickEdit("name")}
                  activeOpacity={0.6}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100 mb-4"
                  style={{
                    elevation: 2,
                    borderLeftWidth: 3,
                    borderLeftColor: "#6366f1",
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-xl bg-indigo-100 items-center justify-center mr-3">
                        <Ionicons name="person" size={20} color="#6366f1" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Full Name
                        </Text>
                        <Text className="text-gray-800 font-bold text-lg mt-1">
                          {user?.firstName} {user?.lastName}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#6366f1"
                    />
                  </View>
                </TouchableOpacity>

                {/* Row 1: Email & Phone */}
                <View className="flex-row mb-4">
                  {/* Email Card */}
                  <TouchableOpacity
                    onPress={() => handleQuickEdit("email")}
                    activeOpacity={0.6}
                    className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-blue-100 mr-2"
                    style={{
                      elevation: 2,
                      borderTopWidth: 2,
                      borderTopColor: "#3b82f6",
                    }}
                  >
                    <View className="flex-row items-center mb-2">
                      <View className="w-9 h-9 rounded-xl bg-blue-100 items-center justify-center mr-2">
                        <Ionicons name="mail" size={18} color="#3b82f6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Email
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#3b82f6"
                      />
                    </View>
                    <Text
                      className="text-gray-800 font-semibold text-sm"
                      numberOfLines={1}
                    >
                      {user?.email}
                    </Text>
                  </TouchableOpacity>

                  {/* Phone Card */}
                  <TouchableOpacity
                    onPress={() => handleQuickEdit("phone")}
                    activeOpacity={0.6}
                    className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-blue-100 ml-2"
                    style={{
                      elevation: 2,
                      borderTopWidth: 2,
                      borderTopColor: "#10b981",
                    }}
                  >
                    <View className="flex-row items-center mb-2">
                      <View className="w-9 h-9 rounded-xl bg-green-100 items-center justify-center mr-2">
                        <Ionicons name="call" size={18} color="#10b981" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Phone
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#10b981"
                      />
                    </View>
                    <Text className="text-gray-800 font-semibold text-sm">
                      {user?.phone}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Row 2: DOB & Gender */}
                <View className="flex-row mb-4">
                  {/* Date of Birth Card */}
                  <TouchableOpacity
                    onPress={() => handleQuickEdit("dateOfBirth")}
                    activeOpacity={0.6}
                    className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-blue-100 mr-2"
                    style={{
                      elevation: 2,
                      borderTopWidth: 2,
                      borderTopColor: "#8b5cf6",
                    }}
                  >
                    <View className="flex-row items-center mb-2">
                      <View className="w-9 h-9 rounded-xl bg-purple-100 items-center justify-center mr-2">
                        <Ionicons name="calendar" size={18} color="#8b5cf6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Birthday
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#8b5cf6"
                      />
                    </View>
                    <Text className="text-gray-800 font-semibold text-sm">
                      {user && formatDate(user.dateOfBirth)}
                    </Text>
                  </TouchableOpacity>

                  {/* Gender Card */}
                  <TouchableOpacity
                    onPress={() => handleQuickEdit("gender")}
                    activeOpacity={0.6}
                    className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-blue-100 ml-2"
                    style={{
                      elevation: 2,
                      borderTopWidth: 2,
                      borderTopColor: "#f59e0b",
                    }}
                  >
                    <View className="flex-row items-center mb-2">
                      <View className="w-9 h-9 rounded-xl bg-orange-100 items-center justify-center mr-2">
                        <Ionicons
                          name={
                            user?.gender === "Male"
                              ? "male"
                              : user?.gender === "Female"
                                ? "female"
                                : "transgender"
                          }
                          size={18}
                          color="#f59e0b"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Gender
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#f59e0b"
                      />
                    </View>
                    <Text className="text-gray-800 font-semibold text-sm">
                      {user?.gender}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Row 3: Blood Type (Full Width) */}
                <TouchableOpacity
                  onPress={() => handleQuickEdit("bloodType")}
                  activeOpacity={0.6}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100"
                  style={{
                    elevation: 2,
                    borderLeftWidth: 3,
                    borderLeftColor: "#ef4444",
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-xl bg-red-100 items-center justify-center mr-3">
                        <Ionicons name="water" size={20} color="#ef4444" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Blood Type
                        </Text>
                        <Text className="text-gray-800 font-bold text-lg mt-1">
                          {user?.bloodType || "Not specified"}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end ml-2">
                      {user?.bloodType && (
                        <View className="bg-red-50 rounded-lg px-3 py-1 border border-red-200 mb-1">
                          <Text className="text-red-600 font-bold text-xs">
                            DONOR
                          </Text>
                        </View>
                      )}
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#ef4444"
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Dependents Section */}
          <View className="px-4 pb-6">
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-lg font-bold text-gray-800">
                    Family Members
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {dependents.length} dependent
                    {dependents.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddDependentModal(true);
                    setCurrentDependentStep(1);
                  }}
                  className="bg-blue-500 rounded-xl px-4 py-3 flex-row items-center shadow-lg"
                  style={{ elevation: 4 }}
                >
                  <Ionicons name="add-circle" size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">Add</Text>
                </TouchableOpacity>
              </View>

              {dependents.length === 0 ? (
                <View className="bg-blue-50 rounded-2xl p-8 items-center border border-blue-100">
                  <View className="bg-blue-100 rounded-full p-4 mb-3">
                    <Ionicons name="people" size={48} color="#3b82f6" />
                  </View>
                  <Text className="text-gray-800 font-semibold text-center">
                    No dependents added yet
                  </Text>
                  <Text className="text-gray-600 text-sm text-center mt-2 mb-4">
                    Add family members to manage their vaccination records
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddDependentModal(true);
                      setCurrentDependentStep(1);
                    }}
                    className="bg-blue-500 rounded-xl px-6 py-3"
                  >
                    <Text className="text-white font-semibold">
                      Add First Dependent
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="space-y-3">
                  {dependents.map((dependent) => (
                    <DependentCard
                      key={dependent._id}
                      dependent={dependent}
                      onPress={handleDependentPress}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Account Settings */}
          <View className="px-4 pb-8">
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <Text className="text-lg font-bold text-gray-800 mb-4">
                Account Settings
              </Text>

              <View className="space-y-2">
                <TouchableOpacity className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-purple-100 rounded-lg p-2 mr-3">
                      <Ionicons
                        name="shield-checkmark"
                        size={20}
                        color="#8b5cf6"
                      />
                    </View>
                    <Text className="text-gray-800 font-semibold">
                      Privacy & Security
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                {/* Change Password Button */}
                <TouchableOpacity
                  onPress={() => setShowChangePasswordModal(true)}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="bg-green-100 rounded-lg p-2 mr-3">
                      <Ionicons name="key" size={20} color="#10b981" />
                    </View>
                    <Text className="text-gray-800 font-semibold">
                      Change Password
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex-row items-center justify-between"
                  onPress={() => setShowNotificationSettings(true)}
                >
                  <View className="flex-row items-center flex-1">
                    <View className="bg-orange-100 rounded-lg p-2 mr-3">
                      <Ionicons
                        name="notifications"
                        size={20}
                        color="#f59e0b"
                      />
                    </View>
                    <Text className="text-gray-800 font-semibold">
                      Notification Settings
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-3 flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-blue-100 rounded-lg p-2 mr-3">
                      <Ionicons name="help-circle" size={20} color="#3b82f6" />
                    </View>
                    <Text className="text-gray-800 font-semibold">
                      Help & Support
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleLogout}
                  className="bg-red-50 rounded-xl p-4 border-2 border-red-200 flex-row items-center justify-between mt-2"
                >
                  <View className="flex-row items-center flex-1">
                    <View className="bg-red-100 rounded-lg p-2 mr-3">
                      <Ionicons name="log-out" size={20} color="#ef4444" />
                    </View>
                    <Text className="text-red-600 font-bold">Sign Out</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Dependent Modal */}
      <Modal
        visible={showAddDependentModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddDependentModal(false);
          setCurrentDependentStep(1);
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-end">
              <View
                className="bg-white rounded-t-3xl overflow-hidden"
                style={{ maxHeight: "90%" }}
              >
                {/* Gradient Header with Step Indicator */}
                <View className="px-6 pt-8 pb-6 bg-blue-500 rounded-t-3xl">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                      <Text className="text-2xl font-bold text-white mb-2">
                        Add Family Member
                      </Text>
                      <Text className="text-blue-100 text-sm">
                        Add a new dependent to your profile
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setShowAddDependentModal(false);
                        setCurrentDependentStep(1);
                      }}
                      className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-lg items-center justify-center"
                      style={{ marginLeft: 12 }}
                    >
                      <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                  </View>

                  {/* Step Indicator */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 12,
                    }}
                  >
                    {[1, 2].map((step) => (
                      <View
                        key={step}
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <View
                          style={{
                            width: step === currentDependentStep ? 36 : 28,
                            height: step === currentDependentStep ? 36 : 28,
                            borderRadius:
                              step === currentDependentStep ? 18 : 14,
                            backgroundColor:
                              step <= currentDependentStep
                                ? "white"
                                : "rgba(255,255,255,0.3)",
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: step === currentDependentStep ? 3 : 0,
                            borderColor: "rgba(255,255,255,0.5)",
                          }}
                        >
                          {step < currentDependentStep ? (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="#10b981"
                            />
                          ) : (
                            <Text
                              style={{
                                fontSize:
                                  step === currentDependentStep ? 16 : 14,
                                fontWeight: "700",
                                color:
                                  step <= currentDependentStep
                                    ? "#3b82f6"
                                    : "rgba(255,255,255,0.7)",
                              }}
                            >
                              {step}
                            </Text>
                          )}
                        </View>
                        {step < 2 && (
                          <View
                            style={{
                              width: 40,
                              height: 2,
                              backgroundColor:
                                step < currentDependentStep
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

                <ScrollView
                  className="px-5 py-4 bg-gray-50"
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {/* Step 1: Personal Details */}
                  {currentDependentStep === 1 && (
                    <View>
                      <View className="mb-4">
                        <View className="flex-row items-center mb-3">
                          <View className="w-9 h-9 rounded-xl bg-blue-100 items-center justify-center mr-2">
                            <Ionicons name="person" size={18} color="#3b82f6" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-base font-bold text-gray-800">
                              Personal Details
                            </Text>
                            <Text className="text-xs text-gray-500">
                              Step 1 of 2
                            </Text>
                          </View>
                        </View>

                        {/* First Name */}
                        <View className="mb-3">
                          <Text className="text-xs font-semibold text-gray-600 mb-1.5 ml-1">
                            FIRST NAME *
                          </Text>
                          <View className="flex-row items-center bg-white rounded-xl p-3 border-2 border-blue-100 shadow-sm">
                            <View className="w-8 h-8 rounded-lg bg-blue-100 items-center justify-center mr-2.5">
                              <Ionicons
                                name="person"
                                size={16}
                                color="#3b82f6"
                              />
                            </View>
                            <TextInput
                              className="flex-1 text-gray-800 font-medium text-sm"
                              placeholder="Enter first name"
                              value={dependentForm.firstName}
                              onChangeText={(text) =>
                                setDependentForm({
                                  ...dependentForm,
                                  firstName: text,
                                })
                              }
                              placeholderTextColor="#9ca3af"
                              returnKeyType="next"
                              blurOnSubmit={false}
                            />
                          </View>
                        </View>

                        {/* Last Name */}
                        <View className="mb-3">
                          <Text className="text-xs font-semibold text-gray-600 mb-1.5 ml-1">
                            LAST NAME *
                          </Text>
                          <View className="flex-row items-center bg-white rounded-xl p-3 border-2 border-blue-100 shadow-sm">
                            <View className="w-8 h-8 rounded-lg bg-blue-100 items-center justify-center mr-2.5">
                              <Ionicons
                                name="person-outline"
                                size={16}
                                color="#3b82f6"
                              />
                            </View>
                            <TextInput
                              className="flex-1 text-gray-800 font-medium text-sm"
                              placeholder="Enter last name"
                              value={dependentForm.lastName}
                              onChangeText={(text) =>
                                setDependentForm({
                                  ...dependentForm,
                                  lastName: text,
                                })
                              }
                              placeholderTextColor="#9ca3af"
                              returnKeyType="next"
                              blurOnSubmit={false}
                            />
                          </View>
                        </View>

                        {/* Date of Birth */}
                        <View className="mb-3">
                          <Text className="text-xs font-semibold text-gray-600 mb-1.5 ml-1">
                            DATE OF BIRTH *
                          </Text>
                          <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            className="bg-white rounded-xl p-3 flex-row items-center justify-between border-2 border-blue-100 shadow-sm"
                          >
                            <View className="flex-row items-center flex-1">
                              <View className="w-8 h-8 rounded-lg bg-purple-100 items-center justify-center mr-2.5">
                                <Ionicons
                                  name="calendar"
                                  size={16}
                                  color="#8b5cf6"
                                />
                              </View>
                              <Text
                                className={`font-medium text-sm ${dependentForm.dateOfBirth ? "text-gray-800" : "text-gray-400"}`}
                              >
                                {dependentForm.dateOfBirth
                                  ? new Date(
                                      dependentForm.dateOfBirth
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "Tap to select date"}
                              </Text>
                            </View>
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
                              <View className="flex-1 bg-black/50 justify-end">
                                <View className="bg-white rounded-t-3xl p-4">
                                  <View className="flex-row justify-between items-center mb-4">
                                    <TouchableOpacity
                                      onPress={() => setShowDatePicker(false)}
                                    >
                                      <Text className="text-blue-500 text-lg">
                                        Cancel
                                      </Text>
                                    </TouchableOpacity>
                                    <Text className="text-lg font-semibold text-gray-800">
                                      Select Date
                                    </Text>
                                    <TouchableOpacity
                                      onPress={() => setShowDatePicker(false)}
                                    >
                                      <Text className="text-blue-500 text-lg font-semibold">
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
                                        setDependentForm({
                                          ...dependentForm,
                                          dateOfBirth: date
                                            .toISOString()
                                            .split("T")[0],
                                        });
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
                                  setDependentForm({
                                    ...dependentForm,
                                    dateOfBirth: date
                                      .toISOString()
                                      .split("T")[0],
                                  });
                                }
                              }}
                              maximumDate={new Date()}
                            />
                          )}
                        </View>

                        {/* Gender */}
                        <View>
                          <Text className="text-xs font-semibold text-gray-600 mb-1.5 ml-1">
                            GENDER *
                          </Text>
                          <View className="flex-row justify-between">
                            {genderOptions.map((option) => {
                              const isSelected =
                                dependentForm.gender === option;
                              const iconMap: any = {
                                Male: "male",
                                Female: "female",
                                Other: "transgender",
                              };
                              return (
                                <TouchableOpacity
                                  key={option}
                                  onPress={() =>
                                    setDependentForm({
                                      ...dependentForm,
                                      gender: option,
                                    })
                                  }
                                  className="flex-1 mx-0.5"
                                >
                                  {isSelected ? (
                                    <LinearGradient
                                      colors={["#3b82f6", "#2563eb"]}
                                      start={{ x: 0, y: 0 }}
                                      end={{ x: 0, y: 1 }}
                                      style={{
                                        padding: 10,
                                        borderRadius: 12,
                                        borderWidth: 2,
                                        borderColor: "#3b82f6",
                                      }}
                                    >
                                      <View className="items-center">
                                        <Ionicons
                                          name={iconMap[option]}
                                          size={20}
                                          color="white"
                                        />
                                        <Text className="text-center font-semibold mt-1 text-white text-xs">
                                          {option}
                                        </Text>
                                      </View>
                                    </LinearGradient>
                                  ) : (
                                    <View className="p-2.5 rounded-xl border-2 border-gray-200 bg-white shadow-sm">
                                      <View className="items-center">
                                        <Ionicons
                                          name={iconMap[option]}
                                          size={20}
                                          color="#6b7280"
                                        />
                                        <Text className="text-center font-semibold mt-1 text-gray-700 text-xs">
                                          {option}
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
                    </View>
                  )}

                  {/* Step 2: Relationship & Review */}
                  {currentDependentStep === 2 && (
                    <View>
                      <View className="mb-6">
                        <View className="flex-row items-center mb-4">
                          <View className="w-10 h-10 rounded-xl bg-green-100 items-center justify-center mr-3">
                            <Ionicons name="people" size={20} color="#10b981" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-lg font-bold text-gray-800">
                              Relationship
                            </Text>
                            <Text className="text-xs text-gray-500">
                              Step 2 of 2
                            </Text>
                          </View>
                        </View>

                        <View>
                          <Text className="text-xs font-semibold text-gray-600 mb-2 ml-1">
                            RELATIONSHIP *
                          </Text>
                          <TouchableOpacity
                            onPress={() =>
                              setShowRelationshipDropdown(
                                !showRelationshipDropdown
                              )
                            }
                            className="bg-white rounded-xl p-4 border-2 border-blue-100 shadow-sm flex-row justify-between items-center"
                          >
                            <View className="flex-row items-center flex-1">
                              <View className="w-10 h-10 rounded-lg bg-green-100 items-center justify-center mr-3">
                                <Ionicons
                                  name="people"
                                  size={20}
                                  color="#10b981"
                                />
                              </View>
                              <Text
                                className={`font-medium text-base ${
                                  dependentForm.dependentType
                                    ? "text-gray-800"
                                    : "text-gray-400"
                                }`}
                              >
                                {dependentForm.dependentType ||
                                  "Select relationship"}
                              </Text>
                            </View>
                            <Ionicons
                              name={
                                showRelationshipDropdown
                                  ? "chevron-up"
                                  : "chevron-down"
                              }
                              size={20}
                              color="#3b82f6"
                            />
                          </TouchableOpacity>

                          {showRelationshipDropdown && (
                            <View className="bg-white border-2 border-blue-200 rounded-xl mt-2 shadow-lg overflow-hidden">
                              {dependentTypeOptions.map((option, index) => (
                                <TouchableOpacity
                                  key={option}
                                  onPress={() => {
                                    setDependentForm({
                                      ...dependentForm,
                                      dependentType: option,
                                    });
                                    setShowRelationshipDropdown(false);
                                  }}
                                  className={`px-4 py-3 flex-row items-center ${
                                    index < dependentTypeOptions.length - 1
                                      ? "border-b border-gray-100"
                                      : ""
                                  } ${
                                    dependentForm.dependentType === option
                                      ? "bg-blue-50"
                                      : "bg-white"
                                  }`}
                                >
                                  {dependentForm.dependentType === option && (
                                    <Ionicons
                                      name="checkmark-circle"
                                      size={20}
                                      color="#3b82f6"
                                      className="mr-2"
                                    />
                                  )}
                                  <Text
                                    className={`font-medium ${
                                      dependentForm.dependentType === option
                                        ? "text-blue-600"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {option}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>

                        {/* Summary Preview */}
                        <View className="mb-6">
                          <View className="flex-row items-center mb-3">
                            <View className="w-10 h-10 rounded-xl bg-purple-100 items-center justify-center mr-3">
                              <Ionicons name="eye" size={20} color="#8b5cf6" />
                            </View>
                            <Text className="text-lg font-bold text-gray-800">
                              Review Details
                            </Text>
                          </View>
                          <View className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                            <View className="space-y-2">
                              <View className="flex-row items-center">
                                <Ionicons
                                  name="person"
                                  size={16}
                                  color="#3b82f6"
                                />
                                <Text className="text-sm text-blue-700 ml-2">
                                  <Text className="font-bold">Name:</Text>{" "}
                                  {dependentForm.firstName}{" "}
                                  {dependentForm.lastName}
                                </Text>
                              </View>
                              <View className="flex-row items-center">
                                <Ionicons
                                  name="calendar"
                                  size={16}
                                  color="#3b82f6"
                                />
                                <Text className="text-sm text-blue-700 ml-2">
                                  <Text className="font-bold">DOB:</Text>{" "}
                                  {dependentForm.dateOfBirth
                                    ? new Date(
                                        dependentForm.dateOfBirth
                                      ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })
                                    : "Not selected"}
                                </Text>
                              </View>
                              <View className="flex-row items-center">
                                <Ionicons
                                  name={
                                    dependentForm.gender === "Male"
                                      ? "male"
                                      : dependentForm.gender === "Female"
                                        ? "female"
                                        : "transgender"
                                  }
                                  size={16}
                                  color="#3b82f6"
                                />
                                <Text className="text-sm text-blue-700 ml-2">
                                  <Text className="font-bold">Gender:</Text>{" "}
                                  {dependentForm.gender || "Not selected"}
                                </Text>
                              </View>
                              <View className="flex-row items-center">
                                <Ionicons
                                  name="people"
                                  size={16}
                                  color="#3b82f6"
                                />
                                <Text className="text-sm text-blue-700 ml-2">
                                  <Text className="font-bold">
                                    Relationship:
                                  </Text>{" "}
                                  {dependentForm.dependentType ||
                                    "Not selected"}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Navigation Buttons */}
                  <View className="mt-6">
                    {/* Main Action Button */}
                    <TouchableOpacity
                      onPress={handleDependentNext}
                      disabled={loading}
                      className={`rounded-2xl py-5 items-center shadow-xl mb-3 ${
                        loading
                          ? "bg-gray-300"
                          : currentDependentStep === 2
                            ? "bg-green-500"
                            : "bg-blue-500"
                      }`}
                      style={{
                        shadowColor:
                          currentDependentStep === 2 ? "#10b981" : "#3b82f6",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                      }}
                    >
                      {loading ? (
                        <View className="flex-row items-center">
                          <ActivityIndicator size="small" color="white" />
                          <Text className="text-white font-bold text-lg ml-2">
                            Adding Member...
                          </Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center">
                          <Ionicons
                            name={
                              currentDependentStep === 2
                                ? "checkmark-circle"
                                : "arrow-forward"
                            }
                            size={24}
                            color="white"
                          />
                          <Text className="text-white font-bold text-lg ml-2">
                            {currentDependentStep === 2
                              ? "Add Family Member"
                              : "Next Step"}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Back/Cancel Button */}
                    <TouchableOpacity
                      onPress={handleDependentBack}
                      className="bg-white rounded-2xl py-4 items-center border-2 border-gray-200"
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name={
                            currentDependentStep === 1
                              ? "close-circle-outline"
                              : "arrow-back"
                          }
                          size={22}
                          color="#6b7280"
                        />
                        <Text className="text-gray-700 font-semibold text-base ml-2">
                          {currentDependentStep === 1
                            ? "Cancel"
                            : "Previous Step"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* Dependent Details Modal */}
      <DependentModal
        visible={showDependentModal}
        dependent={selectedDependent}
        onClose={handleModalClose}
        onDependentDeleted={handleDependentDeleted}
      />

      {/* Quick Edit Modal */}
      {showQuickEditModal && (
        <Modal
          visible={showQuickEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQuickEditModal(false)}
        >
          <TouchableWithoutFeedback
            onPress={() => setShowQuickEditModal(false)}
          >
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
              <TouchableWithoutFeedback>
                <View
                  className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                  style={{ elevation: 10 }}
                >
                  {/* Header */}
                  <LinearGradient
                    colors={["#1e40af", "#3b82f6", "#60a5fa"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="px-6 py-6"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center mr-3">
                          <Ionicons name="create" size={24} color="white" />
                        </View>
                        <View>
                          <Text className="text-xl font-bold text-white">
                            Quick Edit
                          </Text>
                          <Text className="text-blue-100 text-xs mt-1">
                            Update{" "}
                            {editingField === "name"
                              ? "Full Name"
                              : editingField === "email"
                                ? "Email"
                                : editingField === "phone"
                                  ? "Phone"
                                  : editingField === "dateOfBirth"
                                    ? "Birthday"
                                    : editingField === "gender"
                                      ? "Gender"
                                      : "Blood Type"}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => setShowQuickEditModal(false)}
                        className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
                      >
                        <Ionicons name="close" size={24} color="white" />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>

                  {/* Content */}
                  <ScrollView
                    className="p-6"
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* Full Name Edit */}
                    {editingField === "name" && (
                      <View className="space-y-3">
                        <View>
                          <Text className="text-xs font-semibold text-gray-600 mb-2">
                            FIRST NAME *
                          </Text>
                          <TextInput
                            className="bg-gray-50 rounded-xl p-4 text-gray-800 font-medium border-2 border-gray-200"
                            placeholder="Enter first name"
                            value={quickEditValue.firstName}
                            onChangeText={(text) =>
                              setQuickEditValue({
                                ...quickEditValue,
                                firstName: text,
                              })
                            }
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                        <View>
                          <Text className="text-xs font-semibold text-gray-600 mb-2">
                            LAST NAME *
                          </Text>
                          <TextInput
                            className="bg-gray-50 rounded-xl p-4 text-gray-800 font-medium border-2 border-gray-200"
                            placeholder="Enter last name"
                            value={quickEditValue.lastName}
                            onChangeText={(text) =>
                              setQuickEditValue({
                                ...quickEditValue,
                                lastName: text,
                              })
                            }
                            placeholderTextColor="#9ca3af"
                          />
                        </View>
                      </View>
                    )}

                    {/* Email Edit */}
                    {editingField === "email" && (
                      <View>
                        <Text className="text-xs font-semibold text-gray-600 mb-2">
                          EMAIL ADDRESS *
                        </Text>
                        <View className="flex-row items-center bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                          <Ionicons name="mail" size={20} color="#3b82f6" />
                          <TextInput
                            className="flex-1 ml-3 text-gray-800 font-medium"
                            placeholder="Enter email"
                            value={quickEditValue.email}
                            onChangeText={(text) =>
                              setQuickEditValue({
                                ...quickEditValue,
                                email: text,
                              })
                            }
                            placeholderTextColor="#9ca3af"
                            keyboardType="email-address"
                            autoCapitalize="none"
                          />
                        </View>
                      </View>
                    )}

                    {/* Phone Edit */}
                    {editingField === "phone" && (
                      <View>
                        <Text className="text-xs font-semibold text-gray-600 mb-2">
                          PHONE NUMBER *
                        </Text>
                        <View className="flex-row items-center bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                          <Ionicons name="call" size={20} color="#10b981" />
                          <TextInput
                            className="flex-1 ml-3 text-gray-800 font-medium"
                            placeholder="Enter phone number"
                            value={quickEditValue.phone}
                            onChangeText={(text) =>
                              setQuickEditValue({
                                ...quickEditValue,
                                phone: text,
                              })
                            }
                            placeholderTextColor="#9ca3af"
                            keyboardType="phone-pad"
                          />
                        </View>
                      </View>
                    )}

                    {/* Date of Birth Edit */}
                    {editingField === "dateOfBirth" && (
                      <View>
                        <Text className="text-xs font-semibold text-gray-600 mb-2">
                          DATE OF BIRTH *
                        </Text>
                        <TouchableOpacity
                          onPress={() => setShowQuickEditDatePicker(true)}
                          className="bg-gray-50 rounded-xl p-4 flex-row items-center justify-between border-2 border-gray-200"
                        >
                          <View className="flex-row items-center flex-1">
                            <Ionicons
                              name="calendar"
                              size={20}
                              color="#8b5cf6"
                            />
                            <Text className="ml-3 text-gray-800 font-medium">
                              {quickEditValue.dateOfBirth
                                ? new Date(
                                    quickEditValue.dateOfBirth
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "Tap to select date"}
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color="#3b82f6"
                          />
                        </TouchableOpacity>

                        {/* Native Date Picker */}
                        {showQuickEditDatePicker && Platform.OS === "ios" && (
                          <Modal
                            transparent
                            animationType="slide"
                            visible={showQuickEditDatePicker}
                            onRequestClose={() =>
                              setShowQuickEditDatePicker(false)
                            }
                          >
                            <View className="flex-1 bg-black/50 justify-end">
                              <View className="bg-white rounded-t-3xl p-4">
                                <View className="flex-row justify-between items-center mb-4">
                                  <TouchableOpacity
                                    onPress={() =>
                                      setShowQuickEditDatePicker(false)
                                    }
                                  >
                                    <Text className="text-blue-500 text-lg">
                                      Cancel
                                    </Text>
                                  </TouchableOpacity>
                                  <Text className="text-lg font-semibold text-gray-800">
                                    Select Date
                                  </Text>
                                  <TouchableOpacity
                                    onPress={() =>
                                      setShowQuickEditDatePicker(false)
                                    }
                                  >
                                    <Text className="text-blue-500 text-lg font-semibold">
                                      Done
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                                <DateTimePicker
                                  value={quickEditDate}
                                  mode="date"
                                  display="spinner"
                                  onChange={(_event: any, date?: Date) => {
                                    if (date) {
                                      setQuickEditDate(date);
                                      setQuickEditValue({
                                        ...quickEditValue,
                                        dateOfBirth: date
                                          .toISOString()
                                          .split("T")[0],
                                      });
                                    }
                                  }}
                                  maximumDate={new Date()}
                                />
                              </View>
                            </View>
                          </Modal>
                        )}
                        {showQuickEditDatePicker &&
                          Platform.OS === "android" && (
                            <DateTimePicker
                              value={quickEditDate}
                              mode="date"
                              display="default"
                              onChange={(_event: any, date?: Date) => {
                                setShowQuickEditDatePicker(false);
                                if (date) {
                                  setQuickEditDate(date);
                                  setQuickEditValue({
                                    ...quickEditValue,
                                    dateOfBirth: date
                                      .toISOString()
                                      .split("T")[0],
                                  });
                                }
                              }}
                              maximumDate={new Date()}
                            />
                          )}
                      </View>
                    )}

                    {/* Gender Edit */}
                    {editingField === "gender" && (
                      <View>
                        <Text className="text-xs font-semibold text-gray-600 mb-2">
                          GENDER *
                        </Text>
                        <View className="flex-row justify-between">
                          {genderOptions.map((option) => {
                            const isSelected = quickEditValue.gender === option;
                            const iconMap: any = {
                              Male: "male",
                              Female: "female",
                              Other: "transgender",
                            };
                            return (
                              <TouchableOpacity
                                key={option}
                                onPress={() =>
                                  setQuickEditValue({
                                    ...quickEditValue,
                                    gender: option,
                                  })
                                }
                                className="flex-1 mx-0.5"
                              >
                                {isSelected ? (
                                  <LinearGradient
                                    colors={["#3b82f6", "#2563eb"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={{
                                      padding: 12,
                                      borderRadius: 12,
                                      borderWidth: 2,
                                      borderColor: "#3b82f6",
                                    }}
                                  >
                                    <View className="items-center">
                                      <Ionicons
                                        name={iconMap[option]}
                                        size={22}
                                        color="white"
                                      />
                                      <Text className="text-center font-semibold mt-1.5 text-white text-xs">
                                        {option}
                                      </Text>
                                    </View>
                                  </LinearGradient>
                                ) : (
                                  <View className="p-3 rounded-xl border-2 border-gray-200 bg-white">
                                    <View className="items-center">
                                      <Ionicons
                                        name={iconMap[option]}
                                        size={22}
                                        color="#6b7280"
                                      />
                                      <Text className="text-center font-semibold mt-1.5 text-gray-700 text-xs">
                                        {option}
                                      </Text>
                                    </View>
                                  </View>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    {/* Blood Type Edit */}
                    {editingField === "bloodType" && (
                      <View>
                        <Text className="text-xs font-semibold text-gray-600 mb-2">
                          BLOOD TYPE *
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                        >
                          <View className="flex-row">
                            {[
                              "A+",
                              "A-",
                              "B+",
                              "B-",
                              "AB+",
                              "AB-",
                              "O+",
                              "O-",
                            ].map((type) => {
                              const isSelected =
                                quickEditValue.bloodType === type;
                              return (
                                <TouchableOpacity
                                  key={type}
                                  onPress={() =>
                                    setQuickEditValue({
                                      ...quickEditValue,
                                      bloodType: type,
                                    })
                                  }
                                  className="mr-2"
                                >
                                  {isSelected ? (
                                    <LinearGradient
                                      colors={["#ef4444", "#dc2626"]}
                                      start={{ x: 0, y: 0 }}
                                      end={{ x: 0, y: 1 }}
                                      style={{
                                        paddingHorizontal: 20,
                                        paddingVertical: 12,
                                        borderRadius: 12,
                                        borderWidth: 2,
                                        borderColor: "#ef4444",
                                      }}
                                    >
                                      <View className="items-center">
                                        <Ionicons
                                          name="water"
                                          size={20}
                                          color="white"
                                        />
                                        <Text className="text-white font-bold text-sm mt-1">
                                          {type}
                                        </Text>
                                      </View>
                                    </LinearGradient>
                                  ) : (
                                    <View className="px-5 py-3 rounded-xl border-2 border-gray-200 bg-white">
                                      <View className="items-center">
                                        <Ionicons
                                          name="water"
                                          size={20}
                                          color="#6b7280"
                                        />
                                        <Text className="text-gray-700 font-semibold text-sm mt-1">
                                          {type}
                                        </Text>
                                      </View>
                                    </View>
                                  )}
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </ScrollView>
                        <Text className="text-xs text-gray-500 mt-2">
                          Swipe to see all blood types • Tap to select
                        </Text>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View className="mt-6">
                      <TouchableOpacity
                        onPress={handleQuickEditSubmit}
                        disabled={loading}
                        className={`rounded-xl py-4 items-center shadow-lg mb-3 ${
                          loading ? "bg-gray-300" : "bg-blue-500"
                        }`}
                        style={{ elevation: 4 }}
                      >
                        {loading ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <View className="flex-row items-center">
                            <Ionicons
                              name="checkmark-circle"
                              size={22}
                              color="white"
                            />
                            <Text className="text-white font-bold text-base ml-2">
                              Save Changes
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setShowQuickEditModal(false)}
                        className="bg-gray-100 rounded-xl py-3 items-center"
                      >
                        <Text className="text-gray-700 font-semibold">
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Custom Alert */}
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        buttons={customAlert.buttons}
        icon={customAlert.icon}
        onClose={() => setCustomAlert((prev) => ({ ...prev, visible: false }))}
      />
      {/* Notification Settings Modal */}
      <NotificationSettings
        visible={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />

      {/* Change Password Modal */}
      <ChangePassword
        visible={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </SafeAreaView>
  );
}
