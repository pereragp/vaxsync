import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  LayoutAnimation,
  UIManager,
  Platform,
  Animated,
  Dimensions,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import scheduleAPI, { VaccineSchedule, CreateScheduleRequest, Vaccine } from '../api/scheduleApi';
import healthCardAPI, { HealthCard } from '../api/healthCardApi';

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
  
  // Sample user IDs - using the same ID from backend for testing
  const [profiles, setProfiles] = useState<Profile[]>([
    {
      id: "68cfcf945e1c53a931fa032e", // Real user ID from backend
      name: "Loading...",
      dob: "1988-08-12",
      relation: "User",
      idNumber: "NIC-19880812",
      lastUpdated: "2025-08-20",
      isDependent: false,
    },
  ]);

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
  const [healthcareProvider, setHealthcareProvider] = useState("");
  const [notes, setNotes] = useState("");
  const [vaccinationType, setVaccinationType] = useState<'routine' | 'travel' | 'occupational' | 'emergency'>('routine');
  
  // Enhanced date picker state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDosePicker, setShowDosePicker] = useState(false);

  // Update schedule form state
  const [updateVaccineName, setUpdateVaccineName] = useState("");
  const [updateHealthcareProvider, setUpdateHealthcareProvider] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [updateScheduleDate, setUpdateScheduleDate] = useState("");
  const [updateInterval, setUpdateInterval] = useState("");

  // Animations
  const cardAnimations = useRef<{[key: string]: Animated.Value}>({});
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const progressAnimations = useRef<{[key: string]: Animated.Value}>({});
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load health card data to get user profiles
  const loadHealthCardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = "68cfcf945e1c53a931fa032e"; // Real user ID from backend
      const allHealthCards = await healthCardAPI.getAllHealthCards(userId);
      
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
        Alert.alert(
          'No Health Cards Found',
          'No health cards exist for this user. Would you like to create them?',
          [
            { 
              text: 'Cancel', 
              style: 'cancel' 
            },
            { 
              text: 'Create Health Cards', 
              onPress: () => createAllHealthCards()
            }
          ]
        );
      } else {
        setError(error.message || 'Failed to load health cards');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create all health cards for user and dependents
  const createAllHealthCards = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = "68cfcf945e1c53a931fa032e"; // Real user ID from backend
      await healthCardAPI.createAllHealthCards(userId);
      
      // Reload all health cards after creation
      await loadHealthCardData();

      Alert.alert(
        'Success',
        'Health cards created successfully for user and dependents.',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('Error creating all health cards:', error);
      setError(error.message || 'Failed to create health cards');
      Alert.alert(
        'Error Creating Health Cards',
        error.message || 'Failed to create health cards. Please try again.',
        [{ text: 'OK' }]
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
      Alert.alert('Error', 'Failed to load available vaccines');
    }
  };

  const handleCreateSchedule = () => {
    setShowCreateModal(true);
    loadAvailableVaccines();
  };

  const handleCreateScheduleSubmit = async () => {
    try {
      setLoading(true);

      // Validate form
      const vaccineName = selectedVaccine?.name || vaccineSearchQuery.trim();
      if (!vaccineName) {
        Alert.alert('Error', 'Please select a vaccine or enter a vaccine name');
        return;
      }

      if (!scheduleDate) {
        Alert.alert('Error', 'Please select a schedule date');
        return;
      }

      const totalDosesNum = parseInt(totalDoses);
      const intervalNum = parseInt(interval);

      if (totalDosesNum < 1) {
        Alert.alert('Error', 'Total doses must be at least 1');
        return;
      }

      if (totalDosesNum > 1 && intervalNum < 0) {
        Alert.alert('Error', 'Interval must be non-negative for multiple doses');
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

      Alert.alert('Success', 'Vaccine schedule created successfully!');

    } catch (error: any) {
      console.error('Error creating schedule:', error);
      Alert.alert('Error', error.message || 'Failed to create schedule');
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
    setHealthcareProvider("");
    setNotes("");
    setVaccinationType('routine');
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedDay(new Date().getDate());
    setShowDatePicker(false);
    setShowDosePicker(false);
  };

  // Helper functions for date handling
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const formatDateForDisplay = (year: number, month: number, day: number) => {
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const formatDateForAPI = (year: number, month: number, day: number) => {
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  const handleDateSelection = () => {
    const formattedDate = formatDateForAPI(selectedYear, selectedMonth, selectedDay);
    setScheduleDate(formattedDate);
    setShowDatePicker(false);
  };

  // Generate arrays for picker options
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];
  const doseOptions = Array.from({ length: 5 }, (_, i) => (i + 1).toString());

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
          Alert.alert(
            'Schedule Completed! 🎉', 
            `All doses completed! Redirecting to view your vaccination records and post-vaccination instructions.`,
            [{ 
              text: 'View Records', 
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
            }]
          );
        } else {
          Alert.alert(
            'Dose Completed! ✅', 
            `Dose ${doseNumber} marked as completed! Redirecting to view post-vaccination instructions.`,
            [{ 
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
            }]
          );
        }
      } else {
        Alert.alert('Success', `Dose ${doseNumber} marked as ${newStatus} successfully!`);
      }
      
      setShowDoseModal(false);
      setSelectedDose(null);

    } catch (error: any) {
      console.error('Error updating dose status:', error);
      Alert.alert('Error', error.message || 'Failed to update dose status');
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
    
    setUpdateInterval(schedule.interval.toString());
    setShowUpdateScheduleModal(true);
  };

  const handleUpdateScheduleSubmit = async () => {
    if (!selectedSchedule) return;

    try {
      setLoading(true);

      const updateData = {
        vaccineName: updateVaccineName.trim(),
        healthcareProvider: updateHealthcareProvider.trim() ? { name: updateHealthcareProvider.trim() } : undefined,
        notes: updateNotes.trim() || undefined,
        scheduleDate: updateScheduleDate,
        interval: parseInt(updateInterval),
      };

      await scheduleAPI.updateSchedule(selectedSchedule._id, updateData);

      // Reload schedules
      await loadSchedules();

      // Reset form
      setSelectedSchedule(null);
      setUpdateVaccineName("");
      setUpdateHealthcareProvider("");
      setUpdateNotes("");
      setUpdateScheduleDate("");
      setUpdateInterval("");

      // Close modal
      setShowUpdateScheduleModal(false);

      Alert.alert('Success', 'Schedule updated successfully!');

    } catch (error: any) {
      console.error('Error updating schedule:', error);
      Alert.alert('Error', error.message || 'Failed to update schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string, vaccineName: string) => {
    Alert.alert(
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
              Alert.alert('Success', 'Schedule deleted successfully!');
            } catch (error: any) {
              console.error('Error deleting schedule:', error);
              Alert.alert('Error', error.message || 'Failed to delete schedule');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Calculate stats for progress display based on dose status
  const scheduleStats = {
    total: schedules.length,
    scheduled: schedules.filter(s => s.doses.some(d => d.status === 'scheduled')).length,
    completed: schedules.filter(s => s.doses.some(d => d.status === 'completed')).length,
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
      // Check if any dose in the schedule matches the filter status
      const hasMatchingDose = schedule.doses.some(dose => dose.status === filterStatus);
      matchesFilter = hasMatchingDose;
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
    const totalDoses = schedule.totalDoses;

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
            {completedDoses}/{totalDoses}
          </Text>
        </View>
      </View>
    );
  };

  return (
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
            <View className="flex-row items-center mb-2">
              <Ionicons name="calendar" size={20} color="white" />
              <Text className="text-white/90 text-sm font-medium ml-2">Total</Text>
            </View>
            <Text className="text-2xl font-bold text-white">{scheduleStats.total}</Text>
            <Text className="text-white/70 text-xs">schedules</Text>
          </View>
          
          <View className="bg-white/15 rounded-2xl p-4 flex-1 mx-1 backdrop-blur-sm">
            <View className="flex-row items-center mb-2">
              <Ionicons name="time" size={20} color="white" />
              <Text className="text-white/90 text-sm font-medium ml-2">Scheduled</Text>
            </View>
            <Text className="text-2xl font-bold text-white">{scheduleStats.scheduled}</Text>
            <Text className="text-white/70 text-xs">upcoming</Text>
          </View>
          
          <View className="bg-white/15 rounded-2xl p-4 flex-1 mx-1 backdrop-blur-sm">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text className="text-white/90 text-sm font-medium ml-2">Completed</Text>
            </View>
            <Text className="text-2xl font-bold text-white">{scheduleStats.completed}</Text>
            <Text className="text-white/70 text-xs">finished</Text>
          </View>
          
          <View className="bg-white/15 rounded-2xl p-4 flex-1 ml-2 backdrop-blur-sm">
            <View className="flex-row items-center mb-2">
              <Ionicons name="warning" size={20} color="white" />
              <Text className="text-white/90 text-sm font-medium ml-2">Missed</Text>
            </View>
            <Text className="text-2xl font-bold text-white">{scheduleStats.missed}</Text>
            <Text className="text-white/70 text-xs">overdue</Text>
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
                  {error.includes('No health cards found') && (
                    <TouchableOpacity
                      onPress={createAllHealthCards}
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
          <Text className="text-lg font-bold text-gray-800 mb-4 px-4">
            Profiles
          </Text>
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
                  { key: "completed", label: "Completed", icon: "checkmark-circle", color: "#10b981" },
                  { key: "missed", label: "Missed", icon: "warning", color: "#f59e0b" },
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
                  <TouchableOpacity
                    onPress={() => toggleExpand(schedule._id)}
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
                          <View className="bg-gray-100 rounded-full p-1 mt-2">
                            <Ionicons
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={16}
                              color="#6b7280"
                            />
                          </View>
                        </View>
                      </View>

                      {/* Enhanced Dose indicators */}
                      <View className="bg-gray-50 rounded-2xl p-4">
                        <View className="flex-row items-center justify-between mb-3">
                          <Text className="text-sm font-semibold text-gray-700">
                            Dose Progress
                          </Text>
                          <Text className="text-sm font-bold" style={{ color: config.color }}>
                            {completedDoses.length}/{schedule.totalDoses} completed
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

                      {/* Enhanced Expanded dose details */}
                      {isExpanded && (
                        <View className="mt-4">
                          <Text className="text-lg font-bold text-gray-800 mb-4">
                            Dose Details
                          </Text>
                          <View className="space-y-3">
                            {schedule.doses.map((dose, doseIndex) => {
                              const doseConfigItem = doseConfig[dose.status];
                              
                              return (
                                <TouchableOpacity
                                  key={dose.doseNumber}
                                  onPress={() => handleDosePress(schedule, dose.doseNumber)}
                                  className={`p-4 rounded-2xl border-2 ${
                                    dose.status === 'completed' 
                                      ? 'bg-white border-green-100 shadow-sm' 
                                      : dose.status === 'scheduled'
                                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                                      : 'bg-yellow-50 border-yellow-200 shadow-sm'
                                  }`}
                                  style={{
                                    opacity: cardAnimations.current[schedule._id]?.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0, 1],
                                    }) || 1,
                                    transform: [{
                                      translateY: cardAnimations.current[schedule._id]?.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [20, 0],
                                      }) || 0
                                    }],
                                  }}
                                  activeOpacity={0.7}
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
                                        <Text className="text-xs text-gray-500 mt-1">(Tap to update)</Text>
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
                                </TouchableOpacity>
                              );
                            })}
                            
                            {/* Enhanced Action buttons */}
                            <View className="flex-row space-x-3 mt-6">
                              <TouchableOpacity
                                onPress={() => handleUpdateSchedule(schedule)}
                                className="flex-1 bg-blue-500 rounded-xl py-3 items-center shadow-sm"
                              >
                                <Text className="text-white font-semibold">Update Schedule</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleDeleteSchedule(schedule._id, schedule.vaccineName)}
                                className="flex-1 bg-red-500 rounded-xl py-3 items-center shadow-sm"
                              >
                                <Text className="text-white font-semibold">Delete</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}

        </ScrollView>
      </Animated.View>

        {/* Enhanced Floating Action Buttons - Float in View */}
        <View className="absolute right-4 z-50" style={{ bottom: 120 }}>
          <View className="bg-white rounded-3xl p-2 shadow-xl border border-gray-100">
            <TouchableOpacity
              onPress={handleCreateSchedule}
              className="w-16 h-16 bg-blue-600 rounded-2xl shadow-lg items-center justify-center"
              style={{
                elevation: 8,
                shadowColor: "#3b82f6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Create Schedule Modal */}
        <Modal
          visible={showCreateModal}
          transparent
          animationType="slide"
          onRequestClose={() => {
            setShowCreateModal(false);
            resetCreateForm();
          }}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-5/6">
              <View className="p-6 border-b border-gray-100">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-2xl bg-blue-100 items-center justify-center mr-4">
                      <Ionicons name="calendar" size={24} color="#3b82f6" />
                    </View>
                    <View>
                      <Text className="text-xl font-bold text-gray-800">Create Vaccine Schedule</Text>
                      <Text className="text-gray-600 text-sm">
                        New schedule for {profile?.name || 'selected user'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => {
                      setShowCreateModal(false);
                      resetCreateForm();
                    }}
                    className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
                  >
                    <Ionicons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>
            
            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              {/* Vaccine Selection */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-3">Vaccine Selection</Text>
                
                {/* Search Input */}
                <View className="mb-4">
                  <TextInput
                    className="bg-gray-50 rounded-lg p-3 text-gray-800"
                    placeholder="Search vaccines or type custom vaccine name..."
                    value={vaccineSearchQuery}
                    onChangeText={(text) => {
                      setVaccineSearchQuery(text);
                      // Clear selected vaccine if user is typing
                      if (text && selectedVaccine) {
                        setSelectedVaccine(null);
                      }
                    }}
                    placeholderTextColor="#9ca3af"
                  />
                </View>

                {/* Vaccine List */}
                {(vaccineSearchQuery || availableVaccines.length > 0) && (
                  <ScrollView className="max-h-40 bg-gray-50 rounded-lg">
                    {availableVaccines
                      .filter(vaccine => 
                        !vaccineSearchQuery || 
                        vaccine.name.toLowerCase().includes(vaccineSearchQuery.toLowerCase()) ||
                        vaccine.description.toLowerCase().includes(vaccineSearchQuery.toLowerCase())
                      )
                      .map((vaccine) => (
                        <TouchableOpacity
                          key={vaccine._id}
                          onPress={() => {
                            setSelectedVaccine(vaccine);
                            setVaccineSearchQuery(vaccine.name);
                          }}
                          className={`p-3 border-b border-gray-200 ${
                            selectedVaccine?._id === vaccine._id ? 'bg-blue-50' : 'bg-white'
                          }`}
                        >
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                              <Text className="font-medium text-gray-800">{vaccine.name}</Text>
                              <Text className="text-sm text-gray-600">{vaccine.description}</Text>
                              <View className="flex-row items-center mt-1">
                                <View 
                                  className="px-2 py-1 rounded-full mr-2"
                                  style={{ backgroundColor: vaccineTypeConfig[vaccine.type]?.bgColor || '#f3f4f6' }}
                                >
                                  <Text 
                                    className="text-xs font-medium capitalize"
                                    style={{ color: vaccineTypeConfig[vaccine.type]?.color || '#6b7280' }}
                                  >
                                    {vaccine.type}
                                  </Text>
                                </View>
                                {vaccine.manufacturer && (
                                  <Text className="text-xs text-gray-500">{vaccine.manufacturer}</Text>
                                )}
                              </View>
                            </View>
                            {selectedVaccine?._id === vaccine._id && (
                              <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                )}

                {/* Selected Vaccine Display */}
                {selectedVaccine && (
                  <View className="bg-blue-50 rounded-lg p-3 mt-2">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="font-medium text-blue-800">{selectedVaccine.name}</Text>
                        <Text className="text-sm text-blue-600">{selectedVaccine.description}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedVaccine(null);
                          setVaccineSearchQuery("");
                        }}
                        className="ml-2"
                      >
                        <Ionicons name="close-circle" size={20} color="#3b82f6" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {/* Schedule Details */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-3">Schedule Details</Text>
                
                <View className="space-y-4">
                  {/* Enhanced Schedule Date Picker */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Schedule Date *</Text>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      className="bg-gray-50 rounded-lg p-3 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="calendar" size={20} color="#6b7280" />
                        <Text className="ml-2 text-gray-800">
                          {scheduleDate ? formatDateForDisplay(selectedYear, selectedMonth, selectedDay) : 'Select date'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>
                    <Text className="text-xs text-gray-500 mt-1">
                      Date for the first dose
                    </Text>

                    {/* Date Picker Modal */}
                    <Modal
                      visible={showDatePicker}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setShowDatePicker(false)}
                    >
                      <View className="flex-1 bg-black/50 justify-center items-center">
                        <View className="bg-white rounded-3xl mx-6 w-full max-w-sm shadow-xl">
                          <View className="p-6 border-b border-gray-100">
                            <View className="flex-row justify-between items-center">
                              <Text className="text-xl font-bold text-gray-800">Select Date</Text>
                              <TouchableOpacity 
                                onPress={() => setShowDatePicker(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                              >
                                <Ionicons name="close" size={20} color="#64748b" />
                              </TouchableOpacity>
                            </View>
                          </View>
                          
                          <View className="p-6">
                            <View className="flex-row justify-between mb-6">
                              {/* Year Picker */}
                              <View className="flex-1 mr-2">
                                <Text className="text-sm font-medium text-gray-700 mb-2">Year</Text>
                                <ScrollView className="h-32 bg-gray-50 rounded-lg">
                                  {years.map((year) => (
                                    <TouchableOpacity
                                      key={year}
                                      onPress={() => setSelectedYear(year)}
                                      className={`p-3 border-b border-gray-200 ${
                                        selectedYear === year ? 'bg-blue-100' : 'bg-white'
                                      }`}
                                    >
                                      <Text className={`text-center font-medium ${
                                        selectedYear === year ? 'text-blue-700' : 'text-gray-800'
                                      }`}>
                                        {year}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </View>

                              {/* Month Picker */}
                              <View className="flex-1 mr-2">
                                <Text className="text-sm font-medium text-gray-700 mb-2">Month</Text>
                                <ScrollView className="h-32 bg-gray-50 rounded-lg">
                                  {months.map((month) => (
                                    <TouchableOpacity
                                      key={month.value}
                                      onPress={() => setSelectedMonth(month.value)}
                                      className={`p-2 border-b border-gray-200 ${
                                        selectedMonth === month.value ? 'bg-blue-100' : 'bg-white'
                                      }`}
                                    >
                                      <Text className={`text-center text-xs font-medium ${
                                        selectedMonth === month.value ? 'text-blue-700' : 'text-gray-800'
                                      }`}>
                                        {month.label}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </View>

                              {/* Day Picker */}
                              <View className="flex-1">
                                <Text className="text-sm font-medium text-gray-700 mb-2">Day</Text>
                                <ScrollView className="h-32 bg-gray-50 rounded-lg">
                                  {Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1).map((day) => (
                                    <TouchableOpacity
                                      key={day}
                                      onPress={() => setSelectedDay(day)}
                                      className={`p-3 border-b border-gray-200 ${
                                        selectedDay === day ? 'bg-blue-100' : 'bg-white'
                                      }`}
                                    >
                                      <Text className={`text-center font-medium ${
                                        selectedDay === day ? 'text-blue-700' : 'text-gray-800'
                                      }`}>
                                        {day}
                                      </Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </View>
                            </View>

                            <View className="flex-row space-x-3">
                              <TouchableOpacity
                                onPress={() => setShowDatePicker(false)}
                                className="flex-1 bg-gray-500 rounded-lg py-3 items-center"
                              >
                                <Text className="text-white font-medium">Cancel</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={handleDateSelection}
                                className="flex-1 bg-blue-500 rounded-lg py-3 items-center"
                              >
                                <Text className="text-white font-medium">Select</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    </Modal>
                  </View>

                  {/* Enhanced Total Doses Selector */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Total Doses *</Text>
                    <TouchableOpacity
                      onPress={() => setShowDosePicker(true)}
                      className="bg-gray-50 rounded-lg p-3 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="medical" size={20} color="#6b7280" />
                        <Text className="ml-2 text-gray-800">
                          {totalDoses} {totalDoses === "1" ? 'dose' : 'doses'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-down" size={20} color="#6b7280" />
                    </TouchableOpacity>
                    <Text className="text-xs text-gray-500 mt-1">
                      Number of doses required for this vaccine (1-5)
                    </Text>

                    {/* Dose Picker Modal */}
                    <Modal
                      visible={showDosePicker}
                      transparent
                      animationType="slide"
                      onRequestClose={() => setShowDosePicker(false)}
                    >
                      <View className="flex-1 bg-black/50 justify-center items-center">
                        <View className="bg-white rounded-3xl mx-6 w-full max-w-sm shadow-xl">
                          <View className="p-6 border-b border-gray-100">
                            <View className="flex-row justify-between items-center">
                              <Text className="text-xl font-bold text-gray-800">Select Total Doses</Text>
                              <TouchableOpacity 
                                onPress={() => setShowDosePicker(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                              >
                                <Ionicons name="close" size={20} color="#64748b" />
                              </TouchableOpacity>
                            </View>
                          </View>
                          
                          <View className="p-6">
                            <View className="mb-6">
                              <ScrollView className="h-40 bg-gray-50 rounded-lg">
                                {doseOptions.map((dose) => (
                                  <TouchableOpacity
                                    key={dose}
                                    onPress={() => {
                                      setTotalDoses(dose);
                                      setShowDosePicker(false);
                                    }}
                                    className={`p-4 border-b border-gray-200 ${
                                      totalDoses === dose ? 'bg-blue-100' : 'bg-white'
                                    }`}
                                  >
                                    <View className="flex-row items-center justify-between">
                                      <View className="flex-row items-center">
                                        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                                          totalDoses === dose ? 'bg-blue-500' : 'bg-gray-200'
                                        }`}>
                                          <Ionicons 
                                            name="medical" 
                                            size={16} 
                                            color={totalDoses === dose ? 'white' : '#6b7280'} 
                                          />
                                        </View>
                                        <Text className={`font-medium ${
                                          totalDoses === dose ? 'text-blue-700' : 'text-gray-800'
                                        }`}>
                                          {dose} {dose === "1" ? 'dose' : 'doses'}
                                        </Text>
                                      </View>
                                      {totalDoses === dose && (
                                        <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                                      )}
                                    </View>
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>
                            </View>

                            {/* Custom Input Option */}
                            <View className="mb-4">
                              <Text className="text-sm font-medium text-gray-700 mb-2">Or enter custom number:</Text>
                              <View className="flex-row items-center">
                                <TextInput
                                  className="flex-1 bg-gray-50 rounded-lg p-3 text-gray-800 mr-2"
                                  placeholder="Enter number"
                                  value={totalDoses}
                                  onChangeText={setTotalDoses}
                                  keyboardType="numeric"
                                  placeholderTextColor="#9ca3af"
                                />
                                <TouchableOpacity
                                  onPress={() => setShowDosePicker(false)}
                                  className="bg-blue-500 rounded-lg px-4 py-3"
                                >
                                  <Text className="text-white font-medium">Done</Text>
                                </TouchableOpacity>
                              </View>
                            </View>

                            <TouchableOpacity
                              onPress={() => setShowDosePicker(false)}
                              className="w-full bg-gray-500 rounded-lg py-3 items-center"
                            >
                              <Text className="text-white font-medium">Cancel</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </Modal>
                  </View>

                  {/* Enhanced Interval - Only show if doses > 1 */}
                  {parseInt(totalDoses) > 1 && (
                    <View>
                      <Text className="text-sm font-medium text-gray-700 mb-2">Interval (Days) *</Text>
                      <View className="flex-row items-center">
                        <TextInput
                          className="flex-1 bg-gray-50 rounded-lg p-3 text-gray-800 mr-2"
                          placeholder="28"
                          value={interval}
                          onChangeText={setInterval}
                          keyboardType="numeric"
                          placeholderTextColor="#9ca3af"
                        />
                        <View className="flex-row space-x-1">
                          {["7", "14", "28", "30"].map((days) => (
                            <TouchableOpacity
                              key={days}
                              onPress={() => setInterval(days)}
                              className={`px-3 py-2 rounded-lg ${
                                interval === days ? 'bg-blue-500' : 'bg-gray-200'
                              }`}
                            >
                              <Text className={`text-xs font-medium ${
                                interval === days ? 'text-white' : 'text-gray-700'
                              }`}>
                                {days}d
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                      <Text className="text-xs text-gray-500 mt-1">
                        Days between doses • Quick select: 7d, 14d, 28d, 30d
                      </Text>
                    </View>
                  )}

                  {/* Enhanced Vaccination Type */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Vaccination Type *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                      {[
                        { value: 'routine', label: 'Routine', icon: 'shield-checkmark', desc: 'Regular vaccines' },
                        { value: 'travel', label: 'Travel', icon: 'airplane', desc: 'Travel vaccines' },
                        { value: 'occupational', label: 'Work', icon: 'briefcase', desc: 'Work related' },
                        { value: 'emergency', label: 'Emergency', icon: 'medical', desc: 'Emergency vaccines' }
                      ].map((type) => (
                        <TouchableOpacity
                          key={type.value}
                          onPress={() => setVaccinationType(type.value as any)}
                          className={`mr-3 px-4 py-3 rounded-xl border-2 min-w-24 ${
                            vaccinationType === type.value
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <View className="items-center">
                            <View className={`w-8 h-8 rounded-full items-center justify-center mb-2 ${
                              vaccinationType === type.value ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <Ionicons 
                                name={type.icon as any} 
                                size={16} 
                                color={vaccinationType === type.value ? '#3b82f6' : '#6b7280'} 
                              />
                            </View>
                            <Text className={`text-sm font-medium text-center ${
                              vaccinationType === type.value ? 'text-blue-700' : 'text-gray-600'
                            }`}>
                              {type.label}
                            </Text>
                            <Text className={`text-xs text-center mt-1 ${
                              vaccinationType === type.value ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              {type.desc}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Text className="text-xs text-gray-500">
                      Select the category of vaccination
                    </Text>
                  </View>

                  {/* Healthcare Provider */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Healthcare Provider (Optional)</Text>
                    <TextInput
                      className="bg-gray-50 rounded-lg p-3 text-gray-800"
                      placeholder="e.g., Dr. Smith, City Hospital"
                      value={healthcareProvider}
                      onChangeText={setHealthcareProvider}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {/* Notes */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Notes (Optional)</Text>
                    <TextInput
                      className="bg-gray-50 rounded-lg p-3 text-gray-800"
                      placeholder="Additional notes about this schedule..."
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={3}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
              </View>

              {/* Schedule Preview */}
              {selectedVaccine && scheduleDate && totalDoses && (
                <View className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <Text className="text-sm font-medium text-blue-800 mb-2">Schedule Preview</Text>
                  <View className="space-y-1">
                    <Text className="text-sm text-blue-700">
                      • <Text className="font-medium">{selectedVaccine.name}</Text>
                    </Text>
                    <Text className="text-sm text-blue-700">
                      • <Text className="font-medium">{totalDoses} dose{totalDoses !== "1" ? 's' : ''}</Text>
                      {parseInt(totalDoses) > 1 && (
                        <Text> • Every {interval} days</Text>
                      )}
                    </Text>
                    <Text className="text-sm text-blue-700">
                      • <Text className="font-medium">Start:</Text> {formatDateForDisplay(selectedYear, selectedMonth, selectedDay)}
                    </Text>
                    <Text className="text-sm text-blue-700">
                      • <Text className="font-medium">Type:</Text> {vaccinationType.charAt(0).toUpperCase() + vaccinationType.slice(1)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View className="flex-row space-x-3 mb-6">
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="flex-1 bg-gray-500 rounded-lg py-3 items-center"
                >
                  <Text className="text-white font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateScheduleSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-500 rounded-lg py-3 items-center"
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-medium">Create Schedule</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
                    <TextInput
                      className="bg-gray-50 rounded-lg p-3 text-gray-800"
                      placeholder="Enter vaccine name"
                      value={updateVaccineName}
                      onChangeText={setUpdateVaccineName}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {/* Healthcare Provider */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Healthcare Provider (Optional)</Text>
                    <TextInput
                      className="bg-gray-50 rounded-lg p-3 text-gray-800"
                      placeholder="e.g., Dr. Smith, City Hospital"
                      value={updateHealthcareProvider}
                      onChangeText={setUpdateHealthcareProvider}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  {/* Schedule Date */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Schedule Date *</Text>
                    <View className="flex-row items-center bg-gray-50 rounded-lg p-3">
                      <TextInput
                        className="flex-1 text-gray-800"
                        placeholder="YYYY-MM-DD"
                        value={updateScheduleDate}
                        onChangeText={setUpdateScheduleDate}
                        placeholderTextColor="#9ca3af"
                      />
                      <TouchableOpacity
                        onPress={() => {
                          const today = new Date();
                          const formattedDate = today.toISOString().split('T')[0];
                          setUpdateScheduleDate(formattedDate);
                        }}
                        className="ml-2 bg-blue-500 rounded px-3 py-1"
                      >
                        <Text className="text-white text-sm">Today</Text>
                      </TouchableOpacity>
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">
                      Date for the first dose
                    </Text>
                  </View>

                  {/* Interval */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Interval (Days) *</Text>
                    <TextInput
                      className="bg-gray-50 rounded-lg p-3 text-gray-800"
                      placeholder="28"
                      value={updateInterval}
                      onChangeText={setUpdateInterval}
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                    />
                    <Text className="text-xs text-gray-500 mt-1">
                      Days between each dose
                    </Text>
                  </View>

                  {/* Notes */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Notes (Optional)</Text>
                    <TextInput
                      className="bg-gray-50 rounded-lg p-3 text-gray-800"
                      placeholder="Additional notes about this schedule..."
                      value={updateNotes}
                      onChangeText={setUpdateNotes}
                      multiline
                      numberOfLines={3}
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row space-x-3 mb-6">
                <TouchableOpacity
                  onPress={() => {
                    setShowUpdateScheduleModal(false);
                    setSelectedSchedule(null);
                  }}
                  className="flex-1 bg-gray-500 rounded-lg py-3 items-center"
                >
                  <Text className="text-white font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUpdateScheduleSubmit}
                  disabled={loading || !updateVaccineName.trim() || !updateScheduleDate || !updateInterval}
                  className={`flex-1 rounded-lg py-3 items-center ${
                    loading || !updateVaccineName.trim() || !updateScheduleDate || !updateInterval ? 'bg-gray-400' : 'bg-blue-500'
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
      </View>
    </SafeAreaView>
  );
}
