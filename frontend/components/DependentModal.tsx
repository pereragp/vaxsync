import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from "react-native-safe-area-context";
import userAPI from "../api/userApi";
import CustomAlert from "./CustomAlert";

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
    showAlert(
      "Remove Family Member",
      `Are you sure you want to remove ${dependent.firstName} ${dependent.lastName} from your family members? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          onPress: confirmDeleteDependent,
        },
      ],
      'warning'
    );
  };

  const confirmDeleteDependent = async () => {
    try {
      setIsDeleting(true);
      await userAPI.removeDependent(dependent.guardianId, dependent._id);

      showAlert(
        "Success", 
        "Family member has been removed successfully.", 
        [
          {
            text: "OK",
            onPress: () => {
              onClose();
              onDependentDeleted();
            },
          },
        ],
        'success'
      );
    } catch (error) {
      console.error("Error removing dependent:", error);
      showAlert(
        "Error", 
        "Failed to remove family member. Please try again.", 
        [{ text: "OK" }],
        'error'
      );
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
      <SafeAreaView className="flex-1" edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
        <View className="flex-1 bg-gray-50">
          {/* Gradient Header */}
          <LinearGradient
            colors={['#1e40af', '#3b82f6', '#60a5fa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="px-6 pb-4 pt-3"
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white text-base font-semibold">Family Member</Text>
              <TouchableOpacity
                onPress={onClose}
                disabled={isDeleting}
                className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-lg items-center justify-center"
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Profile Section - Horizontal Layout */}
            <View className="flex-row items-center">
              <View className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-lg items-center justify-center border-3 border-white/30 mr-4">
                <Text className="text-2xl font-bold text-white">
                  {dependent.firstName.charAt(0)}
                  {dependent.lastName.charAt(0)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-white">
                  {dependent.firstName} {dependent.lastName}
                </Text>
                <View className="mt-1 self-start px-3 py-1 bg-white/20 backdrop-blur-lg rounded-full">
                  <Text className="text-white font-medium text-xs">
                    {dependent.dependentType}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {/* Personal Information Card */}
          <View className="bg-white rounded-2xl p-6 mb-4 shadow-lg">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center mr-3">
                <Ionicons name="person" size={20} color="#3b82f6" />
              </View>
              <Text className="text-lg font-bold text-gray-800">
                Personal Information
              </Text>
            </View>

            {/* Details Grid */}
            <View className="space-y-3">
              <View className="flex-row items-center p-3 bg-gray-50 rounded-xl">
                <View className="w-10 h-10 rounded-lg bg-purple-100 items-center justify-center mr-3">
                  <Ionicons name="calendar" size={20} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold mb-1">AGE</Text>
                  <Text className="text-gray-800 font-bold">
                    {getAge(dependent.dateOfBirth)} years old
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-3 bg-gray-50 rounded-xl">
                <View className="w-10 h-10 rounded-lg bg-blue-100 items-center justify-center mr-3">
                  <Ionicons 
                    name={dependent.gender === 'Male' ? 'male' : dependent.gender === 'Female' ? 'female' : 'transgender'} 
                    size={20} 
                    color="#3b82f6" 
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold mb-1">GENDER</Text>
                  <Text className="text-gray-800 font-bold">
                    {dependent.gender}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-3 bg-gray-50 rounded-xl">
                <View className="w-10 h-10 rounded-lg bg-purple-100 items-center justify-center mr-3">
                  <Ionicons name="gift" size={20} color="#8b5cf6" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold mb-1">DATE OF BIRTH</Text>
                  <Text className="text-gray-800 font-bold">
                    {formatDate(dependent.dateOfBirth)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-3 bg-gray-50 rounded-xl">
                <View className="w-10 h-10 rounded-lg bg-green-100 items-center justify-center mr-3">
                  <Ionicons name="people" size={20} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold mb-1">RELATIONSHIP</Text>
                  <Text className="text-gray-800 font-bold">
                    {dependent.dependentType}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center p-3 bg-gray-50 rounded-xl">
                <View className="w-10 h-10 rounded-lg bg-gray-200 items-center justify-center mr-3">
                  <Ionicons name="time" size={20} color="#6b7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 font-semibold mb-1">ADDED ON</Text>
                  <Text className="text-gray-800 font-bold">
                    {formatDate(dependent.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions Card */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-lg">
            <Text className="text-base font-bold text-gray-800 mb-4">
              Quick Actions
            </Text>

            <View className="flex-row space-x-3">
              {/* Edit Button */}
              <TouchableOpacity
                disabled={isDeleting}
                className="flex-1"
              >
                <View className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                  <View className="items-center">
                    <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center mb-2 shadow-md">
                      <Ionicons name="create-outline" size={24} color="white" />
                    </View>
                    <Text className="text-blue-700 font-bold text-sm">
                      Edit
                    </Text>
                    <Text className="text-blue-600 text-xs mt-1">
                      Information
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Delete Button */}
              <TouchableOpacity
                onPress={handleDeleteDependent}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? (
                  <View className="bg-gray-100 rounded-xl p-4 border-2 border-gray-200">
                    <View className="items-center py-2">
                      <ActivityIndicator size="small" color="#6b7280" />
                      <Text className="text-gray-600 font-bold text-xs mt-2">
                        Removing...
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View className="bg-red-50 rounded-xl p-4 border-2 border-red-200">
                    <View className="items-center">
                      <View className="w-12 h-12 rounded-full bg-red-500 items-center justify-center mb-2 shadow-md">
                        <Ionicons name="trash-outline" size={24} color="white" />
                      </View>
                      <Text className="text-red-700 font-bold text-sm">
                        Remove
                      </Text>
                      <Text className="text-red-600 text-xs mt-1">
                        Member
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Warning Note */}
          <View className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-200 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="warning" size={24} color="#f59e0b" />
              <View className="flex-1 ml-3">
                <Text className="text-amber-800 font-bold text-sm mb-1">
                  Important Notice
                </Text>
                <Text className="text-amber-700 text-xs leading-5">
                  Removing a family member will permanently delete all associated health records and vaccination history. This action cannot be undone.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
      </SafeAreaView>

      {/* Custom Alert */}
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.title}
        message={customAlert.message}
        buttons={customAlert.buttons}
        icon={customAlert.icon}
        onClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
      />
    </Modal>
  );
};

export default DependentModal;
