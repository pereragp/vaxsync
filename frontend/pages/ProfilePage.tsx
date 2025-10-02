import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import userAPI, { User, Dependent } from "../api/userApi";
import { router } from "expo-router";
import UpdateProfile from "@/components/UpdateProfile";

const { width } = Dimensions.get("window");

export default function ProfilePage() {
  //State variables
  const [user, setUser] = useState<User | null>(null);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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

  // Add dependent form states
  const [dependentForm, setDependentForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    dependentType: "",
  });

  // Load user data
  useEffect(() => {
    loadUserData();
  }, []);

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
          "Cannot connect to backend server. Please ensure the backend is running on http://192.168.1.4:5000"
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
    try {
      await userAPI.logout();
      //navigate to login page
      Alert.alert(
        "Logout Successful",
        "You have been logged out successfully!",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate to login page
              router.replace("/login"); // or router.push('/login')
            },
          },
        ]
      );
    } catch (error) {
      console.error("Logout Failed: ", error);
      Alert.alert("Logout failed, please try again...");
    }
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
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      //Ensure user exists
      if (!user?._id) {
        Alert.alert("Error", "User information not available");
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

      Alert.alert("Success", "Dependent added successfully.");
      await refreshDependents();
    } catch (error: any) {
      console.error("Error adding dependent: ", error);
      Alert.alert("Error", error.message || "Failed to add dependent");
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
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 pt-6 pb-8">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-white text-2xl font-bold">My Profile</Text>
              <Text className="text-blue-100 text-sm">
                Manage your account and dependents
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleEditProfile}
              className="bg-black/50 rounded-full p-3"
            >
              <Ionicons name="create-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Profile Card */}
          <View className="bg-white rounded-2xl p-6 shadow-lg">
            <View className="flex-row items-center mb-4">
              <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mr-4">
                {user?.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <Ionicons name="person" size={32} color="#175593" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-800">
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text className="text-gray-600">@{user?.username}</Text>
                <Text className="text-sm text-gray-500">
                  {user && calculateAge(user.dateOfBirth)} years old
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-blue-600">
                  {dependents.length}
                </Text>
                <Text className="text-sm text-gray-600">Dependents</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-green-600">8</Text>
                <Text className="text-sm text-gray-600">Vaccines</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-purple-600">92%</Text>
                <Text className="text-sm text-gray-600">Compliance</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View className="px-6 py-6">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Personal Information
          </Text>

          <View className="bg-gray-50 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="mail-outline" size={20} color="#6b7280" />
              <Text className="text-gray-600 ml-3">Email</Text>
            </View>
            <Text className="text-gray-800 font-medium">{user?.email}</Text>
          </View>

          <View className="bg-gray-50 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="call-outline" size={20} color="#6b7280" />
              <Text className="text-gray-600 ml-3">Phone</Text>
            </View>
            <Text className="text-gray-800 font-medium">{user?.phone}</Text>
          </View>

          <View className="bg-gray-50 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              <Text className="text-gray-600 ml-3">Date of Birth</Text>
            </View>
            <Text className="text-gray-800 font-medium">
              {user && formatDate(user.dateOfBirth)}
            </Text>
          </View>

          <View className="bg-gray-50 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="person-outline" size={20} color="#6b7280" />
              <Text className="text-gray-600 ml-3">Gender</Text>
            </View>
            <Text className="text-gray-800 font-medium">{user?.gender}</Text>
          </View>
        </View>

        {/* Dependents Section */}
        <View className="px-6 pb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">Dependents</Text>
            <TouchableOpacity
              onPress={() => setShowAddDependentModal(true)}
              className="bg-blue-500 rounded-lg px-4 py-2 flex-row items-center"
            >
              <Ionicons name="add" size={16} color="white" />
              <Text className="text-white font-medium ml-1">Add</Text>
            </TouchableOpacity>
          </View>

          {dependents.length === 0 ? (
            <View className="bg-gray-50 rounded-2xl p-8 items-center">
              <Ionicons name="people-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-600 text-center mt-4">
                No dependents added yet
              </Text>
              <Text className="text-gray-500 text-sm text-center mt-2">
                Add family members to manage their health records
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {dependents.map((dependent) => (
                <View
                  key={dependent._id}
                  className="bg-white rounded-2xl p-4 border border-gray-200"
                >
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4">
                      <Ionicons name="person" size={20} color="#10b981" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-gray-800">
                        {dependent.firstName} {dependent.lastName}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        {dependent.dependentType} •{" "}
                        {calculateAge(dependent.dateOfBirth)} years old
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        Added {formatDate(dependent.createdAt)}
                      </Text>
                    </View>
                    <TouchableOpacity className="p-2">
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#9ca3af"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Account Settings */}
        <View className="px-6 pb-8">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Account Settings
          </Text>

          <TouchableOpacity className="bg-white rounded-2xl p-4 border border-gray-200 mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#6b7280"
              />
              <Text className="text-gray-800 font-medium ml-3">
                Privacy & Security
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className="bg-white rounded-2xl p-4 border border-gray-200 mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#6b7280"
              />
              <Text className="text-gray-800 font-medium ml-3">
                Notifications
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity className="bg-white rounded-2xl p-4 border border-gray-200 mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="help-circle-outline" size={20} color="#6b7280" />
              <Text className="text-gray-800 font-medium ml-3">
                Help & Support
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-50 rounded-2xl p-4 border border-red-200 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text className="text-red-600 font-medium ml-3">Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#ef4444" />
          </TouchableOpacity>
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
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-5/6">
            <View className="p-6 border-b border-gray-100">
              <View className="flex-row justify-between items-center">
                <Text className="text-xl font-bold text-gray-800">
                  Add Dependent
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddDependentModal(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-lg p-3 text-gray-800"
                    placeholder="Enter first name"
                    value={dependentForm.firstName}
                    onChangeText={(text) =>
                      setDependentForm({ ...dependentForm, firstName: text })
                    }
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-lg p-3 text-gray-800"
                    placeholder="Enter last name"
                    value={dependentForm.lastName}
                    onChangeText={(text) =>
                      setDependentForm({ ...dependentForm, lastName: text })
                    }
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </Text>
                  <TextInput
                    className="bg-gray-50 rounded-lg p-3 text-gray-800"
                    placeholder="YYYY-MM-DD"
                    value={dependentForm.dateOfBirth}
                    onChangeText={(text) =>
                      setDependentForm({ ...dependentForm, dateOfBirth: text })
                    }
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {genderOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        onPress={() =>
                          setDependentForm({ ...dependentForm, gender: option })
                        }
                        className={`px-4 py-2 rounded-lg border ${
                          dependentForm.gender === option
                            ? "bg-blue-100 border-blue-500"
                            : "bg-gray-50 border-gray-300"
                        }`}
                      >
                        <Text
                          className={`${
                            dependentForm.gender === option
                              ? "text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Relationship *
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {dependentTypeOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        onPress={() =>
                          setDependentForm({
                            ...dependentForm,
                            dependentType: option,
                          })
                        }
                        className={`px-4 py-2 rounded-lg border ${
                          dependentForm.dependentType === option
                            ? "bg-blue-100 border-blue-500"
                            : "bg-gray-50 border-gray-300"
                        }`}
                      >
                        <Text
                          className={`${
                            dependentForm.dependentType === option
                              ? "text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View className="flex-row space-x-3 mt-6">
                <TouchableOpacity
                  onPress={() => setShowAddDependentModal(false)}
                  className="flex-1 bg-gray-500 rounded-lg py-3 items-center"
                >
                  <Text className="text-white font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddDependent}
                  disabled={
                    loading ||
                    !dependentForm.firstName.trim() ||
                    !dependentForm.lastName.trim() ||
                    !dependentForm.dateOfBirth.trim()
                  }
                  className={`flex-1 rounded-lg py-3 items-center ${
                    loading ||
                    !dependentForm.firstName.trim() ||
                    !dependentForm.lastName.trim() ||
                    !dependentForm.dateOfBirth.trim()
                      ? "bg-gray-400"
                      : "bg-blue-500"
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium">
                      Add Dependent
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
