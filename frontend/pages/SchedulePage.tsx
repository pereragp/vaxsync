import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  LayoutAnimation,
  UIManager,
  Platform,
  Animated,
  Dimensions,
  TextInput,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useRouter, useFocusEffect } from 'expo-router';
import scheduleAPI, { VaccineSchedule, CreateScheduleRequest, Vaccine } from '../api/scheduleApi';
import healthCardAPI, { HealthCard } from '../api/healthCardApi';
import userAPI from '../api/userApi';
import { GestureHandlerRootView, Swipeable, GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomAlert from '../components/CustomAlert';
import AddSchedule from '../components/AddSchedule';

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Profile {
  id: string;
  name: string;
  dob: string;
  relation: string;
  idNumber: string;
  lastUpdated: string;
  avatar?: string;
  healthCard?: HealthCard;
  isDependent?: boolean;
  dependentId?: string;
}

const { width } = Dimensions.get("window");

// Schedule status configurations
const scheduleConfig = {
  in_progress: { color: '#3b82f6', bgColor: '#dbeafe', icon: 'time' },
  completed: { color: '#10b981', bgColor: '#d1fae5', icon: 'checkmark-circle' },
  cancelled: { color: '#ef4444', bgColor: '#fee2e2', icon: 'close-circle' }
};

// Vaccine type configurations
const vaccineTypeConfig = {
  routine: { color: '#10b981', bgColor: '#d1fae5', icon: 'shield-checkmark' },
  travel: { color: '#3b82f6', bgColor: '#dbeafe', icon: 'airplane' },
  emergency: { color: '#ef4444', bgColor: '#fee2e2', icon: 'medical' },
  seasonal: { color: '#f59e0b', bgColor: '#fef3c7', icon: 'snow' }
};

// Dose status configurations
const doseConfig = {
  scheduled: { color: '#3b82f6', bgColor: '#dbeafe', icon: 'calendar' },
  completed: { color: '#10b981', bgColor: '#d1fae5', icon: 'checkmark-circle' },
  missed: { color: '#f59e0b', bgColor: '#fef3c7', icon: 'warning' },
  cancelled: { color: '#ef4444', bgColor: '#fee2e2', icon: 'close-circle' }
};

export default function SchedulePage() {
  const router = useRouter();
  
  // User state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [schedules, setSchedules] = useState<VaccineSchedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const profile = profiles[selectedIdx];
  const scrollRef = useRef<ScrollView>(null);

  const [expandedSchedules, setExpandedSchedules] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDoseModal, setShowDoseModal] = useState(false);
  const [showUpdateScheduleModal, setShowUpdateScheduleModal] = useState(false);
  const [showAddDependentModal, setShowAddDependentModal] = useState(false);
  const [showDependentDatePicker, setShowDependentDatePicker] = useState(false);
  const [dependentSelectedDate, setDependentSelectedDate] = useState(new Date());
  const [currentDependentStep, setCurrentDependentStep] = useState(1);
  const [selectedSchedule, setSelectedSchedule] = useState<VaccineSchedule | null>(null);
  const [selectedDose, setSelectedDose] = useState<{ schedule: VaccineSchedule; doseNumber: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Create schedule form state
  const [availableVaccines, setAvailableVaccines] = useState<Vaccine[]>([]);
  const [selectedVaccine, setSelectedVaccine] = useState<Vaccine | null>(null);
  const [vaccineSearchQuery, setVaccineSearchQuery] = useState("");
  const [totalDoses, setTotalDoses] = useState("1");
  const [interval, setInterval] = useState("28"); // days
  const [scheduleDate, setScheduleDate] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [healthcareProvider, setHealthcareProvider] = useState("");
  const [notes, setNotes] = useState("");
  const [vaccinationType, setVaccinationType] = useState<'routine' | 'travel' | 'occupational' | 'emergency'>('routine');
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Update schedule form state
  const [updateVaccineName, setUpdateVaccineName] = useState("");
  const [updateHealthcareProvider, setUpdateHealthcareProvider] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [updateScheduleDate, setUpdateScheduleDate] = useState("");
  const [updateSelectedDate, setUpdateSelectedDate] = useState(new Date());
  const [showUpdateDatePicker, setShowUpdateDatePicker] = useState(false);
  const [newDoseInterval, setNewDoseInterval] = useState("");
  const [doseIntervals, setDoseIntervals] = useState<{[key: number]: string}>({});

  // Add dependent form state
  const [dependentForm, setDependentForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "Male",
    dependentType: "",
  });
  const [showRelationshipDropdown, setShowRelationshipDropdown] = useState(false);
  const genderOptions = ["Male", "Female", "Other"];
  const dependentTypeOptions = ["Child", "Spouse", "Parent", "Sibling", "Other"];

  // Animations
  const cardAnimations = useRef<{[key: string]: Animated.Value}>({});
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const progressAnimations = useRef<{[key: string]: Animated.Value}>({});
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Swipeable refs for doses
  const doseSwipeableRefs = useRef<{[key: string]: Swipeable | null}>({});
  
  // Track if any swipeable is open to disable scroll
  const [isSwipeableOpen, setIsSwipeableOpen] = useState(false);

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

  // Load current user data
  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = await userAPI.getCurrentUser();
      setCurrentUser(userData);
      // Load health card data after getting user
      loadHealthCardData();
    } catch (error: any) {
      console.error('Error loading current user:', error);
      setError('Failed to load user data. Please log in again.');
    }
  };

  // Load health card data to get user profiles
  const loadHealthCardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const allHealthCards = await healthCardAPI.getAllHealthCards();
      
      // Convert health cards to profiles
      const newProfiles: Profile[] = allHealthCards.map((healthCard) => ({
        id: healthCard._id,
        name: healthCard.fullName,
        dob: new Date(healthCard.dateOfBirth).toLocaleDateString(),
        relation: healthCard.cardType === 'dependent' ? 'Dependent' : 'User',
        idNumber: healthCard._id.slice(-8).toUpperCase(),
        lastUpdated: new Date(healthCard.updatedAt).toLocaleDateString(),
        healthCard: healthCard,
        isDependent: healthCard.cardType === 'dependent',
        dependentId: healthCard.cardType === 'dependent' ? healthCard.dependentId : undefined,
      }));

      setProfiles(newProfiles);

    } catch (error: any) {
      console.error('Error loading health card data:', error);
      
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        setError('No health cards found. Would you like to create them?');
        showAlert(
          'No Health Cards Found',
          'No health cards exist for this user. Would you like to create them?',
          [
            { 
              text: 'Cancel', 
              style: 'cancel' 
            },
            { 
              text: 'Create Health Cards', 
              onPress: () => currentUser && createAllHealthCards(currentUser._id)
            }
          ],
          'question'
        );
      } else {
        setError(error.message || 'Failed to load health cards');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create all health cards for user and dependents
  const createAllHealthCards = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      await healthCardAPI.createAllHealthCards(userId);
      
      // Reload all health cards after creation
      await loadHealthCardData();

      showAlert(
        'Success',
        'Health cards created successfully for user and dependents.',
        [{ text: 'OK' }],
        'success'
      );

    } catch (error: any) {
      console.error('Error creating all health cards:', error);
      setError(error.message || 'Failed to create health cards');
      showAlert(
        'Error Creating Health Cards',
        error.message || 'Failed to create health cards. Please try again.',
        [{ text: 'OK' }],
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Load schedules for current profile
  const loadSchedules = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      setError(null);

      // Get all schedules first
      const { schedules: allSchedules } = await scheduleAPI.getAllSchedules();
      
      // Filter schedules based on current profile
      let filteredSchedules: VaccineSchedule[] = [];
      
      if (profile.isDependent && profile.dependentId) {
        // For dependents, only show schedules where this dependent is included and not completed
        filteredSchedules = allSchedules.filter(schedule => {
          // Handle both populated objects and raw IDs
          const dependentIds = schedule.dependentIds || [];
          const isIncluded = dependentIds.some((dependent: any) => {
            // If dependent is populated object, check the _id field
            if (typeof dependent === 'object' && dependent._id) {
              return dependent._id === profile.dependentId;
            }
            // If dependent is raw string/ID, compare directly
            return dependent === profile.dependentId;
          });
          const isNotCompleted = schedule.overallStatus !== 'completed';
          
          return isIncluded && isNotCompleted;
        });
      } else {
        // For main user, only show schedules where no dependents are specified (user's own schedules) and not completed
        filteredSchedules = allSchedules.filter(schedule => {
          const hasNoDependents = !schedule.dependentIds || schedule.dependentIds.length === 0;
          const isNotCompleted = schedule.overallStatus !== 'completed';
          
          return hasNoDependents && isNotCompleted;
        });
      }
      
      setSchedules(filteredSchedules);

    } catch (error: any) {
      console.error('Error loading schedules:', error);
      setError(error.message || 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  // Load health card data when component mounts
  useEffect(() => {
    loadHealthCardData();
  }, []);

  // Reload profiles when page comes into focus
  useFocusEffect(
    useCallback(() => {
      loadHealthCardData();
    }, [])
  );

  // Load schedules when profile changes
  useEffect(() => {
    if (profiles.length > 0) {
      loadSchedules();
    }
  }, [selectedIdx, profiles]);

  // Initialize animations
  useEffect(() => {
    schedules.forEach(schedule => {
      if (!cardAnimations.current[schedule._id]) {
        cardAnimations.current[schedule._id] = new Animated.Value(0);
      }
      if (!progressAnimations.current[schedule._id]) {
        progressAnimations.current[schedule._id] = new Animated.Value(0);
      }
    });

    // Start pulse animation for timeline
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();

    // Animate progress bars
    schedules.forEach(schedule => {
      const completionPercentage = scheduleAPI.getCompletionPercentage(schedule);
      Animated.timing(progressAnimations.current[schedule._id], {
        toValue: completionPercentage / 100,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    });
  }, [schedules, pulseAnim]);

  const toggleExpand = (scheduleId: string) => {
    LayoutAnimation.configureNext({
      ...LayoutAnimation.Presets.easeInEaseOut,
      duration: 300,
    });
    
    setExpandedSchedules(prev => {
      const isExpanding = !prev.includes(scheduleId);
      
      // Animate card
      Animated.timing(cardAnimations.current[scheduleId], {
        toValue: isExpanding ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      return isExpanding ? [...prev, scheduleId] : prev.filter(id => id !== scheduleId);
    });
  };

  const handleProfileSwitch = async (newIndex: number) => {
    if (newIndex === selectedIdx) return;

    // Start transition animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: newIndex > selectedIdx ? -50 : 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedIdx(newIndex);
      
      // Complete transition animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Load available vaccines
  const loadAvailableVaccines = async () => {
    try {
      const { vaccines } = await scheduleAPI.getAllVaccines({ isActive: true });
      setAvailableVaccines(vaccines);
    } catch (error: any) {
      console.error('Error loading vaccines:', error);
      showAlert('Error', 'Failed to load available vaccines', [{ text: 'OK' }], 'error');
    }
  };

  const handleCreateSchedule = () => {
    setShowCreateModal(true);
    loadAvailableVaccines();
  };

  // Dependent form step validation
  const validateDependentStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Step 1: Personal Details
        if (!dependentForm.firstName.trim() || !dependentForm.lastName.trim()) {
          showAlert('Validation Error', 'Please enter first and last name', [{ text: 'OK' }], 'warning');
          return false;
        }
        if (!dependentForm.dateOfBirth) {
          showAlert('Validation Error', 'Please select date of birth', [{ text: 'OK' }], 'warning');
          return false;
        }
        if (!dependentForm.gender) {
          showAlert('Validation Error', 'Please select a gender', [{ text: 'OK' }], 'warning');
          return false;
        }
        return true;
      case 2:
        // Step 2: Relationship
        if (!dependentForm.dependentType) {
          showAlert('Validation Error', 'Please select a relationship', [{ text: 'OK' }], 'warning');
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

      // Get current user for guardianId
      if (!currentUser || !currentUser._id) {
        showAlert('Error', 'User information not found', [{ text: 'OK' }], 'error');
        setLoading(false);
        return;
      }

      const dependentData = {
        firstName: dependentForm.firstName.trim(),
        lastName: dependentForm.lastName.trim(),
        dateOfBirth: dependentForm.dateOfBirth,
        gender: dependentForm.gender,
        dependentType: dependentForm.dependentType,
        guardianId: currentUser._id,
      };

      await userAPI.addDependent(dependentData);

      // Reset form
      setDependentForm({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "Male",
        dependentType: "",
      });
      setShowRelationshipDropdown(false);
      setShowAddDependentModal(false);
      setCurrentDependentStep(1);

      // Reload profiles
      await loadHealthCardData();

      showAlert('Success', 'Family member added successfully!', [{ text: 'OK' }], 'success');
    } catch (error: any) {
      console.error('Error adding dependent:', error);
      showAlert('Error', error.message || 'Failed to add family member', [{ text: 'OK' }], 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScheduleSubmit = async () => {
    try {
      setLoading(true);

      // Check authentication token
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        showAlert('Authentication Error', 'Please login again', [{ text: 'OK' }], 'error');
        setLoading(false);
        return;
      }
      console.log('Auth token exists:', !!token);

      // Validate form
      const vaccineName = selectedVaccine?.name || vaccineSearchQuery.trim();
      if (!vaccineName) {
        showAlert('Error', 'Please select a vaccine or enter a vaccine name', [{ text: 'OK' }], 'warning');
        return;
      }

      if (!scheduleDate) {
        showAlert('Error', 'Please select a schedule date', [{ text: 'OK' }], 'warning');
        return;
      }

      const totalDosesNum = parseInt(totalDoses);
      const intervalNum = parseInt(interval);

      if (totalDosesNum < 1) {
        showAlert('Error', 'Total doses must be at least 1', [{ text: 'OK' }], 'warning');
        return;
      }

      if (totalDosesNum > 1 && intervalNum < 0) {
        showAlert('Error', 'Interval must be non-negative for multiple doses', [{ text: 'OK' }], 'warning');
        return;
      }

      // Prepare schedule data
      const scheduleData: CreateScheduleRequest = {
        vaccineId: selectedVaccine ? selectedVaccine._id : undefined,
        vaccineName: vaccineName,
        totalDoses: totalDosesNum,
        interval: intervalNum,
        dependentId: profile?.isDependent ? profile.dependentId : undefined,
        healthcareProvider: healthcareProvider.trim() || undefined,
        notes: notes.trim() || undefined,
        scheduleDate: scheduleDate,
        vaccinationType: vaccinationType,
      };

      // Create schedule
      await scheduleAPI.createSchedule(scheduleData);

      // Reload schedules
      await loadSchedules();

      // Reset form
      resetCreateForm();

      // Close modal
      setShowCreateModal(false);

      showAlert('Success', 'Vaccine schedule created successfully!', [{ text: 'OK' }], 'success');

    } catch (error: any) {
      console.error('Error creating schedule:', error);
      showAlert('Error', error.message || 'Failed to create schedule', [{ text: 'OK' }], 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setSelectedVaccine(null);
    setVaccineSearchQuery("");
    setTotalDoses("1");
    setInterval("28");
    setScheduleDate("");
    setSelectedDate(new Date());
    setHealthcareProvider("");
    setNotes("");
    setVaccinationType('routine');
    setShowDatePicker(false);
  };

  const handleDosePress = (schedule: VaccineSchedule, doseNumber: number) => {
    setSelectedDose({ schedule, doseNumber });
    setShowDoseModal(true);
  };

  const handleDoseStatusUpdate = async (scheduleId: string, doseNumber: number, newStatus: 'scheduled' | 'completed' | 'missed' | 'cancelled') => {
    try {
      setLoading(true);
      
      const updateData: any = {
        status: newStatus,
      };

      // If marking as completed, set the completion date
      if (newStatus === 'completed') {
        updateData.dateCompleted = new Date().toISOString();
      }

      await scheduleAPI.updateDoseStatus(scheduleId, doseNumber, updateData);

      // Reload schedules
      await loadSchedules();
      
      // Check if this was the last dose to be completed
      const currentSchedule = schedules.find(s => s._id === scheduleId);
      if (currentSchedule && newStatus === 'completed') {
        const completedDoses = currentSchedule.doses.filter(d => d.status === 'completed').length + 1; // +1 for the dose we just completed
        const totalDoses = currentSchedule.doses.length;
        
        // Prepare completed vaccine data for redirection
        const completedVaccineData = {
          vaccineName: currentSchedule.vaccineName,
          doseNumber: doseNumber,
          totalDoses: totalDoses,
          dateCompleted: new Date().toISOString(),
          scheduleId: scheduleId,
        };
        
        if (completedDoses === totalDoses) {
          showAlert(
            'Schedule Completed!', 
            `All doses completed! Would you like to view post-vaccination instructions?`,
            [
              { 
                text: 'Skip', 
                style: 'cancel',
                onPress: () => {
                  // Stay on schedule page
                }
              },
              { 
                text: 'View Instructions', 
              style: 'default',
              onPress: () => {
                // Navigate to VaccinesPage with completed vaccine data
                router.push({
                  pathname: '/vaccines',
                  params: {
                    showInstructions: 'true',
                    vaccineName: completedVaccineData.vaccineName,
                    doseNumber: completedVaccineData.doseNumber.toString(),
                    totalDoses: completedVaccineData.totalDoses.toString(),
                    dateCompleted: completedVaccineData.dateCompleted,
                  }
                });
              }
              }
            ],
            'success'
          );
        } else {
          showAlert(
            'Dose Completed!', 
            `Dose ${doseNumber} marked as completed! Would you like to view post-vaccination instructions?`,
            [
              { 
                text: 'Skip', 
                style: 'cancel',
                onPress: () => {
                  // Stay on schedule page
                }
              },
              { 
              text: 'View Instructions', 
              style: 'default',
              onPress: () => {
                // Navigate to VaccinesPage with completed vaccine data
                router.push({
                  pathname: '/vaccines',
                  params: {
                    showInstructions: 'true',
                    vaccineName: completedVaccineData.vaccineName,
                    doseNumber: completedVaccineData.doseNumber.toString(),
                    totalDoses: completedVaccineData.totalDoses.toString(),
                    dateCompleted: completedVaccineData.dateCompleted,
                  }
                });
              }
              }
            ],
            'success'
          );
        }
      } else {
        showAlert('Success', `Dose ${doseNumber} marked as ${newStatus} successfully!`, [{ text: 'OK' }], 'success');
      }
      
      setShowDoseModal(false);
      setSelectedDose(null);

    } catch (error: any) {
      console.error('Error updating dose status:', error);
      showAlert('Error', error.message || 'Failed to update dose status', [{ text: 'OK' }], 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchedule = (schedule: VaccineSchedule) => {
    setSelectedSchedule(schedule);
    setUpdateVaccineName(schedule.vaccineName);
    setUpdateHealthcareProvider(schedule.healthcareProvider?.name || "");
    setUpdateNotes(schedule.notes || "");
    
    // Set schedule date to the first dose's scheduled date
    const firstDose = schedule.doses.find(d => d.doseNumber === 1);
    if (firstDose) {
      setUpdateScheduleDate(new Date(firstDose.dateScheduled).toISOString().split('T')[0]);
    }
    
    // Initialize dose intervals
    const intervals: {[key: number]: string} = {};
    schedule.doses.forEach((dose, index) => {
      if (index > 0) {
        const daysDiff = Math.round(
          (new Date(dose.dateScheduled).getTime() - 
           new Date(schedule.doses[index - 1].dateScheduled).getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        intervals[dose.doseNumber] = daysDiff.toString();
      }
    });
    setDoseIntervals(intervals);
    
    setShowUpdateScheduleModal(true);
  };

  const handleUpdateScheduleSubmit = async () => {
    if (!selectedSchedule) return;

    try {
      setLoading(true);

      // Check if any dose intervals were changed
      const hasIntervalChanges = Object.keys(doseIntervals).length > 0;

      const updateData: any = {
        vaccineName: updateVaccineName.trim(),
        healthcareProvider: updateHealthcareProvider.trim() ? { name: updateHealthcareProvider.trim() } : undefined,
        notes: updateNotes.trim() || undefined,
        scheduleDate: updateScheduleDate,
      };

      // Always recalculate dose dates if schedule date or intervals changed
      const updatedDoses = selectedSchedule.doses.map((dose, index) => {
        if (index === 0) {
          // First dose uses the schedule date
          return {
            ...dose,
            dateScheduled: new Date(updateScheduleDate)
          };
        } else {
          // Calculate date based on custom interval from the dose intervals state
          const customInterval = parseInt(doseIntervals[dose.doseNumber]);
          if (customInterval && customInterval > 0) {
            const prevDate = new Date(selectedSchedule.doses[index - 1].dateScheduled);
            const newDate = new Date(prevDate);
            newDate.setDate(newDate.getDate() + customInterval);
            
            return {
              ...dose,
              dateScheduled: newDate
            };
          }
          // If no custom interval, keep the existing dose date
          return dose;
        }
      });

      updateData.doses = updatedDoses;

      await scheduleAPI.updateSchedule(selectedSchedule._id, updateData);

      // Reload schedules
      await loadSchedules();

      // Reset form
      setSelectedSchedule(null);
      setUpdateVaccineName("");
      setUpdateHealthcareProvider("");
      setUpdateNotes("");
      setUpdateScheduleDate("");
      setNewDoseInterval("");
      setDoseIntervals({});

      // Close modal
      setShowUpdateScheduleModal(false);

      showAlert('Success', 'Schedule updated successfully!', [{ text: 'OK' }], 'success');

    } catch (error: any) {
      console.error('Error updating schedule:', error);
      showAlert('Error', error.message || 'Failed to update schedule', [{ text: 'OK' }], 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string, vaccineName: string) => {
    showAlert(
      'Delete Schedule',
      `Are you sure you want to delete the schedule for ${vaccineName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await scheduleAPI.deleteSchedule(scheduleId);
              await loadSchedules();
              showAlert('Success', 'Schedule deleted successfully!', [{ text: 'OK' }], 'success');
            } catch (error: any) {
              console.error('Error deleting schedule:', error);
              showAlert('Error', error.message || 'Failed to delete schedule', [{ text: 'OK' }], 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ],
      'warning'
    );
  };

  // Calculate stats for progress display based on dose status
  const scheduleStats = {
    total: schedules.length,
    scheduled: schedules.filter(s => s.doses.some(d => d.status === 'scheduled')).length,
    completed: schedules.filter(s => s.doses.some(d => d.status === 'completed')).length,
    overdue: schedules.filter(s => {
      // Check if schedule has any overdue doses (scheduled but date passed)
      return s.doses.some(dose => {
        if (dose.status === 'scheduled') {
          const doseDate = new Date(dose.dateScheduled);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return doseDate < today;
        }
        return false;
      });
    }).length,
    missed: schedules.filter(s => s.doses.some(d => d.status === 'missed')).length,
    cancelled: schedules.filter(s => s.doses.some(d => d.status === 'cancelled')).length,
  };

  // Filter schedules based on dose status
  const filteredSchedules = schedules.filter(schedule => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = schedule.vaccineName.toLowerCase().includes(searchLower) ||
      schedule.healthcareProvider?.name?.toLowerCase().includes(searchLower) ||
      schedule.notes?.toLowerCase().includes(searchLower);
    
    let matchesFilter = true;
    
    if (filterStatus !== 'all') {
      if (filterStatus === 'overdue') {
        // Check if any dose is scheduled but overdue (date passed)
        const hasOverdueDose = schedule.doses.some(dose => {
          if (dose.status === 'scheduled') {
            const doseDate = new Date(dose.dateScheduled);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return doseDate < today;
          }
          return false;
        });
        matchesFilter = hasOverdueDose;
      } else {
      // Check if any dose in the schedule matches the filter status
      const hasMatchingDose = schedule.doses.some(dose => dose.status === filterStatus);
      matchesFilter = hasMatchingDose;
      }
    }
    
    return matchesSearch && matchesFilter;
  });

  const CircularProgress = ({ percentage, size = 60, strokeWidth = 6, schedule }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    schedule: VaccineSchedule;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const config = scheduleConfig[schedule.overallStatus];
    const completedDoses = schedule.doses.filter(d => d.status === 'completed').length;
    const cancelledDoses = schedule.doses.filter(d => d.status === 'cancelled').length;
    const activeDoses = schedule.totalDoses - cancelledDoses;

    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={config.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-xs font-bold" style={{ color: config.color }}>
            {Math.round(percentage)}%
          </Text>
          <Text className="text-xs" style={{ color: config.color, fontSize: 8 }}>
            {completedDoses}/{activeDoses}
          </Text>
        </View>
      </View>
    );
  };

  // Render left swipe actions for schedule cards (Edit/Delete)
  const renderLeftActions = (schedule: VaccineSchedule) => (
    <View className="flex-col justify-center" style={{ width: 80 }}>
      <TouchableOpacity
        onPress={() => {
          setIsSwipeableOpen(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          handleUpdateSchedule(schedule);
        }}
        className="bg-blue-500 justify-center items-center flex-1 rounded-tl-2xl"
      >
        <Ionicons name="create-outline" size={24} color="white" />
        <Text className="text-white text-xs font-semibold mt-1">Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          setIsSwipeableOpen(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          handleDeleteSchedule(schedule._id, schedule.vaccineName);
        }}
        className="bg-red-500 justify-center items-center flex-1 rounded-bl-2xl"
      >
        <Ionicons name="trash-outline" size={24} color="white" />
        <Text className="text-white text-xs font-semibold mt-1">Delete</Text>
      </TouchableOpacity>
    </View>
  );

  // Render left swipe actions for dose items (Mark as completed)
  const renderLeftDoseActions = (schedule: VaccineSchedule, dose: any) => {
    const swipeKey = `${schedule._id}-${dose.doseNumber}`;
    
    if (dose.status === 'completed') {
  return (
        <View className="flex-row items-center">
          <View className="bg-gray-400 justify-center items-center px-6 h-full rounded-l-2xl" style={{ width: 100 }}>
            <Ionicons name="checkmark-done" size={24} color="white" />
            <Text className="text-white text-xs font-semibold mt-1">Completed</Text>
          </View>
        </View>
      );
    }
    
    return (
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={async () => {
            setIsSwipeableOpen(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Close the swipeable
            doseSwipeableRefs.current[swipeKey]?.close();
            // Update the status
            await handleDoseStatusUpdate(schedule._id, dose.doseNumber, 'completed');
          }}
          className="bg-green-500 justify-center items-center px-6 h-full rounded-l-2xl"
          style={{ width: 100 }}
        >
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text className="text-white text-xs font-semibold mt-1">Complete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render right swipe actions for dose items (Cancel/Mark as cancelled)
  const renderRightDoseActions = (schedule: VaccineSchedule, dose: any) => {
    const swipeKey = `${schedule._id}-${dose.doseNumber}`;
    
    if (dose.status === 'cancelled') {
      return (
        <View className="flex-row items-center justify-end">
          <View className="bg-gray-400 justify-center items-center px-6 h-full rounded-r-2xl" style={{ width: 100 }}>
            <Ionicons name="close-circle" size={24} color="white" />
            <Text className="text-white text-xs font-semibold mt-1">Cancelled</Text>
          </View>
        </View>
      );
    }
    
    return (
      <View className="flex-row items-center justify-end">
        <TouchableOpacity
          onPress={async () => {
            setIsSwipeableOpen(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            // Close the swipeable
            doseSwipeableRefs.current[swipeKey]?.close();
            // Update the status to cancelled
            await handleDoseStatusUpdate(schedule._id, dose.doseNumber, 'cancelled');
          }}
          className="bg-red-500 justify-center items-center px-6 h-full rounded-r-2xl"
          style={{ width: 100 }}
        >
          <Ionicons name="close-circle" size={24} color="white" />
          <Text className="text-white text-xs font-semibold mt-1">Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView
      className="flex-1"
      edges={["top"]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={['#1e40af', '#3b82f6', '#60a5fa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-4 pb-8 px-6"
      >
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-white mb-1">
              Vaccine Schedules
            </Text>
            <Text className="text-blue-100 text-base">
              Plan and track your vaccinations
            </Text>
          </View>
          <View className="bg-white/20 rounded-2xl p-3">
            <Ionicons name="calendar" size={32} color="white" />
          </View>
        </View>

        {/* Stats Cards */}
        <View className="flex-row justify-between">
          <View className="bg-white/15 rounded-2xl p-4 flex-1 mr-2 backdrop-blur-sm">
            <View className="mb-2">
              <Ionicons name="calendar" size={20} color="white" />
              <Text className="text-white/90 text-xs font-medium mt-1">Total</Text>
            </View>
            <Text className="text-2xl font-bold text-white">{scheduleStats.total}</Text>
            <Text className="text-white/70 text-xs">schedules</Text>
          </View>
          
          <View className="bg-white/15 rounded-2xl p-4 flex-1 mx-1 backdrop-blur-sm">
            <View className="mb-2">
              <Ionicons name="time" size={20} color="white" />
              <Text className="text-white/90 text-xs font-medium mt-1">Scheduled</Text>
            </View>
            <Text className="text-2xl font-bold text-white">{scheduleStats.scheduled}</Text>
            <Text className="text-white/70 text-xs">upcoming</Text>
          </View>
          
          <View className="bg-white/15 rounded-2xl p-4 flex-1 mx-1 backdrop-blur-sm">
            <View className="mb-2">
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text className="text-white/90 text-xs font-medium mt-1">Completed</Text>
            </View>
            <Text className="text-2xl font-bold text-white">{scheduleStats.completed}</Text>
            <Text className="text-white/70 text-xs">finished</Text>
          </View>
          
          <View className="bg-white/15 rounded-2xl p-4 flex-1 ml-2 backdrop-blur-sm">
            <View className="mb-2">
              <Ionicons name="alert-circle" size={20} color="white" />
              <Text className="text-white/90 text-xs font-medium mt-1">Overdue</Text>
            </View>
            <Text className="text-2xl font-bold text-white">{scheduleStats.overdue}</Text>
            <Text className="text-white/70 text-xs">past due</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content Container */}
      <View className="flex-1 bg-gray-50 -mt-4 rounded-t-3xl">
        <View className="pt-6 px-4">

          {/* Enhanced Loading State */}
          {loading && (
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center">
                <View className="bg-blue-100 rounded-full p-2 mr-3">
                  <ActivityIndicator size="small" color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium text-base">
                    Loading vaccination schedules...
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    Please wait while we fetch your data
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Enhanced Error State */}
          {error && (
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-red-100">
              <View className="flex-row items-start">
                <View className="bg-red-100 rounded-full p-2 mr-3">
                  <Ionicons name="warning" size={20} color="#ef4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-red-800 font-medium text-base mb-1">
                    Something went wrong
                  </Text>
                  <Text className="text-red-600 text-sm mb-3">{error}</Text>
                  {error.includes('No health cards found') && currentUser && (
                    <TouchableOpacity
                      onPress={() => createAllHealthCards(currentUser._id)}
                      className="bg-red-500 rounded-xl px-4 py-3 self-start"
                    >
                      <Text className="text-white text-sm font-semibold">
                        Create Health Cards
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Enhanced Profile Carousel */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-4 px-4">
            <Text className="text-lg font-bold text-gray-800">
            Profiles
          </Text>
            <TouchableOpacity
              onPress={handleCreateSchedule}
              className="bg-blue-500 rounded-xl px-4 py-2 flex-row items-center shadow-md"
              style={{
                elevation: 4,
                shadowColor: "#3b82f6",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
              }}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <Text className="text-white font-bold ml-2">Add Schedule</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {profiles.map((p, index) => {
              const isSelected = index === selectedIdx;
              const profileSchedules = schedules.filter(s => 
                p.isDependent ? s.dependentIds?.includes(p.id) : !s.dependentIds?.length
              );
              const completedCount = profileSchedules.filter(s => s.doses.some(d => d.status === 'completed')).length;
              const totalCount = profileSchedules.length;
              const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => handleProfileSwitch(index)}
                  className={`mr-4 p-4 rounded-2xl min-w-36 shadow-sm border-2 ${
                    isSelected 
                      ? "bg-blue-500 border-blue-500 shadow-lg" 
                      : "bg-white border-gray-100"
                  }`}
                  style={{
                    transform: isSelected ? [{ scale: 1.05 }] : [{ scale: 1 }],
                    elevation: isSelected ? 8 : 2,
                  }}
                >
                  <View className="items-center">
                    <View className="relative mb-3">
                      <View
                        className={`w-14 h-14 rounded-full items-center justify-center ${
                          isSelected ? "bg-white/20" : "bg-blue-100"
                        }`}
                      >
                        <Ionicons
                          name="person"
                          size={28}
                          color={isSelected ? "white" : "#3b82f6"}
                        />
                      </View>
                      {p.healthCard && (
                        <View className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full items-center justify-center border-2 border-white">
                          <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                      )}
                    </View>
                    
                    <Text
                      className={`font-bold text-center text-base mb-1 ${
                        isSelected ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {p.name.split(" ")[0]}
                    </Text>
                    
                    <Text
                      className={`text-sm text-center mb-2 ${
                        isSelected ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {p.relation}
                    </Text>

                    {/* Progress Bar */}
                    <View className={`w-full h-2 rounded-full mb-2 ${
                      isSelected ? "bg-white/20" : "bg-gray-200"
                    }`}>
                      <View 
                        className={`h-full rounded-full ${
                          isSelected ? "bg-white" : "bg-blue-500"
                        }`}
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </View>
                    
                    <View
                      className={`px-3 py-1 rounded-full ${
                        isSelected 
                          ? "bg-white/20" 
                          : completionPercentage === 100 
                            ? "bg-green-100" 
                            : completionPercentage > 0 
                              ? "bg-blue-100" 
                              : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected 
                            ? "text-white" 
                            : completionPercentage === 100 
                              ? "text-green-700" 
                              : completionPercentage > 0 
                                ? "text-blue-700" 
                                : "text-gray-600"
                        }`}
                      >
                        {completedCount}/{totalCount} schedules
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            
            {/* Add Dependent Card */}
            <TouchableOpacity
              onPress={() => {
                setShowAddDependentModal(true);
                setCurrentDependentStep(1);
              }}
              className="mr-4 p-4 rounded-2xl min-w-36 shadow-sm border-2 border-dashed border-blue-300 bg-blue-50"
              style={{
                elevation: 2,
              }}
            >
              <View className="items-center">
                <View className="w-14 h-14 rounded-full items-center justify-center bg-blue-100 mb-3">
                  <Ionicons name="person-add" size={28} color="#3b82f6" />
                </View>
                
                <Text className="font-bold text-center text-base mb-1 text-blue-700">
                  Add Member
                </Text>
                
                <Text className="text-sm text-center mb-2 text-blue-600">
                  Family
                </Text>

                {/* Placeholder Progress */}
                <View className="w-full h-2 rounded-full mb-2 bg-blue-200">
                  <View className="h-full rounded-full bg-blue-400" style={{ width: '0%' }} />
                </View>
                
                <View className="px-3 py-1 rounded-full bg-blue-100">
                  <Text className="text-xs font-semibold text-blue-700">
                    Tap to add
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Enhanced Search and Filter */}
        <View className="px-4 pb-4">
          <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-4">
              Search & Filter
            </Text>
            
            <View className="flex-row items-center mb-4 bg-gray-50 rounded-2xl px-4 py-3">
              <Ionicons name="search" size={22} color="#64748b" />
              <TextInput
                className="flex-1 ml-3 text-gray-700 text-base"
                placeholder="Search schedules, vaccines, or providers..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94a3b8"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchQuery("")}
                  className="bg-gray-200 rounded-full p-1"
                >
                  <Ionicons name="close" size={16} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>

            {/* Enhanced Filter chips */}
            <View>
              <Text className="text-sm font-semibold text-gray-600 mb-3">
                Filter by status
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[
                  { key: "all", label: "All", icon: "grid", color: "#6b7280" },
                  { key: "scheduled", label: "Scheduled", icon: "time", color: "#3b82f6" },
                  { key: "overdue", label: "Overdue", icon: "alert-circle", color: "#f59e0b" },
                  { key: "cancelled", label: "Cancelled", icon: "close-circle", color: "#ef4444" },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    onPress={() => setFilterStatus(filter.key)}
                    className={`mr-3 px-4 py-3 rounded-2xl border-2 flex-row items-center ${
                      filterStatus === filter.key
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <Ionicons
                      name={filter.icon as any}
                      size={18}
                      color={filterStatus === filter.key ? "#3b82f6" : filter.color}
                    />
                    <Text
                      className={`ml-2 text-sm font-semibold ${
                        filterStatus === filter.key
                          ? "text-blue-700"
                          : "text-gray-600"
                      }`}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

      <Animated.View 
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        }}
      >
        <ScrollView 
          ref={scrollRef} 
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isSwipeableOpen}
        >
          {/* Enhanced Schedule Cards */}
          {filteredSchedules.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center shadow-sm border border-gray-100">
              <View className="bg-gray-100 rounded-full p-4 mb-4">
                <Ionicons name="calendar" size={48} color="#94a3b8" />
              </View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                No schedules found
              </Text>
              <Text className="text-gray-500 text-center mb-4">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria to find what you\'re looking for'
                  : 'Create your first vaccine schedule to get started'
                }
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  if (searchQuery || filterStatus !== 'all') {
                    setSearchQuery("");
                    setFilterStatus("all");
                  } else {
                    handleCreateSchedule();
                  }
                }}
                className="bg-blue-500 rounded-xl px-6 py-3"
              >
                <Text className="text-white font-semibold">
                  {searchQuery || filterStatus !== 'all' ? 'Clear Filters' : 'Create Schedule'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredSchedules.map((schedule, index) => {
              const completedDoses = schedule.doses.filter(d => d.status === 'completed');
              const cancelledDoses = schedule.doses.filter(d => d.status === 'cancelled');
              const activeDoses = schedule.totalDoses - cancelledDoses.length;
              const nextDose = schedule.doses.find(d => d.status === 'scheduled');
              const isExpanded = expandedSchedules.includes(schedule._id);
              const completionPercentage = scheduleAPI.getCompletionPercentage(schedule);
              const config = scheduleConfig[schedule.overallStatus];
              const daysUntilNext = scheduleAPI.getDaysUntilNextDose(schedule);
              const isOverdue = scheduleAPI.isOverdue(schedule);

              return (
                <Animated.View
                  key={schedule._id}
                  style={{
                    transform: [{
                      scale: cardAnimations.current[schedule._id]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02],
                      }) || 1
                    }],
                    marginBottom: 16,
                  }}
                >
                  <Swipeable
                    renderLeftActions={!isExpanded ? () => renderLeftActions(schedule) : undefined}
                    overshootLeft={false}
                    friction={2}
                    leftThreshold={40}
                    activeOffsetX={[-30, 30]}
                    failOffsetY={[-5, 5]}
                    enabled={!isExpanded}
                    onSwipeableWillOpen={() => setIsSwipeableOpen(true)}
                    onSwipeableClose={() => setIsSwipeableOpen(false)}
                  >
                    <View
                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                    style={{
                      elevation: 4,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                    }}
                  >
                    {/* Card header with gradient accent */}
                    <View
                      className="h-2"
                      style={{ backgroundColor: config.color }}
                    />

                    <TouchableOpacity
                      onPress={() => toggleExpand(schedule._id)}
                      activeOpacity={0.7}
                    >
                    <View className="p-5">
                      <View className="flex-row justify-between items-start mb-4">
                        <View className="flex-row items-center flex-1">
                          <View
                            className="w-14 h-14 rounded-2xl items-center justify-center mr-4 shadow-sm"
                            style={{ backgroundColor: config.bgColor }}
                          >
                            <Ionicons
                              name={config.icon as any}
                              size={28}
                              color={config.color}
                            />
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center mb-2">
                              <Text className="font-bold text-gray-800 text-xl flex-1">
                                {schedule.vaccineName}
                              </Text>
                              <View 
                                className="ml-3 px-3 py-1 rounded-full"
                                style={{ backgroundColor: config.bgColor }}
                              >
                                <Text 
                                  className="text-xs font-medium capitalize"
                                  style={{ color: config.color }}
                                >
                                  {schedule.overallStatus.replace('_', ' ')}
                                </Text>
                              </View>
                            </View>
                            <View className="flex-row items-center mb-1">
                              <Ionicons name="medical" size={14} color="#6b7280" />
                              <Text className="text-sm text-gray-600 ml-1 flex-1">
                                {schedule.healthcareProvider?.name || 'No provider specified'}
                              </Text>
                            </View>
                            {nextDose && (
                              <View className="flex-row items-center">
                                <Ionicons name="calendar" size={14} color="#6b7280" />
                                <Text className={`text-sm ml-1 ${
                                  isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
                                }`}>
                                  {isOverdue 
                                    ? `Overdue by ${Math.abs(daysUntilNext || 0)} days`
                                    : daysUntilNext !== null 
                                      ? `Next dose in ${daysUntilNext} days`
                                      : 'Next dose scheduled'
                                  }
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <View className="items-center ml-3">
                          <CircularProgress
                            percentage={completionPercentage}
                            schedule={schedule}
                            size={60}
                          />
                          <View className="flex-row items-center mt-2 space-x-1">
                            {!isExpanded && (
                              <View className="bg-gray-100 rounded-full p-1">
                                <Ionicons
                                  name="swap-horizontal"
                                  size={12}
                                  color="#9ca3af"
                                />
                              </View>
                            )}
                            <View className="bg-gray-100 rounded-full p-1">
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={16}
                              color="#6b7280"
                            />
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* User Hint */}
                      {!isExpanded && (
                        <View className="mt-3 mb-2 px-2">
                          <View className="flex-row items-center justify-center bg-blue-50 rounded-lg py-2 px-3 border border-blue-100">
                            <Ionicons name="information-circle" size={14} color="#3b82f6" />
                            <Text className="text-xs text-blue-600 ml-2">
                              Swipe → to update • Tap to view doses
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Enhanced Dose indicators */}
                      <View className="bg-gray-50 rounded-2xl p-4">
                        <View className="flex-row items-center justify-between mb-3">
                          <Text className="text-sm font-semibold text-gray-700">
                            Dose Progress
                          </Text>
                          <Text className="text-sm font-bold" style={{ color: config.color }}>
                            {completedDoses.length}/{activeDoses} completed
                          </Text>
                        </View>
                        
                        <View className="flex-row items-center">
                          {Array.from({ length: schedule.totalDoses }, (_, i) => {
                            const dose = schedule.doses[i];
                            const doseConfigItem = doseConfig[dose?.status || 'scheduled'];
                            const isCompleted = dose?.status === 'completed';
                            const isScheduled = dose?.status === 'scheduled';
                            
                            return (
                              <View key={i} className="flex-row items-center">
                                <View
                                  className={`w-8 h-8 rounded-full items-center justify-center ${
                                    isCompleted
                                      ? "border-2"
                                      : isScheduled
                                      ? "border border-dashed"
                                      : "bg-gray-200"
                                  }`}
                                  style={{
                                    backgroundColor: isCompleted
                                      ? doseConfigItem.color
                                      : isScheduled
                                      ? "#fef3c7"
                                      : "#e5e7eb",
                                    borderColor: isCompleted
                                      ? doseConfigItem.color
                                      : isScheduled
                                      ? "#f59e0b"
                                      : "transparent",
                                  }}
                                >
                                  {isCompleted ? (
                                    <Ionicons name="checkmark" size={16} color="white" />
                                  ) : isScheduled ? (
                                    <Ionicons name="time" size={16} color="#f59e0b" />
                                  ) : (
                                    <Text className="text-xs font-bold text-gray-500">{i + 1}</Text>
                                  )}
                                </View>
                                {i < schedule.totalDoses - 1 && (
                                  <View
                                    className="w-4 h-0.5 mx-1"
                                    style={{ backgroundColor: "#e5e7eb" }}
                                  />
                                )}
                              </View>
                            );
                          })}
                        </View>
                        
                        {/* Progress Bar */}
                        <View className="mt-3">
                          <View className="w-full h-2 bg-gray-200 rounded-full">
                            <View
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: config.color,
                                width: `${completionPercentage}%`
                              }}
                            />
                          </View>
                          <Text className="text-xs text-gray-500 mt-1 text-center">
                            {Math.round(completionPercentage)}% complete
                          </Text>
                        </View>
                      </View>
                      </View>
                    </TouchableOpacity>

                      {/* Enhanced Expanded dose details */}
                      {isExpanded && (
                        <View className="mt-4 px-5 pb-5">
                          <Text className="text-lg font-bold text-gray-800 mb-4">
                            Dose Details
                          </Text>
                          <View className="space-y-3">
                            {schedule.doses.map((dose, doseIndex) => {
                              const doseConfigItem = doseConfig[dose.status];
                              const swipeKey = `${schedule._id}-${dose.doseNumber}`;
                              
                              return (
                                <Swipeable
                                  key={dose.doseNumber}
                                  ref={(ref) => { doseSwipeableRefs.current[swipeKey] = ref; }}
                                  renderLeftActions={() => renderLeftDoseActions(schedule, dose)}
                                  renderRightActions={() => renderRightDoseActions(schedule, dose)}
                                  overshootLeft={false}
                                  overshootRight={false}
                                  friction={2}
                                  leftThreshold={40}
                                  rightThreshold={40}
                                  activeOffsetX={[-30, 30]}
                                  failOffsetY={[-5, 5]}
                                  onSwipeableWillOpen={() => setIsSwipeableOpen(true)}
                                  onSwipeableClose={() => setIsSwipeableOpen(false)}
                                >
                                  <View
                                  className={`p-4 rounded-2xl border-2 ${
                                    dose.status === 'completed' 
                                      ? 'bg-white border-green-100 shadow-sm' 
                                      : dose.status === 'scheduled'
                                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                                      : 'bg-yellow-50 border-yellow-200 shadow-sm'
                                  }`}
                                >
                                  <View className="flex-row justify-between items-start mb-4">
                                    <View className="flex-row items-center">
                                      <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                                        dose.status === 'completed' ? 'bg-green-100' : 
                                        dose.status === 'scheduled' ? 'bg-blue-100' : 'bg-yellow-100'
                                      }`}>
                                        <Ionicons 
                                          name={
                                            dose.status === 'completed' ? 'checkmark' :
                                            dose.status === 'scheduled' ? 'calendar' :
                                            dose.status === 'missed' ? 'warning' :
                                            'close'
                                          } 
                                          size={20} 
                                          color={
                                            dose.status === 'completed' ? '#16a34a' :
                                            dose.status === 'scheduled' ? '#3b82f6' :
                                            dose.status === 'missed' ? '#f59e0b' :
                                            '#ef4444'
                                          } 
                                        />
                                      </View>
                                      <View>
                                        <Text className={`text-lg font-bold ${
                                          dose.status === 'completed' ? 'text-gray-800' : 
                                          dose.status === 'scheduled' ? 'text-blue-800' : 'text-yellow-800'
                                        }`}>
                                          Dose {dose.doseNumber}
                                        </Text>
                                        <Text className={`text-sm ${
                                          dose.status === 'completed' ? 'text-green-600' :
                                          dose.status === 'scheduled' ? 'text-blue-600' : 'text-yellow-600'
                                        }`}>
                                          {dose.status.charAt(0).toUpperCase() + dose.status.slice(1)}
                                        </Text>
                                        {(dose.status === 'scheduled' || dose.status === 'missed') && (
                                          <View className="flex-row items-center mt-1 flex-wrap">
                                            <View className="flex-row items-center mr-3">
                                              <Text className="text-xs font-semibold" style={{ color: '#10b981' }}>swipe </Text>
                                              <Ionicons name="arrow-forward" size={10} color="#10b981" />
                                              <Text className="text-xs font-semibold ml-1" style={{ color: '#10b981' }}>to complete</Text>
                                            </View>
                                            <View className="flex-row items-center">
                                              <Text className="text-xs font-semibold" style={{ color: '#ef4444' }}>swipe </Text>
                                              <Ionicons name="arrow-back" size={10} color="#ef4444" />
                                              <Text className="text-xs font-semibold ml-1" style={{ color: '#ef4444' }}>to cancel</Text>
                                            </View>
                                          </View>
                                        )}
                                      </View>
                                    </View>
                                    <View 
                                      className="px-3 py-1 rounded-full"
                                      style={{ backgroundColor: doseConfigItem.bgColor }}
                                    >
                                      <Text 
                                        className="text-xs font-medium capitalize"
                                        style={{ color: doseConfigItem.color }}
                                      >
                                        {dose.status}
                                      </Text>
                                    </View>
                                  </View>
                                  
                                  {/* Enhanced Dose Information Grid */}
                                  <View className="bg-gray-50 rounded-2xl p-4">
                                    <View className="grid grid-cols-2 gap-4">
                                      <View className="flex-row items-center mb-3">
                                        <View className="bg-white rounded-full p-2 mr-3">
                                          <Ionicons name="calendar" size={16} color="#6b7280" />
                                        </View>
                                        <View>
                                          <Text className="text-xs text-gray-500 mb-1">Scheduled</Text>
                                          <Text className={`text-sm font-semibold ${
                                            dose.status === 'completed' ? 'text-gray-800' : 
                                            dose.status === 'scheduled' ? 'text-blue-700' : 'text-yellow-700'
                                          }`}>
                                            {scheduleAPI.formatDate(dose.dateScheduled)}
                                          </Text>
                                        </View>
                                      </View>
                                      
                                      {dose.dateCompleted && (
                                        <View className="flex-row items-center mb-3">
                                          <View className="bg-white rounded-full p-2 mr-3">
                                            <Ionicons name="checkmark-circle" size={16} color="#6b7280" />
                                          </View>
                                          <View>
                                            <Text className="text-xs text-gray-500 mb-1">Completed</Text>
                                            <Text className="text-sm font-semibold text-gray-800">
                                              {scheduleAPI.formatDate(dose.dateCompleted)}
                                            </Text>
                                          </View>
                                        </View>
                                      )}
                                      
                                      {dose.notes && (
                                        <View className="flex-row items-start col-span-2">
                                          <View className="bg-white rounded-full p-2 mr-3 mt-1">
                                            <Ionicons name="document-text" size={16} color="#6b7280" />
                                          </View>
                                          <View className="flex-1">
                                            <Text className="text-xs text-gray-500 mb-1">Notes</Text>
                                            <Text className="text-sm text-gray-700">
                                              {dose.notes}
                                            </Text>
                                          </View>
                                        </View>
                                      )}
                                    </View>
                                  </View>
                                </View>
                                </Swipeable>
                              );
                            })}
                          </View>
                        </View>
                      )}
                    </View>
                  </Swipeable>
                </Animated.View>
              );
            })
          )}

        </ScrollView>
      </Animated.View>


        {/* Enhanced Create Schedule Modal */}
        <AddSchedule
          visible={showCreateModal}
          profile={profile}
          onClose={() => {
            setShowCreateModal(false);
            resetCreateForm();
          }}
          onSubmit={handleCreateScheduleSubmit}
          loading={loading}
          showAlert={showAlert}
          availableVaccines={availableVaccines}
          selectedVaccine={selectedVaccine}
          setSelectedVaccine={setSelectedVaccine}
          vaccineSearchQuery={vaccineSearchQuery}
          setVaccineSearchQuery={setVaccineSearchQuery}
          totalDoses={totalDoses}
          setTotalDoses={setTotalDoses}
          interval={interval}
          setInterval={setInterval}
          scheduleDate={scheduleDate}
          setScheduleDate={setScheduleDate}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          healthcareProvider={healthcareProvider}
          setHealthcareProvider={setHealthcareProvider}
          notes={notes}
          setNotes={setNotes}
          vaccinationType={vaccinationType}
          setVaccinationType={setVaccinationType}
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
        />

        {/* Enhanced Dose Management Modal */}
        <Modal
          visible={showDoseModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDoseModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center">
            <View className="bg-white rounded-3xl mx-6 w-full max-w-sm shadow-xl">
              {selectedDose && (
                <>
              <View className="p-6 border-b border-gray-100">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-2xl bg-blue-100 items-center justify-center mr-4">
                          <Ionicons name="medical" size={24} color="#3b82f6" />
                    </View>
                    <View>
                          <Text className="text-xl font-bold text-gray-800">
                            Dose {selectedDose.doseNumber}
                          </Text>
                      <Text className="text-gray-600 text-sm">
                            {selectedDose.schedule.vaccineName}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                        onPress={() => setShowDoseModal(false)}
                        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                      >
                        <Ionicons name="close" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>
            
                  <View className="p-6">
                    <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                      <Text className="text-sm text-gray-600 text-center">
                        Current status: <Text className="font-semibold capitalize text-gray-800">
                          {selectedDose.schedule.doses.find(d => d.doseNumber === selectedDose.doseNumber)?.status}
                        </Text>
                      </Text>
                </View>

                    <Text className="text-lg font-bold text-gray-800 mb-4">Choose new status:</Text>
                    
                    <View className="space-y-3">
                        <TouchableOpacity
                        onPress={() => handleDoseStatusUpdate(selectedDose.schedule._id, selectedDose.doseNumber, 'completed')}
                        className="bg-green-500 rounded-xl py-4 items-center shadow-sm"
                      >
                        <View className="flex-row items-center">
                          <Ionicons name="checkmark-circle" size={20} color="white" />
                          <Text className="text-white font-semibold ml-2">Completed</Text>
                          </View>
                        </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => handleDoseStatusUpdate(selectedDose.schedule._id, selectedDose.doseNumber, 'scheduled')}
                        className="bg-blue-500 rounded-xl py-4 items-center shadow-sm"
                      >
                        <View className="flex-row items-center">
                          <Ionicons name="calendar" size={20} color="white" />
                          <Text className="text-white font-semibold ml-2">Scheduled</Text>
                        </View>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        onPress={() => handleDoseStatusUpdate(selectedDose.schedule._id, selectedDose.doseNumber, 'missed')}
                        className="bg-yellow-500 rounded-xl py-4 items-center shadow-sm"
                      >
                        <View className="flex-row items-center">
                          <Ionicons name="warning" size={20} color="white" />
                          <Text className="text-white font-semibold ml-2">Missed</Text>
                    </View>
                      </TouchableOpacity>
                      
                    <TouchableOpacity
                        onPress={() => handleDoseStatusUpdate(selectedDose.schedule._id, selectedDose.doseNumber, 'cancelled')}
                        className="bg-red-500 rounded-xl py-4 items-center shadow-sm"
                    >
                      <View className="flex-row items-center">
                          <Ionicons name="close-circle" size={20} color="white" />
                          <Text className="text-white font-semibold ml-2">Cancelled</Text>
                      </View>
                    </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Enhanced Update Schedule Modal */}
                    <Modal
          visible={showUpdateScheduleModal}
                      transparent
                      animationType="slide"
          onRequestClose={() => {
            setShowUpdateScheduleModal(false);
            setSelectedSchedule(null);
            setNewDoseInterval("");
            setDoseIntervals({});
          }}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-5/6">
                          <View className="p-6 border-b border-gray-100">
                            <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-2xl bg-green-100 items-center justify-center mr-4">
                      <Ionicons name="create" size={24} color="#16a34a" />
                            </View>
                    <View>
                      <Text className="text-xl font-bold text-gray-800">Update Schedule</Text>
                      <Text className="text-gray-600 text-sm">
                        Edit {selectedSchedule?.vaccineName || 'this schedule'}
                                      </Text>
                              </View>
                              </View>
                                    <TouchableOpacity
                    onPress={() => {
                      setShowUpdateScheduleModal(false);
                      setSelectedSchedule(null);
                      setNewDoseInterval("");
                      setDoseIntervals({});
                    }}
                    className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
                  >
                    <Ionicons name="close" size={24} color="#64748b" />
                                    </TouchableOpacity>
                              </View>
                            </View>

            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              {/* Schedule Details */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-3">Schedule Details</Text>
                
                <View className="space-y-4">
                  {/* Vaccine Name */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Vaccine Name *</Text>
                    <View className="flex-row items-center bg-gray-50 rounded-lg p-3 border-2 border-gray-200">
                      <Ionicons name="medical" size={20} color="#6b7280" />
                    <TextInput
                        className="flex-1 ml-3 text-gray-800"
                      placeholder="Enter vaccine name"
                      value={updateVaccineName}
                      onChangeText={setUpdateVaccineName}
                      placeholderTextColor="#9ca3af"
                    />
                            </View>
                          </View>

                  {/* Healthcare Provider */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Healthcare Provider (Optional)</Text>
                    <View className="flex-row items-center bg-gray-50 rounded-lg p-3 border-2 border-gray-200">
                      <Ionicons name="person" size={20} color="#6b7280" />
                    <TextInput
                        className="flex-1 ml-3 text-gray-800"
                      placeholder="e.g., Dr. Smith, City Hospital"
                      value={updateHealthcareProvider}
                      onChangeText={setUpdateHealthcareProvider}
                      placeholderTextColor="#9ca3af"
                    />
                        </View>
                  </View>

                  {/* Schedule Date with Native Picker */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">First Dose Date *</Text>
                    <TouchableOpacity
                      onPress={() => setShowUpdateDatePicker(true)}
                      className="bg-gray-50 rounded-lg p-3 flex-row items-center justify-between border-2 border-gray-200"
                    >
                      <View className="flex-row items-center flex-1">
                        <View className="bg-blue-100 rounded-lg p-2 mr-3">
                          <Ionicons name="calendar" size={20} color="#3b82f6" />
                    </View>
                        <Text className={`${updateScheduleDate ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                          {updateScheduleDate ? new Date(updateScheduleDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'Tap to open calendar'}
                        </Text>
                      </View>
                      <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
                    </TouchableOpacity>
                    <Text className="text-xs text-gray-500 mt-1">
                      Tap to open calendar and select first dose date
                    </Text>

                    {/* Native Date Picker for Update */}
                    {showUpdateDatePicker && Platform.OS === 'ios' && (
                    <Modal
                      transparent
                      animationType="slide"
                        visible={showUpdateDatePicker}
                        onRequestClose={() => setShowUpdateDatePicker(false)}
                      >
                        <View className="flex-1 bg-black/50 justify-end">
                          <View className="bg-white rounded-t-3xl p-4">
                            <View className="flex-row justify-between items-center mb-4">
                              <TouchableOpacity onPress={() => setShowUpdateDatePicker(false)}>
                                <Text className="text-blue-500 text-lg">Cancel</Text>
                              </TouchableOpacity>
                              <Text className="text-lg font-semibold text-gray-800">Select Date</Text>
                              <TouchableOpacity onPress={() => setShowUpdateDatePicker(false)}>
                                <Text className="text-blue-500 text-lg font-semibold">Done</Text>
                              </TouchableOpacity>
                            </View>
                            <DateTimePicker
                              value={updateSelectedDate}
                              mode="date"
                              display="spinner"
                              onChange={(_event: any, date?: Date) => {
                                if (date) {
                                  setUpdateSelectedDate(date);
                                  setUpdateScheduleDate(date.toISOString().split('T')[0]);
                                }
                              }}
                              minimumDate={new Date()}
                                          />
                                        </View>
                                      </View>
                      </Modal>
                    )}
                    {showUpdateDatePicker && Platform.OS === 'android' && (
                      <DateTimePicker
                        value={updateSelectedDate}
                        mode="date"
                        display="default"
                        onChange={(_event: any, date?: Date) => {
                          setShowUpdateDatePicker(false);
                          if (date) {
                            setUpdateSelectedDate(date);
                            setUpdateScheduleDate(date.toISOString().split('T')[0]);
                          }
                        }}
                        minimumDate={new Date()}
                      />
                    )}
                            </View>

                  {/* Enhanced Current Doses Section */}
                  {selectedSchedule && (
                    <View className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4 mb-4">
                      {/* Header */}
                      <View className="flex-row items-center justify-between mb-2">
                              <View className="flex-row items-center">
                          <View className="bg-purple-500 rounded-lg p-2 mr-3">
                            <Ionicons name="list" size={20} color="white" />
                              </View>
                  <View>
                            <Text className="text-lg font-bold text-gray-800">Current Doses</Text>
                            <Text className="text-xs text-purple-700">
                              {selectedSchedule.doses.length} dose{selectedSchedule.doses.length !== 1 ? 's' : ''} scheduled
                            </Text>
                            </View>
                          </View>
                  </View>

                      {/* Instructions */}
                      <View className="bg-white/60 rounded-lg p-3 mb-3 border border-purple-200">
                        <View className="flex-row items-start">
                          <Ionicons name="information-circle" size={18} color="#7c3aed" />
                          <View className="flex-1 ml-2">
                            <Text className="text-xs font-semibold text-purple-900 mb-1">How to adjust intervals:</Text>
                            <Text className="text-xs text-gray-700">
                              • First dose uses the schedule date above{'\n'}
                              • Edit interval days to reschedule doses{'\n'}
                              • Changes apply when you click Update Schedule
                              </Text>
                        </View>
                      </View>
                    </View>

                      {/* Doses List */}
                      <View className="space-y-2">
                        {selectedSchedule.doses.map((dose, index) => {
                          const doseStatusConfig = {
                            scheduled: { color: '#3b82f6', bgColor: '#dbeafe', icon: 'calendar', label: 'Scheduled' },
                            completed: { color: '#10b981', bgColor: '#d1fae5', icon: 'checkmark-circle', label: 'Completed' },
                            missed: { color: '#f59e0b', bgColor: '#fef3c7', icon: 'warning', label: 'Missed' },
                            cancelled: { color: '#ef4444', bgColor: '#fee2e2', icon: 'close-circle', label: 'Cancelled' }
                          }[dose.status];

                          const currentInterval = index > 0 ? Math.floor(
                            (new Date(dose.dateScheduled).getTime() - new Date(selectedSchedule.doses[index - 1].dateScheduled).getTime()) 
                            / (1000 * 60 * 60 * 24)
                          ) : 0;

                          return (
                            <View key={dose.doseNumber} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                              {/* Dose Header */}
                              <View className="flex-row items-center justify-between mb-3">
                                <View className="flex-row items-center flex-1">
                                  <View 
                                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                                    style={{ backgroundColor: doseStatusConfig.bgColor }}
                        >
                          <Ionicons 
                                      name={doseStatusConfig.icon as any} 
                            size={20} 
                                      color={doseStatusConfig.color} 
                                    />
                                  </View>
                                  <View className="flex-1">
                                    <Text className="text-base font-bold text-gray-800">Dose {dose.doseNumber}</Text>
                                    <View 
                                      className="px-2 py-1 rounded-full mt-1 self-start"
                                      style={{ backgroundColor: doseStatusConfig.bgColor }}
                                    >
                                      <Text className="text-xs font-semibold" style={{ color: doseStatusConfig.color }}>
                                        {doseStatusConfig.label}
                          </Text>
                                    </View>
                                  </View>
                                </View>
                                <View className="items-end">
                                  <Text className="text-xs text-gray-500 mb-1">Scheduled</Text>
                                  <Text className="text-sm font-bold text-gray-800">
                                    {new Date(dose.dateScheduled).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </Text>
                                </View>
                              </View>

                              {/* Interval Editor (for doses after first) */}
                              {index > 0 && (
                                <View className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-xs font-semibold text-gray-700">Adjust Interval:</Text>
                                    <Text className="text-xs text-gray-500">
                                      Current: {currentInterval} days
                          </Text>
                      </View>
                      
                                  <View className="flex-row items-center">
                                    <Ionicons name="time-outline" size={16} color="#6b7280" />
                    <TextInput
                                      className="flex-1 ml-2 bg-white rounded-lg px-3 py-2 text-sm text-gray-800 border-2 border-blue-200 font-semibold"
                                      placeholder={currentInterval.toString()}
                                      keyboardType="numeric"
                                      value={doseIntervals[dose.doseNumber] || ''}
                                      onChangeText={(text) => {
                                        setDoseIntervals(prev => ({
                                          ...prev,
                                          [dose.doseNumber]: text
                                        }));
                                      }}
                                    />
                                    <Text className="text-sm text-gray-600 ml-2 font-medium">days</Text>
                                  </View>

                                  {/* Preview new date */}
                                  {doseIntervals[dose.doseNumber] && parseInt(doseIntervals[dose.doseNumber]) > 0 && (
                                    <View className="mt-2 bg-blue-50 rounded-lg p-2 border border-blue-200">
                                      <View className="flex-row items-center">
                                        <Ionicons name="arrow-forward" size={14} color="#3b82f6" />
                                        <Text className="text-xs text-blue-700 ml-1 font-semibold">
                                          New date: {(() => {
                                            const prevDate = new Date(selectedSchedule.doses[index - 1].dateScheduled);
                                            const newDate = new Date(prevDate);
                                            newDate.setDate(newDate.getDate() + parseInt(doseIntervals[dose.doseNumber]));
                                            return newDate.toLocaleDateString('en-US', { 
                                              month: 'short', 
                                              day: 'numeric',
                                              year: 'numeric'
                                            });
                                          })()}
                          </Text>
                                      </View>
                                    </View>
                                  )}
                                </View>
                              )}

                              {/* First dose note */}
                              {index === 0 && (
                                <View className="bg-green-50 rounded-lg p-2 border border-green-200">
                                  <View className="flex-row items-center">
                                    <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                                    <Text className="text-xs text-green-700 ml-1 font-medium">
                                      First dose - uses schedule date above
                          </Text>
                      </View>
                    </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Add Another Dose */}
                  {selectedSchedule && (
                    <View className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <View className="flex-row items-center mb-3">
                        <View className="bg-blue-500 rounded-lg p-2">
                          <Ionicons name="add-circle" size={20} color="white" />
                        </View>
                        <View className="ml-3">
                          <Text className="text-base font-semibold text-gray-800">Add Another Dose</Text>
                          <Text className="text-xs text-blue-700">
                            Current: {selectedSchedule.doses.length} doses • Add dose #{selectedSchedule.doses.length + 1}
                    </Text>
                        </View>
                  </View>

                  <View>
                        <Text className="text-sm font-medium text-gray-700 mb-2">
                          Days from last dose *
                        </Text>
                        <View className="flex-row items-center space-x-2">
                          <View className="flex-1 flex-row items-center bg-white rounded-lg p-3 border-2 border-blue-300">
                            <Ionicons name="time" size={20} color="#3b82f6" />
                    <TextInput
                              className="flex-1 ml-2 text-gray-800"
                      placeholder="28"
                              value={newDoseInterval}
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                              onChangeText={setNewDoseInterval}
                    />
                            <Text className="text-gray-500 text-sm">days</Text>
                  </View>
                          <TouchableOpacity
                            onPress={async () => {
                              const customInterval = parseInt(newDoseInterval) || 28;
                              if (customInterval > 0) {
                                const newDoseNumber = selectedSchedule.doses.length + 1;
                                const lastDose = selectedSchedule.doses[selectedSchedule.doses.length - 1];
                                const lastDoseDate = new Date(lastDose.dateScheduled);
                                const newDoseDate = new Date(lastDoseDate);
                                newDoseDate.setDate(newDoseDate.getDate() + customInterval);
                                
                                showAlert(
                                  'Add New Dose',
                                  `This will add Dose ${newDoseNumber} scheduled for ${newDoseDate.toLocaleDateString()}\n\n${customInterval} days after last dose`,
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                      text: 'Add Dose',
                                      onPress: async () => {
                                        try {
                                          setLoading(true);
                                          await scheduleAPI.addDoseToSchedule(
                                            selectedSchedule._id,
                                            customInterval
                                          );
                                          
                                          // Reload schedules to show the new dose
                                          await loadSchedules();
                                          
                                          // Clear the input and close modal
                                          setNewDoseInterval("");
                                          setShowUpdateScheduleModal(false);
                                          setSelectedSchedule(null);
                                          
                                          showAlert('Success', `Dose ${newDoseNumber} added successfully!`, [{ text: 'OK' }], 'success');
                                        } catch (error: any) {
                                          console.error('Error adding dose:', error);
                                          showAlert('Error', error.message || 'Failed to add dose. Please try again.', [{ text: 'OK' }], 'error');
                                        } finally {
                                          setLoading(false);
                                        }
                                      }
                                    }
                                  ],
                                  'question'
                                );
                              } else {
                                showAlert('Error', 'Please enter a valid number of days', [{ text: 'OK' }], 'warning');
                              }
                            }}
                            className="bg-blue-500 rounded-lg px-4 py-3"
                            disabled={loading}
                          >
                            {loading ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <Ionicons name="add" size={20} color="white" />
                            )}
                          </TouchableOpacity>
                        </View>
                    <Text className="text-xs text-gray-500 mt-1">
                          Last dose date: {new Date(selectedSchedule.doses[selectedSchedule.doses.length - 1].dateScheduled).toLocaleDateString()}
                    </Text>
                  </View>
                    </View>
                  )}

                  {/* Notes */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Notes (Optional)</Text>
                    <View className="bg-gray-50 rounded-lg border-2 border-gray-200">
                      <View className="flex-row items-start p-3 border-b border-gray-200">
                        <Ionicons name="document-text" size={20} color="#6b7280" />
                        <Text className="ml-2 text-gray-600 text-sm">Additional information</Text>
                      </View>
                    <TextInput
                        className="p-3 text-gray-800"
                        placeholder="Enter any additional notes about this schedule..."
                      value={updateNotes}
                      onChangeText={setUpdateNotes}
                      multiline
                      numberOfLines={3}
                      placeholderTextColor="#9ca3af"
                        style={{ minHeight: 80 }}
                    />
                  </View>
                </View>
              </View>
                  </View>

              {/* Action Buttons */}
              <View className="flex-row space-x-3 mb-6">
                <TouchableOpacity
                  onPress={() => {
                    setShowUpdateScheduleModal(false);
                    setSelectedSchedule(null);
                    setNewDoseInterval("");
                    setDoseIntervals({});
                  }}
                  className="flex-1 bg-gray-500 rounded-lg py-3 items-center"
                >
                  <Text className="text-white font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUpdateScheduleSubmit}
                  disabled={loading || !updateVaccineName.trim() || !updateScheduleDate}
                  className={`flex-1 rounded-lg py-3 items-center ${
                    loading || !updateVaccineName.trim() || !updateScheduleDate ? 'bg-gray-400' : 'bg-blue-500'
                  }`}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium">Update Schedule</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
        </Modal>

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
                <View className="bg-white rounded-t-3xl overflow-hidden" style={{ maxHeight: '90%' }}>
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
                      {[1, 2].map((step) => (
                        <View key={step} style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{
                            width: step === currentDependentStep ? 36 : 28,
                            height: step === currentDependentStep ? 36 : 28,
                            borderRadius: step === currentDependentStep ? 18 : 14,
                            backgroundColor: step <= currentDependentStep ? 'white' : 'rgba(255,255,255,0.3)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: step === currentDependentStep ? 3 : 0,
                            borderColor: 'rgba(255,255,255,0.5)',
                          }}>
                            {step < currentDependentStep ? (
                              <Ionicons name="checkmark" size={16} color="#10b981" />
                            ) : (
                              <Text style={{
                                fontSize: step === currentDependentStep ? 16 : 14,
                                fontWeight: '700',
                                color: step <= currentDependentStep ? '#3b82f6' : 'rgba(255,255,255,0.7)',
                              }}>
                                {step}
                              </Text>
                            )}
                          </View>
                          {step < 2 && (
                            <View style={{
                              width: 40,
                              height: 2,
                              backgroundColor: step < currentDependentStep ? 'white' : 'rgba(255,255,255,0.3)',
                              marginHorizontal: 8,
                            }} />
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
                              <Ionicons name="person" size={16} color="#3b82f6" />
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
                              <Ionicons name="person-outline" size={16} color="#3b82f6" />
                        </View>
                            <TextInput
                              className="flex-1 text-gray-800 font-medium text-sm"
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
                        <View className="mb-3">
                          <Text className="text-xs font-semibold text-gray-600 mb-1.5 ml-1">
                            DATE OF BIRTH *
                          </Text>
                      <TouchableOpacity
                            onPress={() => setShowDependentDatePicker(true)}
                            className="bg-white rounded-xl p-3 flex-row items-center justify-between border-2 border-blue-100 shadow-sm"
                          >
                            <View className="flex-row items-center flex-1">
                              <View className="w-8 h-8 rounded-lg bg-purple-100 items-center justify-center mr-2.5">
                                <Ionicons name="calendar" size={16} color="#8b5cf6" />
                        </View>
                              <Text className={`font-medium text-sm ${dependentForm.dateOfBirth ? 'text-gray-800' : 'text-gray-400'}`}>
                                {dependentForm.dateOfBirth 
                                  ? new Date(dependentForm.dateOfBirth).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })
                                  : 'Tap to select date'}
                              </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#3b82f6" />
                      </TouchableOpacity>
                      
                          {/* Native Date Picker */}
                          {showDependentDatePicker && Platform.OS === 'ios' && (
                            <Modal
                              transparent
                              animationType="slide"
                              visible={showDependentDatePicker}
                              onRequestClose={() => setShowDependentDatePicker(false)}
                            >
                              <View className="flex-1 bg-black/50 justify-end">
                                <View className="bg-white rounded-t-3xl p-4">
                                  <View className="flex-row justify-between items-center mb-4">
                                    <TouchableOpacity onPress={() => setShowDependentDatePicker(false)}>
                                      <Text className="text-blue-500 text-lg">Cancel</Text>
                                    </TouchableOpacity>
                                    <Text className="text-lg font-semibold text-gray-800">Select Date</Text>
                                    <TouchableOpacity onPress={() => setShowDependentDatePicker(false)}>
                                      <Text className="text-blue-500 text-lg font-semibold">Done</Text>
                      </TouchableOpacity>
                    </View>
                                  <DateTimePicker
                                    value={dependentSelectedDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={(_event: any, date?: Date) => {
                                      if (date) {
                                        setDependentSelectedDate(date);
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
                          {showDependentDatePicker && Platform.OS === 'android' && (
                            <DateTimePicker
                              value={dependentSelectedDate}
                              mode="date"
                              display="default"
                              onChange={(_event: any, date?: Date) => {
                                setShowDependentDatePicker(false);
                                if (date) {
                                  setDependentSelectedDate(date);
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
                    <View>
                          <Text className="text-xs font-semibold text-gray-600 mb-1.5 ml-1">
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
                                  className="flex-1 mx-0.5"
                                >
                                  {isSelected ? (
                                    <LinearGradient
                                      colors={['#3b82f6', '#2563eb']}
                                      start={{ x: 0, y: 0 }}
                                      end={{ x: 0, y: 1 }}
                                      style={{
                                        padding: 10,
                                        borderRadius: 12,
                                        borderWidth: 2,
                                        borderColor: '#3b82f6',
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

                      {/* Summary Preview */}
                      <View className="mb-6">
                        <View className="flex-row items-center mb-3">
                          <View className="w-10 h-10 rounded-xl bg-purple-100 items-center justify-center mr-3">
                            <Ionicons name="eye" size={20} color="#8b5cf6" />
                          </View>
                          <Text className="text-lg font-bold text-gray-800">Review Details</Text>
                        </View>
                        <View className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                          <View className="space-y-2">
                            <View className="flex-row items-center">
                              <Ionicons name="person" size={16} color="#3b82f6" />
                              <Text className="text-sm text-blue-700 ml-2">
                                <Text className="font-bold">Name:</Text> {dependentForm.firstName} {dependentForm.lastName}
                    </Text>
                  </View>
                            <View className="flex-row items-center">
                              <Ionicons name="calendar" size={16} color="#3b82f6" />
                              <Text className="text-sm text-blue-700 ml-2">
                                <Text className="font-bold">DOB:</Text> {dependentForm.dateOfBirth 
                                  ? new Date(dependentForm.dateOfBirth).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })
                                  : 'Not selected'}
                              </Text>
                  </View>
                            <View className="flex-row items-center">
                              <Ionicons name={
                                dependentForm.gender === 'Male' ? 'male' : 
                                dependentForm.gender === 'Female' ? 'female' : 'transgender'
                              } size={16} color="#3b82f6" />
                              <Text className="text-sm text-blue-700 ml-2">
                                <Text className="font-bold">Gender:</Text> {dependentForm.gender || 'Not selected'}
                              </Text>
                </View>
                            <View className="flex-row items-center">
                              <Ionicons name="people" size={16} color="#3b82f6" />
                              <Text className="text-sm text-blue-700 ml-2">
                                <Text className="font-bold">Relationship:</Text> {dependentForm.dependentType || 'Not selected'}
                              </Text>
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
                          loading ? 'bg-gray-300' : currentDependentStep === 2 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{
                          shadowColor: currentDependentStep === 2 ? '#10b981' : '#3b82f6',
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
                              name={currentDependentStep === 2 ? "checkmark-circle" : "arrow-forward"} 
                              size={24} 
                              color="white" 
                            />
                            <Text className="text-white font-bold text-lg ml-2">
                              {currentDependentStep === 2 ? 'Add Family Member' : 'Next Step'}
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
                            name={currentDependentStep === 1 ? "close-circle-outline" : "arrow-back"} 
                            size={22} 
                            color="#6b7280" 
                          />
                          <Text className="text-gray-700 font-semibold text-base ml-2">
                            {currentDependentStep === 1 ? 'Cancel' : 'Previous Step'}
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

        {/* Custom Alert */}
        <CustomAlert
          visible={customAlert.visible}
          title={customAlert.title}
          message={customAlert.message}
          buttons={customAlert.buttons}
          icon={customAlert.icon}
          onClose={() => setCustomAlert(prev => ({ ...prev, visible: false }))}
        />
      </View>
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}
