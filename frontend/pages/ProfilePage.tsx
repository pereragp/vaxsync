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
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from 'expo-router';
import userAPI, { User, Dependent } from "../api/userApi";
import { router } from "expo-router";
import UpdateProfile from "@/components/UpdateProfile";
import DependentCard from "@/components/DependentCard";
import DependentModal from "@/components/DependentModal";
import CustomAlert from "../components/CustomAlert";

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

  const genderOptions = ["Male", "Female", "Other"];
  const dependentTypeOptions = [
    "Child",
    "Spouse",
    "Parent",
    "Sibling",
    "Other",
  ];

  // Modal states
  const [showUpdateProfile, setShowUpdateProfile] = useState(false);
  const [showAddDependentModal, setShowAddDependentModal] = useState(false);
  const [showRelationshipDropdown, setShowRelationshipDropdown] =
    useState(false);

  // Add dependent form states
  const [dependentForm, setDependentForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
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
    icon: 'success' | 'error' | 'warning' | 'info' | 'question';
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    icon: 'info'
  });

  // Helper function to show custom alert
  const showAlert = (
    title: string,
    message: string,
    buttons: any[] = [{ text: 'OK' }],
    icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'info'
  ) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      buttons,
      icon
    });
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
          "Cannot connect to backend server. Please ensure the backend is running on http://192.168.1.32:5000"
        );
      } else {
        setError(error.message || "Failed to load user data");
      }
    } finally {
      setLoading(false);
    }
  };

  //Edit profile
  const handleEditProfile = () => {
    setShowUpdateProfile(true);
  };

  //Function to handle successful update
  const handleUpdateSuccess = (updatedUser: User) => {
    setUser(updatedUser);
    setShowUpdateProfile(false);
  };

  const handleLogout = async () => {
    showAlert(
      "Confirm Logout",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
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
                'success'
              );
            } catch (error) {
              console.error("Logout Failed: ", error);
              showAlert("Logout Failed", "Please try again...", [{ text: "OK" }], 'error');
            }
          },
        },
      ],
      'question'
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

  const handleAddDependent = async () => {
    try {
      setLoading(true);

      //Validation
      if (
        !dependentForm.firstName.trim() ||
        !dependentForm.lastName.trim() ||
        !dependentForm.dateOfBirth.trim() ||
        !dependentForm.gender.trim() ||
        !dependentForm.dependentType.trim()
      ) {
        showAlert("Error", "Please fill in all required fields", [{ text: "OK" }], 'warning');
        return;
      }

      //Ensure user exists
      if (!user?._id) {
        showAlert("Error", "User information not available", [{ text: "OK" }], 'error');
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
      setDependentForm({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        dependentType: "",
      });

      showAlert("Success", "Dependent added successfully.", [{ text: "OK" }], 'success');
      await refreshDependents();
    } catch (error: any) {
      console.error("Error adding dependent: ", error);
      showAlert("Error", error.message || "Failed to add dependent", [{ text: "OK" }], 'error');
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
    <SafeAreaView className="flex-1" edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />

      <ScrollView 
        className="flex-1 bg-gray-50" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Blue Gradient Header */}
        <LinearGradient
          colors={['#1e40af', '#3b82f6', '#60a5fa']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 pt-4 pb-6"
        >
          {/* Small Title Bar */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-semibold">Account</Text>
            <TouchableOpacity
              onPress={handleEditProfile}
              className="bg-white rounded-xl px-5 py-2.5 flex-row items-center shadow-lg"
              style={{
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
              }}
            >
              <Ionicons name="create" size={18} color="#1e40af" />
              <Text className="text-blue-600 font-bold ml-2 text-base">Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Large Profile Card */}
          <View className="bg-white rounded-3xl p-6 shadow-2xl" style={{ elevation: 8 }}>
            <View className="items-center mb-5">
              {/* Larger Avatar */}
              <View className="relative mb-3">
                <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center shadow-lg" style={{ elevation: 4 }}>
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
              <Text className="text-blue-600 text-base font-medium">@{user?.username}</Text>
              <View className="bg-blue-50 rounded-full px-4 py-2 mt-2">
                <Text className="text-blue-700 text-sm font-semibold">
                  {user && calculateAge(user.dateOfBirth)} years old • {user?.gender}
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
                <Text className="text-xs text-gray-600 font-medium">Family Members</Text>
              </View>

              <View className="w-px bg-gray-300" />

              <View className="items-center">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="shield-checkmark" size={18} color="#10b981" />
                </View>
                <Text className="text-2xl font-bold text-green-600">
                  {dependents.length + 1}
                </Text>
                <Text className="text-xs text-gray-600 font-medium">Health Records</Text>
              </View>

              <View className="w-px bg-gray-300" />

              <View className="items-center">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="time" size={18} color="#f59e0b" />
                </View>
                <Text className="text-2xl font-bold text-orange-600">
                  {(() => {
                    const joined = new Date(user?.createdAt || new Date());
                    const months = Math.floor((new Date().getTime() - joined.getTime()) / (1000 * 60 * 60 * 24 * 30));
                    return months > 0 ? months : 1;
                  })()}mo
                </Text>
                <Text className="text-xs text-gray-600 font-medium">Member Since</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Content Container */}
        <View className="flex-1 bg-gray-50 -mt-3">

        {/* Personal Information */}
        <View className="pt-6 px-4">
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
            <Text className="text-lg font-bold text-gray-800 mb-4">
              Personal Information
            </Text>

            <View className="space-y-3">
              <View className="flex-row items-center bg-gray-50 rounded-xl p-4 border border-gray-200">
                <View className="bg-blue-100 rounded-lg p-2 mr-3">
                  <Ionicons name="mail" size={20} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Email</Text>
                  <Text className="text-gray-800 font-semibold">{user?.email}</Text>
                </View>
              </View>

              <View className="flex-row items-center bg-gray-50 rounded-xl p-4 border border-gray-200">
                <View className="bg-green-100 rounded-lg p-2 mr-3">
                  <Ionicons name="call" size={20} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Phone</Text>
                  <Text className="text-gray-800 font-semibold">{user?.phone}</Text>
                </View>
              </View>

              <View className="flex-row items-center bg-gray-50 rounded-xl p-4 border border-gray-200">
                <View className="bg-purple-100 rounded-lg p-2 mr-3">
                  <Ionicons name="calendar" size={20} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Date of Birth</Text>
                  <Text className="text-gray-800 font-semibold">
                    {user && formatDate(user.dateOfBirth)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center bg-gray-50 rounded-xl p-4 border border-gray-200">
                <View className="bg-orange-100 rounded-lg p-2 mr-3">
                  <Ionicons name="person" size={20} color="#f59e0b" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Gender</Text>
                  <Text className="text-gray-800 font-semibold">{user?.gender}</Text>
                </View>
              </View>

              <View className="flex-row items-center bg-gray-50 rounded-xl p-4 border border-gray-200">
                <View className="bg-red-100 rounded-lg p-2 mr-3">
                  <Ionicons name="water" size={20} color="#ef4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Blood Type</Text>
                  <Text className="text-gray-800 font-semibold">{user?.bloodType || 'Not specified'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Dependents Section */}
        <View className="px-4 pb-6">
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-lg font-bold text-gray-800">Family Members</Text>
                <Text className="text-sm text-gray-500">{dependents.length} dependent{dependents.length !== 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddDependentModal(true)}
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
                  onPress={() => setShowAddDependentModal(true)}
                  className="bg-blue-500 rounded-xl px-6 py-3"
                >
                  <Text className="text-white font-semibold">Add First Dependent</Text>
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
                    <Ionicons name="shield-checkmark" size={20} color="#8b5cf6" />
                  </View>
                  <Text className="text-gray-800 font-semibold">
                    Privacy & Security
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-orange-100 rounded-lg p-2 mr-3">
                    <Ionicons name="notifications" size={20} color="#f59e0b" />
                  </View>
                  <Text className="text-gray-800 font-semibold">
                    Notifications
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

      {/* Update profile component */}
      {user && (
        <UpdateProfile
          user={user}
          visible={showUpdateProfile}
          onClose={() => setShowUpdateProfile(false)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}

      {/* Add Dependent Modal */}
      <Modal
        visible={showAddDependentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddDependentModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-white rounded-t-3xl max-h-4/5 overflow-hidden">
                {/* Gradient Header */}
                <LinearGradient
                  colors={['#1e40af', '#3b82f6', '#60a5fa']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="px-6 py-8"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-3">
                        <View className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-lg items-center justify-center mr-4 shadow-lg">
                          <Ionicons name="person-add" size={28} color="white" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-2xl font-bold text-white">
                            Add Family Member
                          </Text>
                          <Text className="text-blue-100 text-sm mt-1">
                            Add a new dependent to your profile
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowAddDependentModal(false)}
                      className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-lg items-center justify-center shadow-lg"
                    >
                      <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>

                <ScrollView
                  className="p-6 bg-gray-50"
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  <View className="space-y-6">
                    {/* Personal Information Section */}
                    <View>
                      <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center mr-3">
                          <Ionicons name="person" size={20} color="#3b82f6" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-gray-800">
                            Personal Details
                          </Text>
                          <Text className="text-xs text-gray-500">
                            Basic information about the dependent
                          </Text>
                        </View>
                      </View>

                      {/* First Name */}
                      <View className="mb-4">
                        <Text className="text-xs font-semibold text-gray-600 mb-2 ml-1">
                          FIRST NAME *
                        </Text>
                        <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-blue-100 shadow-sm">
                          <View className="w-10 h-10 rounded-lg bg-blue-100 items-center justify-center mr-3">
                            <Ionicons name="person" size={20} color="#3b82f6" />
                          </View>
                          <TextInput
                            className="flex-1 text-gray-800 font-medium text-base"
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
                      <View className="mb-4">
                        <Text className="text-xs font-semibold text-gray-600 mb-2 ml-1">
                          LAST NAME *
                        </Text>
                        <View className="flex-row items-center bg-white rounded-xl p-4 border-2 border-blue-100 shadow-sm">
                          <View className="w-10 h-10 rounded-lg bg-blue-100 items-center justify-center mr-3">
                            <Ionicons name="person-outline" size={20} color="#3b82f6" />
                          </View>
                          <TextInput
                            className="flex-1 text-gray-800 font-medium text-base"
                            placeholder="Enter last name"
                            value={dependentForm.lastName}
                            onChangeText={(text) =>
                              setDependentForm({ ...dependentForm, lastName: text })
                            }
                            placeholderTextColor="#9ca3af"
                            returnKeyType="next"
                            blurOnSubmit={false}
                          />
                        </View>
                      </View>

                      {/* Date of Birth */}
                      <View className="mb-4">
                        <Text className="text-xs font-semibold text-gray-600 mb-2 ml-1">
                          DATE OF BIRTH *
                        </Text>
                        <TouchableOpacity
                          onPress={() => setShowDatePicker(true)}
                          className="bg-white rounded-xl p-4 flex-row items-center justify-between border-2 border-blue-100 shadow-sm"
                        >
                          <View className="flex-row items-center flex-1">
                            <View className="w-10 h-10 rounded-lg bg-purple-100 items-center justify-center mr-3">
                              <Ionicons name="calendar" size={20} color="#8b5cf6" />
                            </View>
                            <Text className={`font-medium text-base ${dependentForm.dateOfBirth ? 'text-gray-800' : 'text-gray-400'}`}>
                              {dependentForm.dateOfBirth 
                                ? new Date(dependentForm.dateOfBirth).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })
                                : 'Tap to select date'}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
                        </TouchableOpacity>

                      {/* Native Date Picker */}
                      {showDatePicker && Platform.OS === 'ios' && (
                        <Modal
                          transparent
                          animationType="slide"
                          visible={showDatePicker}
                          onRequestClose={() => setShowDatePicker(false)}
                        >
                          <View className="flex-1 bg-black/50 justify-end">
                            <View className="bg-white rounded-t-3xl p-4">
                              <View className="flex-row justify-between items-center mb-4">
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                  <Text className="text-blue-500 text-lg">Cancel</Text>
                                </TouchableOpacity>
                                <Text className="text-lg font-semibold text-gray-800">Select Date</Text>
                                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                                  <Text className="text-blue-500 text-lg font-semibold">Done</Text>
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
                                      dateOfBirth: date.toISOString().split('T')[0],
                                    });
                                  }
                                }}
                                maximumDate={new Date()}
                              />
                            </View>
                          </View>
                        </Modal>
                      )}
                      {showDatePicker && Platform.OS === 'android' && (
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
                                dateOfBirth: date.toISOString().split('T')[0],
                              });
                            }
                          }}
                          maximumDate={new Date()}
                        />
                      )}
                    </View>

                      {/* Gender */}
                      <View className="mb-4">
                        <Text className="text-xs font-semibold text-gray-600 mb-2 ml-1">
                          GENDER *
                        </Text>
                        <View className="flex-row justify-between">
                          {genderOptions.map((option) => {
                            const isSelected = dependentForm.gender === option;
                            const iconMap: any = { 'Male': 'male', 'Female': 'female', 'Other': 'transgender' };
                            return (
                              <TouchableOpacity
                                key={option}
                                onPress={() =>
                                  setDependentForm({
                                    ...dependentForm,
                                    gender: option,
                                  })
                                }
                                className="flex-1 mx-1"
                              >
                                {isSelected ? (
                                  <LinearGradient
                                    colors={['#3b82f6', '#2563eb']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={{
                                      padding: 16,
                                      borderRadius: 12,
                                      borderWidth: 2,
                                      borderColor: '#3b82f6',
                                    }}
                                  >
                                    <View className="items-center">
                                      <Ionicons 
                                        name={iconMap[option]} 
                                        size={24} 
                                        color="white"
                                      />
                                      <Text className="text-center font-bold mt-2 text-white">
                                        {option}
                                      </Text>
                                    </View>
                                  </LinearGradient>
                                ) : (
                                  <View className="p-4 rounded-xl border-2 border-gray-200 bg-white shadow-sm">
                                    <View className="items-center">
                                      <Ionicons 
                                        name={iconMap[option]} 
                                        size={24} 
                                        color="#6b7280"
                                      />
                                      <Text className="text-center font-bold mt-2 text-gray-700">
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

                    {/* Relationship Section */}
                    <View>
                      <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-xl bg-green-100 items-center justify-center mr-3">
                          <Ionicons name="people" size={20} color="#10b981" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-gray-800">
                            Relationship
                          </Text>
                          <Text className="text-xs text-gray-500">
                            How they are related to you
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
                              <Ionicons name="people" size={20} color="#10b981" />
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
                                  <Ionicons name="checkmark-circle" size={20} color="#3b82f6" className="mr-2" />
                                )}
                                <Text className={`font-medium ${
                                  dependentForm.dependentType === option
                                    ? "text-blue-600"
                                    : "text-gray-700"
                                }`}>{option}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="mt-8 mb-4">
                    <TouchableOpacity
                      onPress={handleAddDependent}
                      disabled={
                        loading ||
                        !dependentForm.firstName.trim() ||
                        !dependentForm.lastName.trim() ||
                        !dependentForm.dateOfBirth.trim()
                      }
                      className={`rounded-2xl py-5 items-center shadow-xl mb-3 ${
                        loading ||
                        !dependentForm.firstName.trim() ||
                        !dependentForm.lastName.trim() ||
                        !dependentForm.dateOfBirth.trim()
                          ? "bg-gray-300"
                          : "bg-blue-500"
                      }`}
                      style={{
                        shadowColor: loading || !dependentForm.firstName.trim() || !dependentForm.lastName.trim() || !dependentForm.dateOfBirth.trim() ? '#9ca3af' : '#3b82f6',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                      }}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <View className="flex-row items-center">
                          <Ionicons name="person-add" size={24} color="white" />
                          <Text className="text-white font-bold text-lg ml-2">Add Family Member</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => setShowAddDependentModal(false)}
                      className="bg-white rounded-2xl py-4 items-center border-2 border-gray-200"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="close-circle-outline" size={22} color="#6b7280" />
                        <Text className="text-gray-700 font-semibold text-base ml-2">Cancel</Text>
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

      {/* Custom Alert */}
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        buttons={customAlert.buttons}
        icon={customAlert.icon}
        onClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}
