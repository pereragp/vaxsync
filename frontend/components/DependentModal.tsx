import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
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
  onDependentUpdated?: (updatedDependent: Dependent) => void;
}

const DependentModal: React.FC<DependentModalProps> = ({
  visible,
  dependent,
  onClose,
  onDependentDeleted,
  onDependentUpdated,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [localDependent, setLocalDependent] = useState<Dependent | null>(dependent);
  const [quickEditValue, setQuickEditValue] = useState<any>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    dependentType: ''
  });
  const [showQuickEditDatePicker, setShowQuickEditDatePicker] = useState(false);
  const [quickEditDate, setQuickEditDate] = useState(new Date());
  const [isUpdating, setIsUpdating] = useState(false);
  
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

  // Handle quick edit of individual fields
  const handleQuickEdit = (fieldName: string) => {
    if (!localDependent) return;
    
    setEditingField(fieldName);
    
    // Pre-populate with current values
    if (fieldName === 'name') {
      setQuickEditValue({
        ...quickEditValue,
        firstName: localDependent.firstName,
        lastName: localDependent.lastName
      });
    } else if (fieldName === 'dateOfBirth') {
      setQuickEditValue({
        ...quickEditValue,
        dateOfBirth: localDependent.dateOfBirth
      });
      setQuickEditDate(new Date(localDependent.dateOfBirth));
    } else {
      setQuickEditValue({
        ...quickEditValue,
        [fieldName]: localDependent[fieldName as keyof Dependent] || ''
      });
    }
    
    setShowQuickEditModal(true);
  };

  // Handle quick edit submission
  const handleQuickEditSubmit = async () => {
    if (!dependent) return;
    
    try {
      setIsUpdating(true);

      let updateData: any = {};
      
      if (editingField === 'name') {
        if (!quickEditValue.firstName.trim() || !quickEditValue.lastName.trim()) {
          showAlert('Please enter both first and last name', 'Validation error', [{ text: 'OK' }], 'warning');
          setIsUpdating(false);
          return;
        }
        updateData = {
          firstName: quickEditValue.firstName.trim(),
          lastName: quickEditValue.lastName.trim()
        };
      } else if (editingField) {
        updateData = { [editingField]: quickEditValue[editingField] };
      }

      const updatedDependent = await userAPI.updateDependent(dependent.guardianId, dependent._id, updateData);
      
      // Update local state immediately
      setLocalDependent(updatedDependent);
      
      // Notify parent component
      if (onDependentUpdated) {
        onDependentUpdated(updatedDependent);
      }
      onDependentDeleted(); // Refresh the parent list
      
      // Close quick edit modal but stay on dependent details
      setShowQuickEditModal(false);
      
      showAlert('Success', 'Information updated successfully!', [{ text: 'OK' }], 'success');
    } catch (error: any) {
      console.error('Error updating dependent:', error);
      showAlert('Error', error.message || 'Failed to update information', [{ text: 'OK' }], 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const genderOptions = ['Male', 'Female', 'Other'];
  const relationshipOptions = ['Child', 'Spouse', 'Parent', 'Sibling', 'Other'];

  // Sync local dependent with prop changes
  React.useEffect(() => {
    if (dependent) {
      setLocalDependent(dependent);
    }
  }, [dependent]);

  if (!dependent || !localDependent) return null;

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
                  {localDependent.firstName.charAt(0)}
                  {localDependent.lastName.charAt(0)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-white">
                  {localDependent.firstName} {localDependent.lastName}
                </Text>
                <View className="mt-1 self-start px-3 py-1 bg-white/20 backdrop-blur-lg rounded-full">
                  <Text className="text-white font-medium text-xs">
                    {localDependent.dependentType}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {/* Personal Information - Modern Card Layout */}
          <View className="mb-4">
            {/* Section Header */}
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-xl bg-blue-100 items-center justify-center mr-3">
                <Ionicons name="person-circle" size={22} color="#3b82f6" />
              </View>
              <View>
                <Text className="text-lg font-bold text-gray-800">Personal Information</Text>
                <Text className="text-xs text-gray-500">Member details</Text>
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
              {/* Full Name Card */}
              <TouchableOpacity 
                onPress={() => handleQuickEdit('name')}
                activeOpacity={0.6}
                className="bg-white rounded-2xl p-4 shadow-sm border border-blue-100 mb-4" 
                style={{ 
                  elevation: 2,
                  borderLeftWidth: 3,
                  borderLeftColor: '#6366f1'
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-xl bg-indigo-100 items-center justify-center mr-3">
                      <Ionicons name="person" size={20} color="#6366f1" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</Text>
                      <Text className="text-gray-800 font-bold text-lg mt-1">
                        {localDependent.firstName} {localDependent.lastName}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#6366f1" />
                </View>
              </TouchableOpacity>

              {/* Row 1: Birthday & Age */}
              <View className="flex-row mb-4">
                {/* Date of Birth Card */}
                <TouchableOpacity 
                  onPress={() => handleQuickEdit('dateOfBirth')}
                  activeOpacity={0.6}
                  className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-blue-100 mr-2" 
                  style={{ 
                    elevation: 2,
                    borderTopWidth: 2,
                    borderTopColor: '#8b5cf6'
                  }}
                >
                  <View className="flex-row items-center mb-2">
                    <View className="w-9 h-9 rounded-xl bg-purple-100 items-center justify-center mr-2">
                      <Ionicons name="calendar" size={18} color="#8b5cf6" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">Birthday</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#8b5cf6" />
                  </View>
                  <Text className="text-gray-800 font-semibold text-sm">
                    {formatDate(localDependent.dateOfBirth)}
                  </Text>
                </TouchableOpacity>

                {/* Age Card (Read-only) */}
                <View 
                  className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ml-2" 
                  style={{ 
                    elevation: 2,
                    borderTopWidth: 2,
                    borderTopColor: '#f59e0b'
                  }}
                >
                  <View className="flex-row items-center mb-2">
                    <View className="w-9 h-9 rounded-xl bg-orange-100 items-center justify-center mr-2">
                      <Ionicons name="timer" size={18} color="#f59e0b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">Age</Text>
                    </View>
                  </View>
                  <Text className="text-gray-800 font-semibold text-sm">
                    {getAge(localDependent.dateOfBirth)} years
                  </Text>
                </View>
              </View>

              {/* Row 2: Gender & Relationship */}
              <View className="flex-row mb-4">
                {/* Gender Card */}
                <TouchableOpacity 
                  onPress={() => handleQuickEdit('gender')}
                  activeOpacity={0.6}
                  className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-blue-100 mr-2" 
                  style={{ 
                    elevation: 2,
                    borderTopWidth: 2,
                    borderTopColor: '#3b82f6'
                  }}
                >
                  <View className="flex-row items-center mb-2">
                    <View className="w-9 h-9 rounded-xl bg-blue-100 items-center justify-center mr-2">
                      <Ionicons name={
                        localDependent.gender === 'Male' ? 'male' : 
                        localDependent.gender === 'Female' ? 'female' : 'transgender'
                      } size={18} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gender</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
                  </View>
                  <Text className="text-gray-800 font-semibold text-sm">{localDependent.gender}</Text>
                </TouchableOpacity>

                {/* Relationship Card */}
                <TouchableOpacity 
                  onPress={() => handleQuickEdit('dependentType')}
                  activeOpacity={0.6}
                  className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-blue-100 ml-2" 
                  style={{ 
                    elevation: 2,
                    borderTopWidth: 2,
                    borderTopColor: '#10b981'
                  }}
                >
                  <View className="flex-row items-center mb-2">
                    <View className="w-9 h-9 rounded-xl bg-green-100 items-center justify-center mr-2">
                      <Ionicons name="people" size={18} color="#10b981" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">Relation</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#10b981" />
                  </View>
                  <Text className="text-gray-800 font-semibold text-sm">{localDependent.dependentType}</Text>
                </TouchableOpacity>
              </View>

              {/* Added On Card (Read-only) */}
              <View 
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4" 
                style={{ 
                  elevation: 2,
                  borderLeftWidth: 3,
                  borderLeftColor: '#6b7280'
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-gray-100 items-center justify-center mr-3">
                    <Ionicons name="time" size={20} color="#6b7280" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider">Added On</Text>
                    <Text className="text-gray-800 font-semibold text-base mt-1">
                      {formatDate(localDependent.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Delete Action Button */}
          <TouchableOpacity
            onPress={handleDeleteDependent}
            disabled={isDeleting}
            className="bg-red-500 rounded-2xl py-4 shadow-lg mb-4"
            style={{ elevation: 4 }}
          >
            {isDeleting ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  Removing...
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-center">
                <Ionicons name="person-remove" size={22} color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  Remove Family Member
                </Text>
              </View>
            )}
          </TouchableOpacity>

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

      {/* Quick Edit Modal */}
      {showQuickEditModal && (
        <Modal
          visible={showQuickEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQuickEditModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowQuickEditModal(false)}>
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
              <TouchableWithoutFeedback>
                <KeyboardAvoidingView
                  behavior={Platform.OS === "ios" ? "padding" : "height"}
                  className="w-full max-w-md"
                >
                  <View className="bg-white rounded-3xl overflow-hidden shadow-2xl" style={{ elevation: 10 }}>
                    {/* Header */}
                    <LinearGradient
                      colors={['#1e40af', '#3b82f6', '#60a5fa']}
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
                            <Text className="text-xl font-bold text-white">Quick Edit</Text>
                            <Text className="text-blue-100 text-xs mt-1">
                              Update {editingField === 'name' ? 'Full Name' : 
                                     editingField === 'dateOfBirth' ? 'Birthday' :
                                     editingField === 'gender' ? 'Gender' : 'Relationship'}
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
                    <ScrollView className="p-6" keyboardShouldPersistTaps="handled">
                      {/* Full Name Edit */}
                      {editingField === 'name' && (
                        <View className="space-y-3">
                          <View>
                            <Text className="text-xs font-semibold text-gray-600 mb-2">FIRST NAME *</Text>
                            <TextInput
                              className="bg-gray-50 rounded-xl p-4 text-gray-800 font-medium border-2 border-gray-200"
                              placeholder="Enter first name"
                              value={quickEditValue.firstName}
                              onChangeText={(text) => setQuickEditValue({ ...quickEditValue, firstName: text })}
                              placeholderTextColor="#9ca3af"
                            />
                          </View>
                          <View>
                            <Text className="text-xs font-semibold text-gray-600 mb-2">LAST NAME *</Text>
                            <TextInput
                              className="bg-gray-50 rounded-xl p-4 text-gray-800 font-medium border-2 border-gray-200"
                              placeholder="Enter last name"
                              value={quickEditValue.lastName}
                              onChangeText={(text) => setQuickEditValue({ ...quickEditValue, lastName: text })}
                              placeholderTextColor="#9ca3af"
                            />
                          </View>
                        </View>
                      )}

                      {/* Date of Birth Edit */}
                      {editingField === 'dateOfBirth' && (
                        <View>
                          <Text className="text-xs font-semibold text-gray-600 mb-2">DATE OF BIRTH *</Text>
                          <TouchableOpacity
                            onPress={() => setShowQuickEditDatePicker(true)}
                            className="bg-gray-50 rounded-xl p-4 flex-row items-center justify-between border-2 border-gray-200"
                          >
                            <View className="flex-row items-center flex-1">
                              <Ionicons name="calendar" size={20} color="#8b5cf6" />
                              <Text className="ml-3 text-gray-800 font-medium">
                                {quickEditValue.dateOfBirth 
                                  ? new Date(quickEditValue.dateOfBirth).toLocaleDateString('en-US', { 
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
                          {showQuickEditDatePicker && Platform.OS === 'ios' && (
                            <Modal
                              transparent
                              animationType="slide"
                              visible={showQuickEditDatePicker}
                              onRequestClose={() => setShowQuickEditDatePicker(false)}
                            >
                              <View className="flex-1 bg-black/50 justify-end">
                                <View className="bg-white rounded-t-3xl p-4">
                                  <View className="flex-row justify-between items-center mb-4">
                                    <TouchableOpacity onPress={() => setShowQuickEditDatePicker(false)}>
                                      <Text className="text-blue-500 text-lg">Cancel</Text>
                                    </TouchableOpacity>
                                    <Text className="text-lg font-semibold text-gray-800">Select Date</Text>
                                    <TouchableOpacity onPress={() => setShowQuickEditDatePicker(false)}>
                                      <Text className="text-blue-500 text-lg font-semibold">Done</Text>
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
                                          dateOfBirth: date.toISOString().split('T')[0]
                                        });
                                      }
                                    }}
                                    maximumDate={new Date()}
                                  />
                                </View>
                              </View>
                            </Modal>
                          )}
                          {showQuickEditDatePicker && Platform.OS === 'android' && (
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
                                    dateOfBirth: date.toISOString().split('T')[0]
                                  });
                                }
                              }}
                              maximumDate={new Date()}
                            />
                          )}
                        </View>
                      )}

                      {/* Gender Edit */}
                      {editingField === 'gender' && (
                        <View>
                          <Text className="text-xs font-semibold text-gray-600 mb-2">GENDER *</Text>
                          <View className="flex-row justify-between">
                            {genderOptions.map((option) => {
                              const isSelected = quickEditValue.gender === option;
                              const iconMap: any = { 'Male': 'male', 'Female': 'female', 'Other': 'transgender' };
                              return (
                                <TouchableOpacity
                                  key={option}
                                  onPress={() => setQuickEditValue({ ...quickEditValue, gender: option })}
                                  className="flex-1 mx-0.5"
                                >
                                  {isSelected ? (
                                    <LinearGradient
                                      colors={['#3b82f6', '#2563eb']}
                                      start={{ x: 0, y: 0 }}
                                      end={{ x: 0, y: 1 }}
                                      style={{
                                        padding: 12,
                                        borderRadius: 12,
                                        borderWidth: 2,
                                        borderColor: '#3b82f6',
                                      }}
                                    >
                                      <View className="items-center">
                                        <Ionicons name={iconMap[option]} size={22} color="white" />
                                        <Text className="text-center font-semibold mt-1.5 text-white text-xs">
                                          {option}
                                        </Text>
                                      </View>
                                    </LinearGradient>
                                  ) : (
                                    <View className="p-3 rounded-xl border-2 border-gray-200 bg-white">
                                      <View className="items-center">
                                        <Ionicons name={iconMap[option]} size={22} color="#6b7280" />
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

                      {/* Relationship Edit */}
                      {editingField === 'dependentType' && (
                        <View>
                          <Text className="text-xs font-semibold text-gray-600 mb-2">RELATIONSHIP *</Text>
                          <View className="space-y-2">
                            {relationshipOptions.map((option) => {
                              const isSelected = quickEditValue.dependentType === option;
                              return (
                                <TouchableOpacity
                                  key={option}
                                  onPress={() => setQuickEditValue({ ...quickEditValue, dependentType: option })}
                                  className={`p-4 rounded-xl border-2 flex-row items-center ${
                                    isSelected ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200'
                                  }`}
                                >
                                  {isSelected && (
                                    <Ionicons name="checkmark-circle" size={22} color="#10b981" />
                                  )}
                                  <Text className={`font-semibold text-base ${
                                    isSelected ? 'text-green-700 ml-2' : 'text-gray-700'
                                  }`}>
                                    {option}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>
                      )}

                      {/* Action Buttons */}
                      <View className="mt-6">
                        <TouchableOpacity
                          onPress={handleQuickEditSubmit}
                          disabled={isUpdating}
                          className={`rounded-xl py-4 items-center shadow-lg mb-3 ${
                            isUpdating ? 'bg-gray-300' : 'bg-blue-500'
                          }`}
                          style={{ elevation: 4 }}
                        >
                          {isUpdating ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <View className="flex-row items-center">
                              <Ionicons name="checkmark-circle" size={22} color="white" />
                              <Text className="text-white font-bold text-base ml-2">Save Changes</Text>
                            </View>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setShowQuickEditModal(false)}
                          className="bg-gray-100 rounded-xl py-3 items-center"
                        >
                          <Text className="text-gray-700 font-semibold">Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </ScrollView>
                  </View>
                </KeyboardAvoidingView>
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
        onClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
      />
    </Modal>
  );
};

export default DependentModal;
