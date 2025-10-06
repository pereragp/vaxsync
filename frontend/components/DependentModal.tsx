import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import userAPI from "../api/userApi";

interface Dependent {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  dependentType: string;
  guardianId: string;
  createdAt: string;
  updatedAt: string;
}

interface DependentModalProps {
  visible: boolean;
  dependent: Dependent | null;
  onClose: () => void;
  onDependentDeleted: () => void;
}

const DependentModal: React.FC<DependentModalProps> = ({
  visible,
  dependent,
  onClose,
  onDependentDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!dependent) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAge = (dateOfBirth: string) => {
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

  const handleDeleteDependent = () => {
    Alert.alert(
      "Remove Dependent",
      `Are you sure you want to remove ${dependent.firstName} ${dependent.lastName} from your dependents list? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: confirmDeleteDependent,
        },
      ]
    );
  };

  const confirmDeleteDependent = async () => {
    try {
      setIsDeleting(true);
      await userAPI.removeDependent(dependent.guardianId, dependent._id);

      Alert.alert("Success", "Dependent has been removed successfully.", [
        {
          text: "OK",
          onPress: () => {
            onClose();
            onDependentDeleted();
          },
        },
      ]);
    } catch (error) {
      console.error("Error removing dependent:", error);
      Alert.alert("Error", "Failed to remove dependent. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-bold text-gray-800">
              Dependent Details
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 -mr-2"
              disabled={isDeleting}
            >
              <Text className="text-blue-500 font-medium text-lg">Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 py-6">
          {/* Main Info Card */}
          <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <View className="items-center mb-6">
              <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
                <Text className="text-2xl font-bold text-blue-600">
                  {dependent.firstName.charAt(0)}
                  {dependent.lastName.charAt(0)}
                </Text>
              </View>
              <Text className="text-2xl font-bold text-gray-800 text-center">
                {dependent.firstName} {dependent.lastName}
              </Text>
              <Text className="text-lg text-gray-600 mt-1">
                {dependent.dependentType}
              </Text>
            </View>

            {/* Details Grid */}
            <View className="space-y-4">
              <View className="flex-row justify-between py-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">Age</Text>
                <Text className="text-gray-800 font-semibold">
                  {getAge(dependent.dateOfBirth)} years old
                </Text>
              </View>

              <View className="flex-row justify-between py-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">Gender</Text>
                <Text className="text-gray-800 font-semibold">
                  {dependent.gender}
                </Text>
              </View>

              <View className="flex-row justify-between py-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">Date of Birth</Text>
                <Text className="text-gray-800 font-semibold">
                  {formatDate(dependent.dateOfBirth)}
                </Text>
              </View>

              <View className="flex-row justify-between py-3 border-b border-gray-100">
                <Text className="text-gray-600 font-medium">Relationship</Text>
                <Text className="text-gray-800 font-semibold">
                  {dependent.dependentType}
                </Text>
              </View>

              <View className="flex-row justify-between py-3">
                <Text className="text-gray-600 font-medium">Added on</Text>
                <Text className="text-gray-800 font-semibold">
                  {formatDate(dependent.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View className="space-y-3">
            {/* Edit Button (for future implementation) */}
            <TouchableOpacity
              className="bg-blue-500 py-4 rounded-lg"
              disabled={isDeleting}
            >
              <Text className="text-white text-center font-semibold text-lg">
                Edit Information
              </Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={handleDeleteDependent}
              disabled={isDeleting}
              className={`py-4 rounded-lg ${
                isDeleting ? "bg-gray-300" : "bg-red-500"
              }`}
            >
              {isDeleting ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">
                    Removing...
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Remove Dependent
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Warning Note */}
          <View className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <Text className="text-yellow-800 text-sm text-center">
              ⚠️ Removing a dependent will permanently delete all associated
              records and cannot be undone.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default DependentModal;
