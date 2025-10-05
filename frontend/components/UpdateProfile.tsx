import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import userApi, { User } from "@/api/userApi";

interface UpdateProfileProps {
  user: User;
  visible: boolean;
  onClose: () => void;
  onUpdateSuccess: (updatedUser: User) => void;
}

interface EditForm {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  avatar?: string;
}

export default function UpdateProfile({
  user,
  visible,
  onClose,
  onUpdateSuccess,
}: UpdateProfileProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });

  //Initialize form when user data changes
  useEffect(() => {
    if (user) {
      setEditForm({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  //Submit form handling
  const handleSubmit = async () => {
    try {
      setLoading(true);

      //Validations
      if (!editForm.firstName.trim()) {
        Alert.alert("Error", "First name cannot be empty");
        return;
      }
      if (!editForm.lastName.trim()) {
        Alert.alert("Error", "Last name cannot be empty");
        return;
      }
      if (!editForm.phone.trim()) {
        Alert.alert("Error", "Phone number cannot be empty");
        return;
      }

      //Prepare data for update
      const updateData = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        phone: editForm.phone.trim(),
        dateOfBirth: editForm.dateOfBirth,
        gender: editForm.gender,
      };

      //Call backend API
      const updatedUser = await userApi.updateProfile(updateData);

      // Notify parent component of successful update
      onUpdateSuccess(updatedUser);
      onClose();

      Alert.alert("Success", "Profile updated successfully!!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  //Cancel update form
  const handleCancel = () => {
    // Reset form to original values
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
    });
    onClose();
  };

  //Form validity
  const isFormValid = () => {
    return (
      editForm.firstName.trim() &&
      editForm.lastName.trim() &&
      editForm.phone.trim() &&
      editForm.dateOfBirth &&
      editForm.gender
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-5/6">
          {/* Header */}
          <View className="p-6 border-b border-gray-100">
            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-bold text-gray-800">
                Edit Profile
              </Text>
              <TouchableOpacity
                onPress={handleCancel}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Content */}
          <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
            <View className="space-y-4">
              {/* Username - Read Only */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Username (Cannot be changed)
                </Text>
                <View className="bg-gray-100 rounded-lg p-3 border">
                  <Text className="text-gray-600">@{user?.username}</Text>
                </View>
              </View>

              {/* Email - Read Only */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Email (Cannot be changed)
                </Text>
                <View className="bg-gray-100 rounded-lg p-3 border">
                  <Text className="text-gray-600">{user?.email}</Text>
                </View>
              </View>

              {/* First Name */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-lg p-3 text-gray-800 border border-gray-200"
                  placeholder="Enter first name"
                  value={editForm.firstName}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, firstName: text })
                  }
                  placeholderTextColor="#9ca3af"
                  editable={!loading}
                />
              </View>

              {/* Last Name */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-lg p-3 text-gray-800 border border-gray-200"
                  placeholder="Enter last name"
                  value={editForm.lastName}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, lastName: text })
                  }
                  placeholderTextColor="#9ca3af"
                  editable={!loading}
                />
              </View>

              {/* Phone */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Phone *
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-lg p-3 text-gray-800 border border-gray-200"
                  placeholder="Enter phone number"
                  value={editForm.phone}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, phone: text })
                  }
                  keyboardType="phone-pad"
                  placeholderTextColor="#9ca3af"
                  editable={!loading}
                />
              </View>

              {/* Date of Birth */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-lg p-3 text-gray-800 border border-gray-200"
                  placeholder="YYYY-MM-DD"
                  value={editForm.dateOfBirth}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, dateOfBirth: text })
                  }
                  placeholderTextColor="#9ca3af"
                  editable={!loading}
                />
              </View>

              {/* Gender */}
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-lg p-3 text-gray-800 border border-gray-200"
                  placeholder="Enter gender"
                  value={editForm.gender}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, gender: text })
                  }
                  placeholderTextColor="#9ca3af"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3 mt-6">
              <TouchableOpacity
                onPress={handleCancel}
                className="flex-1 bg-gray-500 rounded-lg py-3 items-center"
                disabled={loading}
              >
                <Text className="text-white font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading || !isFormValid()}
                className={`flex-1 rounded-lg py-3 items-center ${
                  loading || !isFormValid() ? "bg-gray-400" : "bg-blue-500"
                }`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-medium">Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
