import React, { useState, useRef, useEffect } from "react";
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
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { useLocalSearchParams } from "expo-router";
import healthCardAPI, {
  HealthCard,
  HealthCardVaccination,
} from "../api/healthCardApi";
import {
  downloadAsync,
  documentDirectory,
  cacheDirectory,
} from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const API_BASE_URL = "http://192.168.1.32:5000";
import InstructionsPopup from "../components/InstructionsPopup";
import CustomAlert from "../components/CustomAlert";
import geminiAPI from "../api/geminiApi";
import userAPI from "../api/userApi";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface VaccineDose {
  doseNumber: number;
  date: string;
  batch: string;
  provider: string;
  verified: boolean;
  facility?: string;
  notes?: string;
  status?: "completed" | "cancelled" | "pending";
}

interface Vaccine {
  id: string;
  name: string;
  doses: VaccineDose[];
  totalDoses: number;
  type: "routine" | "travel" | "occupational" | "emergency";
  icon: string;
}

interface Profile {
  id: string;
  name: string;
  dob: string;
  relation: string;
  idNumber: string;
  lastUpdated: string;
  vaccines: Vaccine[];
  avatar?: string;
  healthCard?: HealthCard;
  isDependent?: boolean;
  dependentId?: string;
}

const { width } = Dimensions.get("window");

// Vaccine type configurations
const vaccineConfig = {
  routine: { color: "#10b981", bgColor: "#d1fae5", icon: "shield-checkmark" },
  travel: { color: "#3b82f6", bgColor: "#dbeafe", icon: "airplane" },
  occupational: { color: "#f59e0b", bgColor: "#fef3c7", icon: "briefcase" },
  emergency: { color: "#ef4444", bgColor: "#fee2e2", icon: "medical" },
};

export default function VaxCardScreen() {
  const params = useLocalSearchParams();

  // User state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const profile = profiles[selectedIdx] || null;
  const scrollRef = useRef<ScrollView>(null);

  const [expandedVaccines, setExpandedVaccines] = useState<string[]>([]);
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState<Vaccine | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Instructions popup state
  const [showInstructionsPopup, setShowInstructionsPopup] = useState(false);
  const [instructionsData, setInstructionsData] = useState<{
    instructions: string;
    vaccineName: string;
    completedDoseNo: number;
    totalDoses: number;
  } | null>(null);
  const [generatingInstructions, setGeneratingInstructions] = useState(false);
  const [hasShownAutoPopup, setHasShownAutoPopup] = useState(false);
  const [autoPopupTriggered, setAutoPopupTriggered] = useState(false);

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

  // Load current user data
  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userData = await userAPI.getCurrentUser();
      setCurrentUser(userData);
      // Load health card data after getting user
      loadAllHealthCards();
    } catch (error: any) {
      console.error("Error loading current user:", error);
      setError("Failed to load user data. Please log in again.");
    }
  };

  // Animations
  const cardAnimations = useRef<{ [key: string]: Animated.Value }>({});
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const progressAnimations = useRef<{ [key: string]: Animated.Value }>({});
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load health card data from backend
  const loadHealthCardData = async (
    userId: string,
    profileIndex: number,
    isDependent: boolean = false
  ) => {
    try {
      setLoading(true);
      setError(null);

      let healthCard: HealthCard;
      if (isDependent) {
        // For dependents, try to get their health card
        healthCard = await healthCardAPI.getDependentHealthCard(userId);
      } else {
        // For users, try to get their health card
        healthCard = await healthCardAPI.getHealthCard(userId);
      }

      const groupedVaccines = healthCard.completedVaccinations
        ? healthCardAPI.groupVaccinationsByName(
            healthCard.completedVaccinations
          )
        : [];

      // Update the specific profile with health card data
      setProfiles((prevProfiles) => {
        const updatedProfiles = [...prevProfiles];
        updatedProfiles[profileIndex] = {
          ...updatedProfiles[profileIndex],
          name: healthCard.fullName, // Update name from health card
          vaccines: groupedVaccines,
          healthCard: healthCard,
          lastUpdated: new Date(healthCard.updatedAt).toLocaleDateString(),
        };
        return updatedProfiles;
      });
    } catch (error: any) {
      console.error("Error loading health card:", error);

      // Check if it's a 404 error (health card doesn't exist)
      if (
        error.message.includes("404") ||
        error.message.includes("Not Found")
      ) {
        const profileName = profiles[profileIndex].name;
        setError(
          `Health card not found for ${profileName}. Would you like to create one?`
        );

        // Show alert with option to create health card
        showAlert(
          "Health Card Not Found",
          `No health card exists for ${profileName}. Would you like to create one?`,
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Create Health Card",
              onPress: () =>
                currentUser &&
                createHealthCard(currentUser._id, profileIndex, isDependent),
            },
          ],
          "question"
        );
      } else {
        setError(error.message || "Failed to load vaccination data");
        showAlert(
          "Error Loading Data",
          error.message || "Failed to load vaccination data from server.",
          [{ text: "OK" }],
          "error"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Create health card for user/dependent
  const createHealthCard = async (
    userId: string,
    profileIndex: number,
    isDependent: boolean = false
  ) => {
    try {
      setLoading(true);
      setError(null);

      let healthCard: HealthCard;
      if (isDependent) {
        healthCard = await healthCardAPI.createDependentHealthCard(userId);
      } else {
        healthCard = await healthCardAPI.createUserHealthCard(userId);
      }

      // Update the profile with the new health card
      setProfiles((prevProfiles) => {
        const updatedProfiles = [...prevProfiles];
        updatedProfiles[profileIndex] = {
          ...updatedProfiles[profileIndex],
          name: healthCard.fullName, // Update name from health card
          healthCard: healthCard,
          lastUpdated: new Date(healthCard.updatedAt).toLocaleDateString(),
        };
        return updatedProfiles;
      });

      showAlert(
        "Success",
        `Health card created successfully for ${profiles[profileIndex].name}`,
        [{ text: "OK" }],
        "success"
      );
    } catch (error: any) {
      console.error("Error creating health card:", error);
      setError(error.message || "Failed to create health card");
      showAlert(
        "Error Creating Health Card",
        error.message || "Failed to create health card. Please try again.",
        [{ text: "OK" }],
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Load all health cards for user and dependents
  const loadAllHealthCards = async (skipErrorAlerts: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const allHealthCards = await healthCardAPI.getAllHealthCards();

      // Convert health cards to profiles
      const newProfiles: Profile[] = allHealthCards.map(
        (healthCard, index) => ({
          id: healthCard._id,
          name: healthCard.fullName,
          dob: new Date(healthCard.dateOfBirth).toLocaleDateString(),
          relation: healthCard.cardType === "dependent" ? "Dependent" : "User",
          idNumber: healthCard._id.slice(-8).toUpperCase(),
          lastUpdated: new Date(healthCard.updatedAt).toLocaleDateString(),
          vaccines: healthCard.completedVaccinations
            ? healthCardAPI.groupVaccinationsByName(
                healthCard.completedVaccinations
              )
            : [],
          healthCard: healthCard,
          isDependent: healthCard.cardType === "dependent",
          dependentId:
            healthCard.cardType === "dependent" ? healthCard._id : undefined,
        })
      );

      setProfiles(newProfiles);
    } catch (error: any) {
      console.error("Error loading all health cards:", error);

      // Skip alerts if called from delete handler
      if (skipErrorAlerts) {
        throw error; // Re-throw to be caught by caller
      }

      if (
        error.message.includes("404") ||
        error.message.includes("Not Found")
      ) {
        setError("No health cards found. Would you like to create them?");
        showAlert(
          "No Health Cards Found",
          "No health cards exist for this user. Would you like to create them?",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Create Health Cards",
              onPress: () => createAllHealthCards(),
            },
          ],
          "question"
        );
      } else {
        setError(error.message || "Failed to load health cards");
      }
    } finally {
      setLoading(false);
    }
  };

  // Create all health cards for user and dependents
  const createAllHealthCards = async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const userIdToUse = userId || currentUser?._id;
      if (!userIdToUse) {
        setError("No user ID available");
        return;
      }

      await healthCardAPI.createAllHealthCards(userIdToUse);

      // Reload all health cards after creation
      await loadAllHealthCards();

      showAlert(
        "Success",
        "Health cards created successfully for user and dependents.",
        [{ text: "OK" }],
        "success"
      );
    } catch (error: any) {
      console.error("Error creating all health cards:", error);
      setError(error.message || "Failed to create health cards");
      showAlert(
        "Error Creating Health Cards",
        error.message || "Failed to create health cards. Please try again.",
        [{ text: "OK" }],
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Load health card data when component mounts
  useEffect(() => {
    loadAllHealthCards();

    // Cleanup function to reset auto popup state when component unmounts
    return () => {
      setAutoPopupTriggered(false);
    };
  }, []);

  // Handle auto-showing instructions popup when redirected from SchedulePage
  useEffect(() => {
    if (
      params.showInstructions === "true" &&
      params.vaccineName &&
      params.doseNumber &&
      params.totalDoses &&
      params.dateCompleted &&
      !autoPopupTriggered &&
      !showInstructionsPopup && // Additional check to prevent showing if already visible
      profiles.length > 0 &&
      profiles[selectedIdx]?.healthCard
    ) {
      setAutoPopupTriggered(true); // Prevent multiple triggers - this should never be reset

      const vaccination: HealthCardVaccination = {
        vaccineName: params.vaccineName as string,
        doseNumber: parseInt(params.doseNumber as string),
        totalDoses: parseInt(params.totalDoses as string),
        dateCompleted: new Date(params.dateCompleted as string),
      };

      // Auto-generate and show instructions
      setTimeout(() => {
        generateInstructionsAndShowPopup(vaccination);
      }, 1000); // Small delay to ensure UI is ready
    }
  }, [
    params.showInstructions,
    params.vaccineName,
    params.doseNumber,
    params.totalDoses,
    params.dateCompleted,
    autoPopupTriggered,
    showInstructionsPopup,
    profiles.length,
    selectedIdx,
  ]);

  // Load health card data when profile changes
  useEffect(() => {
    if (profiles.length > 0) {
      const currentProfile = profiles[selectedIdx];
      if (currentProfile && !currentProfile.healthCard) {
        loadHealthCardData(
          currentProfile.id,
          selectedIdx,
          currentProfile.isDependent
        );
      }
    }
  }, [selectedIdx]);

  // Initialize animations
  useEffect(() => {
    if (profile?.vaccines) {
      profile.vaccines.forEach((vaccine) => {
        if (!cardAnimations.current[vaccine.id]) {
          cardAnimations.current[vaccine.id] = new Animated.Value(0);
        }
        if (!progressAnimations.current[vaccine.id]) {
          progressAnimations.current[vaccine.id] = new Animated.Value(0);
        }
      });
    }

    // Start pulse animation for timeline
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animate progress bars
    if (profile?.vaccines) {
      profile.vaccines.forEach((vaccine) => {
        Animated.timing(progressAnimations.current[vaccine.id], {
          toValue: vaccine.doses.length / vaccine.totalDoses,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [profile, pulseAnim]);

  const toggleExpand = (vaccineId: string) => {
    LayoutAnimation.configureNext({
      ...LayoutAnimation.Presets.easeInEaseOut,
      duration: 300,
    });

    setExpandedVaccines((prev) => {
      const isExpanding = !prev.includes(vaccineId);

      // Animate card
      Animated.timing(cardAnimations.current[vaccineId], {
        toValue: isExpanding ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      return isExpanding
        ? [...prev, vaccineId]
        : prev.filter((id) => id !== vaccineId);
    });
  };

  const generateInstructionsAndShowPopup = async (
    vaccination: HealthCardVaccination
  ) => {
    // Prevent multiple simultaneous calls
    if (generatingInstructions) {
      return;
    }

    try {
      setGeneratingInstructions(true);
      setShowInstructionsPopup(true);

      const currentProfile = profiles[selectedIdx];
      if (!currentProfile?.healthCard) {
        throw new Error("No health card data available");
      }

      const requestData = {
        dateOfBirth: new Date(
          currentProfile.healthCard.dateOfBirth
        ).toISOString(),
        gender: currentProfile.healthCard.gender,
        vaccineName: vaccination.vaccineName,
        totalDoses: vaccination.totalDoses,
        vaccineDate: new Date(vaccination.dateCompleted).toISOString(),
        completedDoseNo: vaccination.doseNumber,
        userId: currentProfile.healthCard._id,
      };

      const response = await geminiAPI.generateVaccineInstructions(requestData);

      setInstructionsData({
        instructions: response.data.instructions,
        vaccineName: vaccination.vaccineName,
        completedDoseNo: vaccination.doseNumber,
        totalDoses: vaccination.totalDoses,
      });
    } catch (error: any) {
      console.error("Error generating instructions:", error);
      showAlert(
        "Unable to Generate Instructions",
        "We couldn't generate personalized care instructions at this time. This might be due to a network issue or service temporarily unavailable.\n\nYou can still follow general post-vaccination care guidelines.",
        [
          {
            text: "OK",
            onPress: () => {
              setShowInstructionsPopup(false);
              // Don't reset autoPopupTriggered - this prevents the loop
            },
          },
        ],
        "warning"
      );
    } finally {
      setGeneratingInstructions(false);
    }
  };

  const handleVaccinePress = (vaccine: Vaccine) => {
    setSelectedVaccine(vaccine);
    setShowVaccineModal(true);
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

      // Load data for new profile
      const newProfile = profiles[newIndex];
      if (newProfile && !newProfile.healthCard) {
        loadHealthCardData(newProfile.id, newIndex, newProfile.isDependent);
      }

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

  const handleDownload = async () => {
    const currentProfile = profiles[selectedIdx];
    if (!currentProfile?.healthCard) {
      showAlert(
        "No Data",
        "No health card data available to download",
        [{ text: "OK" }],
        "warning"
      );
      return;
    }

    // Check if there are any completed vaccinations
    const hasVaccinations =
      currentProfile.healthCard.completedVaccinations &&
      currentProfile.healthCard.completedVaccinations.length > 0;

    if (!hasVaccinations) {
      showAlert(
        "No Vaccinations",
        "No completed vaccinations found to generate certificate.",
        [{ text: "OK" }],
        "info"
      );
      return;
    }

    try {
      setLoading(true);

      // Get auth token for the download URL
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        showAlert(
          "Authentication Error",
          "Please login again",
          [{ text: "OK" }],
          "error"
        );
        setLoading(false);
        return;
      }

      // Create authenticated download URL with token in query parameter
      const downloadUrl = `${API_BASE_URL}/api/health-card/download-certificate/${currentProfile.healthCard._id}?token=${encodeURIComponent(token)}`;

      // Open the download URL in the browser
      const supported = await Linking.canOpenURL(downloadUrl);

      if (supported) {
        await Linking.openURL(downloadUrl);

        showAlert(
          "Download Started",
          `Vaccination certificate for ${currentProfile.name} is being downloaded. Check your browser's download folder.`,
          [{ text: "OK" }],
          "success"
        );
      } else {
        showAlert(
          "Download Error",
          "Cannot open download link. Please try again.",
          [{ text: "OK" }],
          "error"
        );
      }
    } catch (error: any) {
      console.error("Error downloading certificate:", error);
      showAlert(
        "Download Error",
        error.message ||
          "Failed to download vaccination certificate. Please try again.",
        [{ text: "OK" }],
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const currentProfile = profiles[selectedIdx];
    if (!currentProfile?.healthCard) {
      showAlert(
        "No Data",
        "No health card data available to share",
        [{ text: "OK" }],
        "warning"
      );
      return;
    }

    // Check if there are any completed vaccinations
    const hasVaccinations =
      currentProfile.healthCard.completedVaccinations &&
      currentProfile.healthCard.completedVaccinations.length > 0;

    if (!hasVaccinations) {
      showAlert(
        "No Vaccinations",
        "No completed vaccinations found to generate certificate.",
        [{ text: "OK" }],
        "info"
      );
      return;
    }

    try {
      setLoading(true);

      // Check if sharing is available on this device
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        showAlert(
          "Sharing Not Available",
          "Sharing is not available on this device",
          [{ text: "OK" }],
          "warning"
        );
        setLoading(false);
        return;
      }

      // Get auth token
      const AsyncStorage =
        require("@react-native-async-storage/async-storage").default;
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        showAlert(
          "Authentication Error",
          "Please login again",
          [{ text: "OK" }],
          "error"
        );
        setLoading(false);
        return;
      }

      // Download URL with authentication
      const downloadUrl = `${API_BASE_URL}/api/health-card/download-certificate/${currentProfile.healthCard._id}?token=${encodeURIComponent(token)}`;

      // Define file path
      const fileName = `VaxSync_Certificate_${currentProfile.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
      const fileUri = (documentDirectory || cacheDirectory || "") + fileName;

      // Download the PDF file
      const downloadResult = await downloadAsync(downloadUrl, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error("Failed to download certificate");
      }

      // Share the downloaded PDF file
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: "application/pdf",
        dialogTitle: `Vaccination Certificate - ${currentProfile.name}`,
        UTI: "com.adobe.pdf",
      });

      showAlert(
        "Shared Successfully",
        `Vaccination certificate for ${currentProfile.name} has been shared.`,
        [{ text: "OK" }],
        "success"
      );
    } catch (error: any) {
      console.error("Error sharing certificate:", error);
      showAlert(
        "Share Error",
        error.message ||
          "Failed to share vaccination certificate. Please try again.",
        [{ text: "OK" }],
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete a specific vaccination dose
  const handleDeleteVaccination = async (
    vaccineName: string,
    doseNumber: number
  ) => {
    const currentProfile = profiles[selectedIdx];
    if (!currentProfile?.healthCard) {
      showAlert(
        "Error",
        "No health card data available",
        [{ text: "OK" }],
        "error"
      );
      return;
    }

    // Show confirmation dialog
    showAlert(
      "Delete Vaccination",
      `Are you sure you want to delete ${vaccineName} dose ${doseNumber}?\n\nThis action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              // Call the API to delete the vaccination
              await healthCardAPI.deleteVaccination(
                currentProfile.healthCard!._id,
                vaccineName,
                doseNumber
              );

              // Clear instructions popup state if visible
              setShowInstructionsPopup(false);
              setInstructionsData(null);
              setGeneratingInstructions(false);

              // Reload all health card data (skip error alerts to prevent navigation issues)
              try {
                await loadAllHealthCards(true);

                // Ensure selectedIdx is still valid after reload
                setSelectedIdx((prev) => {
                  // Get the new profiles length after reload
                  return prev; // Keep current if still valid
                });
              } catch (reloadError: any) {
                console.error(
                  "Error reloading health cards after delete:",
                  reloadError
                );
                // Continue anyway - the delete was successful
                // The data will reload when user navigates away and comes back
              }

              // Small delay before showing success alert to allow state to settle
              setTimeout(() => {
                showAlert(
                  "Success",
                  `${vaccineName} dose ${doseNumber} has been deleted successfully.`,
                  [{ text: "OK" }],
                  "success"
                );
              }, 100);
            } catch (error: any) {
              console.error("Error deleting vaccination:", error);
              showAlert(
                "Error",
                error.message ||
                  "Failed to delete vaccination. Please try again.",
                [{ text: "OK" }],
                "error"
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      "warning"
    );
  };

  // Calculate completion stats for progress display
  const completionStats = {
    total: profile?.vaccines?.length || 0,
    completed:
      profile?.vaccines?.filter((v) => {
        const completedDoses = v.doses.filter(
          (d) => d.status === "completed" || d.verified
        );
        const cancelledDoses = v.doses.filter((d) => d.status === "cancelled");
        const activeDoses = v.totalDoses - cancelledDoses.length;
        return completedDoses.length === activeDoses;
      }).length || 0,
    verified:
      profile?.vaccines?.filter((v) =>
        v.doses.every((d) => d.verified || d.status === "completed")
      ).length || 0,
  };

  // Function to add pending doses for incomplete vaccines
  const addPendingDoses = (vaccines: Vaccine[]): Vaccine[] => {
    return vaccines.map((vaccine) => {
      // Get all existing dose numbers
      const existingDoseNumbers = vaccine.doses.map((d) => d.doseNumber);
      const pendingDoses: VaccineDose[] = [];

      // Find the highest dose number that exists (completed or cancelled)
      const maxExistingDose =
        existingDoseNumbers.length > 0 ? Math.max(...existingDoseNumbers) : 0;

      // Only add pending doses AFTER the last existing dose
      // This prevents deleted doses from reappearing as pending
      for (let i = maxExistingDose + 1; i <= vaccine.totalDoses; i++) {
        pendingDoses.push({
          doseNumber: i,
          date: "Pending",
          batch: "N/A",
          provider: "To be scheduled",
          verified: false,
          facility: "TBD",
          notes: "Dose not yet administered",
          status: "pending",
        });
      }

      return {
        ...vaccine,
        doses: [...vaccine.doses, ...pendingDoses].sort(
          (a, b) => a.doseNumber - b.doseNumber
        ),
      };
    });
  };

  // Filter vaccines with pending doses
  const vaccinesWithPending = addPendingDoses(profile?.vaccines || []);
  const filteredVaccines = vaccinesWithPending.filter((vaccine) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      (typeof vaccine.name === "string"
        ? vaccine.name
        : String(vaccine.name || "")
      )
        .toLowerCase()
        .includes(searchLower) ||
      vaccine.doses.some(
        (dose) =>
          (typeof dose.date === "string" ? dose.date : String(dose.date))
            .toLowerCase()
            .includes(searchLower) ||
          (typeof dose.batch === "string"
            ? dose.batch
            : String(dose.batch || "")
          )
            .toLowerCase()
            .includes(searchLower) ||
          (typeof dose.provider === "string"
            ? dose.provider
            : String(dose.provider || "")
          )
            .toLowerCase()
            .includes(searchLower)
      );

    const matchesFilter =
      filterType === "all" ||
      (typeof vaccine.type === "string"
        ? vaccine.type
        : String(vaccine.type || "")) === filterType;

    return matchesSearch && matchesFilter;
  });

  const CircularProgress = ({
    percentage,
    size = 60,
    strokeWidth = 6,
    vaccine,
  }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    vaccine: Vaccine;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const config = vaccineConfig[vaccine.type];
    const completedDoses = vaccine.doses.filter((d) => d.verified).length;
    const totalDoses = vaccine.totalDoses;

    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ position: "absolute" }}>
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
          <Text
            className="text-xs"
            style={{ color: config.color, fontSize: 8 }}
          >
            {completedDoses}/{totalDoses}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />

      {/* Enhanced Header with Gradient */}
      <LinearGradient
        colors={["#1e40af", "#3b82f6", "#60a5fa"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-4 pb-8 px-6"
      >
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-white mb-1">
              My Vaccine Records
            </Text>
            <Text className="text-blue-100 text-base">
              Track your vaccination journey
            </Text>
          </View>
          <View className="bg-white/20 rounded-2xl p-3">
            <Ionicons name="shield-checkmark" size={32} color="white" />
          </View>
        </View>

        {/* Stats Cards */}
        <View className="flex-row justify-between">
          <View className="bg-white/15 rounded-2xl p-4 flex-1 mr-2 backdrop-blur-sm">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text className="text-white/90 text-sm font-medium ml-2">
                Completed
              </Text>
            </View>
            <Text className="text-2xl font-bold text-white">
              {completionStats.completed}
            </Text>
            <Text className="text-white/70 text-xs">vaccines</Text>
          </View>

          <View className="bg-white/15 rounded-2xl p-4 flex-1 mx-1 backdrop-blur-sm">
            <View className="flex-row items-center mb-2">
              <Ionicons name="shield" size={20} color="white" />
              <Text className="text-white/90 text-sm font-medium ml-2">
                Total
              </Text>
            </View>
            <Text className="text-2xl font-bold text-white">
              {completionStats.total}
            </Text>
            <Text className="text-white/70 text-xs">vaccines</Text>
          </View>

          <View className="bg-white/15 rounded-2xl p-4 flex-1 ml-2 backdrop-blur-sm">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text className="text-white/90 text-sm font-medium ml-2">
                Verified
              </Text>
            </View>
            <Text className="text-2xl font-bold text-white">
              {completionStats.verified}
            </Text>
            <Text className="text-white/70 text-xs">doses</Text>
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
                    Loading vaccination data...
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    Please wait while we fetch your records
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
                  {(error.includes("Health card not found") ||
                    error.includes("No health cards found")) && (
                    <TouchableOpacity
                      onPress={() => {
                        if (error.includes("No health cards found")) {
                          createAllHealthCards();
                        } else {
                          const currentProfile = profiles[selectedIdx];
                          if (currentProfile && currentUser) {
                            createHealthCard(
                              currentUser._id,
                              selectedIdx,
                              currentProfile.isDependent
                            );
                          }
                        }
                      }}
                      className="bg-red-500 rounded-xl px-4 py-3 self-start"
                    >
                      <Text className="text-white text-sm font-semibold">
                        {error.includes("No health cards found")
                          ? "Create Health Cards"
                          : "Create Health Card"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Loading state */}
        {loading && (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-gray-600 mt-4">Loading health cards...</Text>
          </View>
        )}

        {/* No profiles state */}
        {!loading && profiles.length === 0 && !error && (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-gray-600 text-lg mb-4">
              No profiles found
            </Text>
            <Text className="text-gray-500 text-center px-8">
              Please create a health card to get started
            </Text>
          </View>
        )}

        {/* Enhanced Profile Carousel */}
        {profiles.length > 0 && (
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
                const completedCount =
                  p.vaccines?.filter((v) => v.doses.length === v.totalDoses)
                    .length || 0;
                const hasHealthCard = !!p.healthCard;
                const completionPercentage =
                  p.vaccines?.length > 0
                    ? Math.round((completedCount / p.vaccines.length) * 100)
                    : 0;

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
                      transform: isSelected
                        ? [{ scale: 1.05 }]
                        : [{ scale: 1 }],
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
                        {hasHealthCard && (
                          <View className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full items-center justify-center border-2 border-white">
                            <Ionicons
                              name="checkmark"
                              size={12}
                              color="white"
                            />
                          </View>
                        )}
                      </View>

                      <Text
                        className={`font-bold text-center text-base mb-1 ${
                          isSelected ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {p.healthCard
                          ? p.healthCard.fullName.split(" ")[0]
                          : p.name.split(" ")[0]}
                      </Text>

                      <Text
                        className={`text-sm text-center mb-2 ${
                          isSelected ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {p.healthCard
                          ? p.healthCard.cardType === "dependent"
                            ? "Dependent"
                            : "User"
                          : p.relation}
                      </Text>

                      {/* Progress Bar */}
                      <View
                        className={`w-full h-2 rounded-full mb-2 ${
                          isSelected ? "bg-white/20" : "bg-gray-200"
                        }`}
                      >
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
                          {hasHealthCard
                            ? `${completionPercentage}% complete`
                            : "Loading..."}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

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
                placeholder="Search vaccines, dates, or providers..."
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
                Filter by type
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[
                  { key: "all", label: "All", icon: "grid", color: "#6b7280" },
                  {
                    key: "routine",
                    label: "Routine",
                    icon: "shield-checkmark",
                    color: "#10b981",
                  },
                  {
                    key: "travel",
                    label: "Travel",
                    icon: "airplane",
                    color: "#3b82f6",
                  },
                  {
                    key: "occupational",
                    label: "Work",
                    icon: "briefcase",
                    color: "#f59e0b",
                  },
                  {
                    key: "emergency",
                    label: "Emergency",
                    icon: "medical",
                    color: "#ef4444",
                  },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.key}
                    onPress={() => setFilterType(filter.key)}
                    className={`mr-3 px-4 py-3 rounded-2xl border-2 flex-row items-center ${
                      filterType === filter.key
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <Ionicons
                      name={filter.icon as any}
                      size={18}
                      color={
                        filterType === filter.key ? "#3b82f6" : filter.color
                      }
                    />
                    <Text
                      className={`ml-2 text-sm font-semibold ${
                        filterType === filter.key
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
            {/* Enhanced Vaccine Cards */}
            {filteredVaccines.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center shadow-sm border border-gray-100">
                <View className="bg-gray-100 rounded-full p-4 mb-4">
                  <Ionicons name="search" size={48} color="#94a3b8" />
                </View>
                <Text className="text-xl font-bold text-gray-800 mb-2">
                  No vaccines found
                </Text>
                <Text className="text-gray-500 text-center mb-4">
                  Try adjusting your search or filter criteria to find what
                  you're looking for
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setFilterType("all");
                  }}
                  className="bg-blue-500 rounded-xl px-6 py-3"
                >
                  <Text className="text-white font-semibold">
                    Clear Filters
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredVaccines.slice(0, 5).map((vaccine, index) => {
                const completedDoses = vaccine.doses.filter(
                  (d) => d.status === "completed" || d.verified
                );
                const cancelledDoses = vaccine.doses.filter(
                  (d) => d.status === "cancelled"
                );
                const activeDoses = vaccine.totalDoses - cancelledDoses.length;
                const latestDose = completedDoses[completedDoses.length - 1] ||
                  vaccine.doses[vaccine.doses.length - 1] || {
                    provider: "N/A",
                    date: "N/A",
                  };
                const allVerified = completedDoses.length === activeDoses;
                const isExpanded = expandedVaccines.includes(vaccine.id);
                const completionPercentage =
                  activeDoses > 0
                    ? (completedDoses.length / activeDoses) * 100
                    : 0;
                const config = vaccineConfig[vaccine.type];

                return (
                  <Animated.View
                    key={vaccine.id}
                    style={{
                      transform: [
                        {
                          scale:
                            cardAnimations.current[vaccine.id]?.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.02],
                            }) || 1,
                        },
                      ],
                      marginBottom: 16,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => toggleExpand(vaccine.id)}
                      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                      style={{
                        elevation: 4,
                        shadowColor: "#000",
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
                                  {vaccine.name || "Unknown Vaccine"}
                                </Text>
                                {allVerified && (
                                  <View className="bg-green-500 rounded-full px-4 py-2 ml-2 shadow-sm">
                                    <View className="flex-row items-center">
                                      <Ionicons
                                        name="shield-checkmark"
                                        size={14}
                                        color="white"
                                      />
                                      <Text className="text-xs font-bold text-white ml-1">
                                        COMPLETED
                                      </Text>
                                    </View>
                                  </View>
                                )}
                              </View>
                              <View className="flex-row items-center mb-1">
                                <Ionicons
                                  name="location"
                                  size={14}
                                  color="#6b7280"
                                />
                                <Text className="text-sm text-gray-600 ml-1 flex-1">
                                  {latestDose?.provider || "N/A"}
                                </Text>
                              </View>
                              <View className="flex-row items-center">
                                <Ionicons
                                  name="calendar"
                                  size={14}
                                  color="#6b7280"
                                />
                                <Text className="text-sm text-gray-600 ml-1">
                                  {latestDose?.date
                                    ? typeof latestDose.date === "string"
                                      ? new Date(
                                          latestDose.date
                                        ).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                        })
                                      : new Date(
                                          latestDose.date
                                        ).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                        })
                                    : "N/A"}
                                </Text>
                                <View className="ml-3 bg-gray-100 rounded-full px-2 py-1">
                                  <Text className="text-xs font-medium text-gray-600 capitalize">
                                    {vaccine.type || "Unknown"}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>

                          <View className="items-center ml-3">
                            {allVerified ? (
                              // Completion Badge for fully completed vaccines
                              <View className="items-center">
                                <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-2 border-2 border-green-200">
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={32}
                                    color="#16a34a"
                                  />
                                </View>
                                <View className="bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                                  <Text className="text-xs font-bold text-green-700 text-center">
                                    COMPLETED
                                  </Text>
                                  {latestDose?.date !== "Pending" &&
                                    latestDose?.date !== "TBD" &&
                                    latestDose?.date !== "N/A" &&
                                    latestDose?.date && (
                                      <Text className="text-xs text-green-600 text-center mt-1">
                                        {(() => {
                                          try {
                                            // Try to parse the date string
                                            const completionDate = new Date(
                                              latestDose.date
                                            );

                                            // Check if date is valid
                                            if (
                                              isNaN(completionDate.getTime())
                                            ) {
                                              return null; // Don't show if date is invalid
                                            }

                                            const today = new Date();
                                            const diffTime =
                                              today.getTime() -
                                              completionDate.getTime();
                                            const diffDays = Math.floor(
                                              diffTime / (1000 * 60 * 60 * 24)
                                            );

                                            if (diffDays === 0) return "Today";
                                            if (diffDays === 1)
                                              return "1 day ago";
                                            if (diffDays > 1 && diffDays < 30)
                                              return `${diffDays} days ago`;
                                            if (
                                              diffDays >= 30 &&
                                              diffDays < 365
                                            ) {
                                              const months = Math.floor(
                                                diffDays / 30
                                              );
                                              return `${months} month${
                                                months > 1 ? "s" : ""
                                              } ago`;
                                            }
                                            if (diffDays >= 365) {
                                              const years = Math.floor(
                                                diffDays / 365
                                              );
                                              return `${years} year${
                                                years > 1 ? "s" : ""
                                              } ago`;
                                            }
                                            return null;
                                          } catch (error) {
                                            // If date parsing fails, don't show anything
                                            return null;
                                          }
                                        })()}
                                      </Text>
                                    )}
                                </View>
                              </View>
                            ) : (
                              // Progress Circle for incomplete vaccines
                              <View className="items-center">
                                <CircularProgress
                                  percentage={completionPercentage}
                                  vaccine={vaccine}
                                  size={60}
                                />
                                <Text className="text-xs text-gray-500 mt-1 text-center">
                                  {completedDoses.length}/{activeDoses} doses
                                </Text>
                              </View>
                            )}
                            <View className="bg-gray-100 rounded-full p-1 mt-2">
                              <Ionicons
                                name={
                                  isExpanded ? "chevron-up" : "chevron-down"
                                }
                                size={16}
                                color="#6b7280"
                              />
                            </View>
                          </View>
                        </View>

                        {/* Enhanced Expanded dose details - Compact Timeline */}
                        {isExpanded && (
                          <View className="mt-4">
                            <Text className="text-base font-bold text-gray-800 mb-3">
                              Dose Timeline
                            </Text>

                            {/* Compact Timeline View */}
                            <View>
                              {vaccine.doses.map((dose, doseIndex) => (
                                <View
                                  key={`${vaccine.id}-dose-${dose.doseNumber}`}
                                  className="flex-row mb-3"
                                >
                                  {/* Timeline Indicator */}
                                  <View className="mr-3" style={{ width: 36 }}>
                                    <View
                                      className={`w-9 h-9 rounded-full items-center justify-center shadow-sm ${
                                        dose.status === "cancelled"
                                          ? "bg-red-100 border-2 border-red-300"
                                          : dose.verified
                                            ? "bg-green-100 border-2 border-green-300"
                                            : "bg-yellow-100 border-2 border-yellow-300"
                                      }`}
                                    >
                                      <Text
                                        className={`font-bold text-sm ${
                                          dose.status === "cancelled"
                                            ? "text-red-600"
                                            : dose.verified
                                              ? "text-green-600"
                                              : "text-yellow-600"
                                        }`}
                                      >
                                        {dose.doseNumber}
                                      </Text>
                                    </View>
                                    {doseIndex < vaccine.doses.length - 1 && (
                                      <View
                                        className="bg-gray-200 ml-4 mt-1"
                                        style={{ width: 2, height: 30 }}
                                      />
                                    )}
                                  </View>

                                  {/* Dose Content Card */}
                                  <View className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                                    {/* Dose Header */}
                                    <View className="flex-row items-center justify-between mb-2">
                                      <View className="flex-1">
                                        <View className="flex-row items-center mb-1">
                                          <Text className="text-sm font-bold text-gray-800">
                                            Dose {dose.doseNumber}
                                          </Text>
                                          <View
                                            className={`ml-2 px-2 py-0.5 rounded-full ${
                                              dose.status === "cancelled"
                                                ? "bg-red-100"
                                                : dose.verified
                                                  ? "bg-green-100"
                                                  : "bg-yellow-100"
                                            }`}
                                          >
                                            <Text
                                              className={`text-xs font-semibold ${
                                                dose.status === "cancelled"
                                                  ? "text-red-600"
                                                  : dose.verified
                                                    ? "text-green-600"
                                                    : "text-yellow-600"
                                              }`}
                                            >
                                              {dose.status === "cancelled"
                                                ? "Cancelled"
                                                : dose.verified
                                                  ? "✓ Done"
                                                  : "Pending"}
                                            </Text>
                                          </View>
                                        </View>
                                        <View className="flex-row items-center">
                                          <Ionicons
                                            name="calendar-outline"
                                            size={11}
                                            color="#6b7280"
                                          />
                                          <Text className="text-xs text-gray-600 ml-1">
                                            {dose.date
                                              ? typeof dose.date === "string"
                                                ? dose.date === "Pending" ||
                                                  dose.date === "TBD"
                                                  ? dose.date
                                                  : new Date(
                                                      dose.date
                                                    ).toLocaleDateString(
                                                      "en-US",
                                                      {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                      }
                                                    )
                                                : new Date(
                                                    dose.date
                                                  ).toLocaleDateString(
                                                    "en-US",
                                                    {
                                                      year: "numeric",
                                                      month: "short",
                                                      day: "numeric",
                                                    }
                                                  )
                                              : "N/A"}
                                          </Text>
                                        </View>
                                      </View>

                                      {/* Action Buttons */}
                                      <View className="flex-row items-center">
                                        {(dose.verified ||
                                          dose.status === "completed") &&
                                          dose.status !== "cancelled" && (
                                            <TouchableOpacity
                                              onPress={() => {
                                                if (
                                                  dose.verified &&
                                                  dose.date !== "Pending" &&
                                                  dose.date !== "TBD"
                                                ) {
                                                  const vaccination = {
                                                    vaccineName: vaccine.name,
                                                    doseNumber: dose.doseNumber,
                                                    totalDoses:
                                                      vaccine.totalDoses,
                                                    dateCompleted: new Date(
                                                      dose.date
                                                    ),
                                                  };
                                                  generateInstructionsAndShowPopup(
                                                    vaccination as HealthCardVaccination
                                                  );
                                                }
                                              }}
                                              className="bg-blue-50 rounded-lg p-2 mr-1"
                                            >
                                              <Ionicons
                                                name="medical"
                                                size={16}
                                                color="#3b82f6"
                                              />
                                            </TouchableOpacity>
                                          )}
                                        {(dose.verified ||
                                          dose.status === "cancelled") && (
                                          <TouchableOpacity
                                            onPress={() =>
                                              handleDeleteVaccination(
                                                vaccine.name,
                                                dose.doseNumber
                                              )
                                            }
                                            className="bg-red-50 rounded-lg p-2"
                                          >
                                            <Ionicons
                                              name="trash-outline"
                                              size={16}
                                              color="#ef4444"
                                            />
                                          </TouchableOpacity>
                                        )}
                                      </View>
                                    </View>

                                    {/* Compact Details - Inline */}
                                    <View className="flex-row flex-wrap">
                                      <View className="flex-row items-center mr-3 mb-1">
                                        <Ionicons
                                          name="medkit"
                                          size={12}
                                          color="#3b82f6"
                                        />
                                        <Text className="text-xs text-gray-700 ml-1 font-medium">
                                          {dose.provider}
                                        </Text>
                                      </View>
                                      <View className="flex-row items-center mr-3 mb-1">
                                        <Ionicons
                                          name="barcode-outline"
                                          size={12}
                                          color="#6b7280"
                                        />
                                        <Text className="text-xs text-gray-600 ml-1 font-mono">
                                          {dose.batch}
                                        </Text>
                                      </View>
                                      {dose.facility &&
                                        dose.facility !== "TBD" && (
                                          <View className="flex-row items-center mr-3 mb-1">
                                            <Ionicons
                                              name="business"
                                              size={12}
                                              color="#6b7280"
                                            />
                                            <Text className="text-xs text-gray-600 ml-1 font-medium">
                                              {dose.facility}
                                            </Text>
                                          </View>
                                        )}
                                      {dose.notes && (
                                        <View className="flex-row items-center mb-1 w-full mt-1">
                                          <Ionicons
                                            name="document-text"
                                            size={12}
                                            color="#6b7280"
                                          />
                                          <Text
                                            className="text-xs text-gray-600 ml-1 italic flex-1"
                                            numberOfLines={1}
                                          >
                                            {dose.notes}
                                          </Text>
                                        </View>
                                      )}
                                    </View>
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })
            )}

            {/* Enhanced Timeline */}
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center">
                  <View className="bg-blue-100 rounded-2xl p-3 mr-3">
                    <Ionicons name="time" size={24} color="#3b82f6" />
                  </View>
                  <View>
                    <Text className="text-xl font-bold text-gray-800">
                      Recent Activity
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      Latest vaccination updates
                    </Text>
                  </View>
                </View>
                <View className="bg-blue-50 rounded-2xl px-4 py-2">
                  <Text className="text-sm font-bold text-blue-700">
                    {profile?.vaccines?.flatMap((v) => v?.doses || []).length ||
                      0}{" "}
                    doses
                  </Text>
                </View>
              </View>

              {(
                profile?.vaccines
                  ?.flatMap(
                    (v) => v?.doses?.map((dose) => ({ vaccine: v, dose })) || []
                  )
                  ?.filter((item) => item && item.vaccine && item.dose)
                  ?.sort((a, b) => {
                    const dateA = new Date(a.dose.date).getTime();
                    const dateB = new Date(b.dose.date).getTime();
                    return dateB - dateA;
                  })
                  ?.slice(0, 5) || []
              ) // Show only recent 5
                .map((item, i, arr) => {
                  const config = vaccineConfig[item.vaccine.type];
                  const isLatest = i === 0;

                  return (
                    <View
                      key={`timeline-${item.vaccine.id}-dose-${item.dose.doseNumber}-${i}`}
                      className="flex-row items-start mb-6 last:mb-0"
                    >
                      <View className="items-center mr-4">
                        <Animated.View
                          className={`w-6 h-6 rounded-full items-center justify-center ${
                            isLatest ? "shadow-lg" : ""
                          }`}
                          style={{
                            backgroundColor:
                              item.dose.status === "cancelled"
                                ? "#ef4444"
                                : config.color,
                            transform:
                              i === 0
                                ? [
                                    {
                                      scale: pulseAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [1, 1.2],
                                      }),
                                    },
                                  ]
                                : [],
                          }}
                        >
                          <Ionicons
                            name={
                              item.dose.status === "cancelled"
                                ? "close"
                                : "checkmark"
                            }
                            size={12}
                            color="white"
                          />
                        </Animated.View>
                        {i < arr.length - 1 && (
                          <View
                            className="w-0.5 h-12 mt-3"
                            style={{ backgroundColor: "#e5e7eb" }}
                          />
                        )}
                      </View>

                      <View className="flex-1 bg-gray-50 rounded-2xl p-4">
                        <View className="flex-row items-center justify-between mb-3">
                          <View className="flex-row items-center flex-wrap">
                            <Text className="font-bold text-gray-800 text-lg">
                              {item.vaccine.name}
                            </Text>
                            <View
                              className="ml-3 px-3 py-1 rounded-full"
                              style={{ backgroundColor: config.bgColor }}
                            >
                              <Text
                                className="text-sm font-semibold"
                                style={{ color: config.color }}
                              >
                                Dose {item.dose.doseNumber}
                              </Text>
                            </View>
                            {item.dose.status === "cancelled" && (
                              <View className="ml-2 px-3 py-1 rounded-full bg-red-100">
                                <Text className="text-xs font-semibold text-red-700">
                                  Cancelled
                                </Text>
                              </View>
                            )}
                          </View>
                          {isLatest && (
                            <View className="bg-green-100 rounded-full px-3 py-1">
                              <Text className="text-xs font-semibold text-green-700">
                                Latest
                              </Text>
                            </View>
                          )}
                        </View>

                        <View className="flex-row items-center mb-2">
                          <Ionicons name="calendar" size={16} color="#6b7280" />
                          <Text className="text-gray-600 font-medium ml-2">
                            {typeof item.dose.date === "string"
                              ? item.dose.date === "Pending" ||
                                item.dose.date === "TBD"
                                ? item.dose.date
                                : new Date(item.dose.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )
                              : new Date(item.dose.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                          </Text>
                        </View>

                        <View className="flex-row items-center">
                          <Ionicons name="medical" size={16} color="#6b7280" />
                          <Text className="text-gray-600 ml-2">
                            {item.dose.provider}
                          </Text>
                        </View>

                        {item.dose.batch && item.dose.batch !== "N/A" && (
                          <View className="flex-row items-center mt-2">
                            <Ionicons
                              name="barcode"
                              size={16}
                              color="#6b7280"
                            />
                            <Text className="text-gray-500 text-sm font-mono ml-2">
                              Batch: {item.dose.batch}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}

              {/* Show More Indicator */}
              {filteredVaccines.length > 5 && (
                <View className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mx-4 mb-4">
                  <View className="flex-row items-center justify-center">
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color="#3b82f6"
                    />
                    <Text className="text-sm font-semibold text-blue-700 ml-2">
                      Showing 5 of {filteredVaccines.length} recent activities
                    </Text>
                  </View>
                  <Text className="text-xs text-center text-gray-600 mt-2">
                    Use search or filters to find specific vaccines
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Enhanced Floating Action Buttons - Float in View */}
        <View className="absolute right-4 z-50" style={{ bottom: 120 }}>
          <View className="bg-white rounded-3xl p-2 shadow-xl border border-gray-100">
            <TouchableOpacity
              onPress={() => {
                handleShare();
              }}
              className="w-16 h-16 bg-blue-600 rounded-2xl shadow-lg items-center justify-center mb-2"
              style={{
                elevation: 8,
                shadowColor: "#3b82f6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Ionicons name="share-social" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                handleDownload();
              }}
              className="w-16 h-16 bg-green-500 rounded-2xl shadow-lg items-center justify-center"
              style={{
                elevation: 8,
                shadowColor: "#16a34a",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Ionicons name="download" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Modal */}
        <Modal
          visible={showVaccineModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowVaccineModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-5/6">
              {selectedVaccine && (
                <>
                  <View className="p-6 border-b border-gray-100">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <View
                          className="w-16 h-16 rounded-2xl items-center justify-center mr-4 shadow-sm"
                          style={{
                            backgroundColor:
                              vaccineConfig[selectedVaccine.type].bgColor,
                          }}
                        >
                          <Ionicons
                            name={
                              vaccineConfig[selectedVaccine.type].icon as any
                            }
                            size={32}
                            color={vaccineConfig[selectedVaccine.type].color}
                          />
                        </View>
                        <View>
                          <Text className="text-2xl font-bold text-gray-800">
                            {selectedVaccine.name}
                          </Text>
                          <Text className="text-gray-500 capitalize text-base">
                            {selectedVaccine.type} vaccination
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <Ionicons
                              name="shield-checkmark"
                              size={16}
                              color="#16a34a"
                            />
                            <Text className="text-green-600 font-medium ml-1 text-sm">
                              Verified Records
                            </Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => setShowVaccineModal(false)}
                        className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
                      >
                        <Ionicons name="close" size={24} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <ScrollView
                    className="p-6"
                    showsVerticalScrollIndicator={false}
                  >
                    <Text className="text-lg font-bold text-gray-800 mb-4">
                      All Doses
                    </Text>
                    <View className="space-y-4">
                      {selectedVaccine.doses.map((dose, index) => (
                        <View
                          key={`${selectedVaccine.id}-dose-${dose.doseNumber}-${index}`}
                          className="bg-white p-5 rounded-2xl border-2 border-gray-100 shadow-sm"
                        >
                          <View className="flex-row justify-between items-center mb-4">
                            <View className="flex-row items-center">
                              <View
                                className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                                  dose.verified
                                    ? "bg-green-100"
                                    : "bg-yellow-100"
                                }`}
                              >
                                <Ionicons
                                  name={dose.verified ? "checkmark" : "time"}
                                  size={24}
                                  color={dose.verified ? "#16a34a" : "#f59e0b"}
                                />
                              </View>
                              <View>
                                <Text className="text-xl font-bold text-gray-800">
                                  Dose {dose.doseNumber}
                                </Text>
                                <Text
                                  className={`text-sm font-medium ${
                                    dose.status === "cancelled"
                                      ? "text-red-600"
                                      : dose.verified
                                        ? "text-green-600"
                                        : "text-yellow-600"
                                  }`}
                                >
                                  {dose.status === "cancelled"
                                    ? "Cancelled"
                                    : dose.verified
                                      ? "Completed"
                                      : "Pending"}
                                </Text>
                              </View>
                            </View>

                            <View className="flex-row items-center">
                              {dose.status === "cancelled" ? (
                                <View className="flex-row items-center">
                                  <View className="bg-red-100 rounded-xl px-4 py-3 mr-2">
                                    <Text className="text-sm font-semibold text-red-700">
                                      ❌ Cancelled
                                    </Text>
                                  </View>
                                  <TouchableOpacity
                                    onPress={() =>
                                      handleDeleteVaccination(
                                        selectedVaccine.name,
                                        dose.doseNumber
                                      )
                                    }
                                    className="bg-red-100 rounded-xl p-3"
                                  >
                                    <Ionicons
                                      name="trash"
                                      size={20}
                                      color="#ef4444"
                                    />
                                  </TouchableOpacity>
                                </View>
                              ) : dose.verified ? (
                                <TouchableOpacity
                                  onPress={() =>
                                    handleDeleteVaccination(
                                      selectedVaccine.name,
                                      dose.doseNumber
                                    )
                                  }
                                  className="bg-red-100 rounded-xl p-3"
                                >
                                  <Ionicons
                                    name="trash"
                                    size={20}
                                    color="#ef4444"
                                  />
                                </TouchableOpacity>
                              ) : (
                                <View className="bg-yellow-100 rounded-xl px-4 py-3">
                                  <Text className="text-sm font-semibold text-yellow-700">
                                    ⏳ Pending
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>

                          <View className="bg-gray-50 rounded-2xl p-4">
                            <View className="grid grid-cols-2 gap-4">
                              <View className="flex-row items-center">
                                <View className="bg-white rounded-full p-2 mr-3">
                                  <Ionicons
                                    name="calendar"
                                    size={16}
                                    color="#6b7280"
                                  />
                                </View>
                                <View>
                                  <Text className="text-xs text-gray-500 mb-1">
                                    Date
                                  </Text>
                                  <Text className="text-sm font-semibold text-gray-800">
                                    {dose.date
                                      ? typeof dose.date === "string"
                                        ? dose.date === "Pending" ||
                                          dose.date === "TBD"
                                          ? dose.date
                                          : new Date(
                                              dose.date
                                            ).toLocaleDateString("en-US", {
                                              year: "numeric",
                                              month: "short",
                                              day: "numeric",
                                            })
                                        : new Date(
                                            dose.date
                                          ).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                          })
                                      : "N/A"}
                                  </Text>
                                </View>
                              </View>

                              <View className="flex-row items-center">
                                <View className="bg-white rounded-full p-2 mr-3">
                                  <Ionicons
                                    name="barcode"
                                    size={16}
                                    color="#6b7280"
                                  />
                                </View>
                                <View>
                                  <Text className="text-xs text-gray-500 mb-1">
                                    Batch
                                  </Text>
                                  <Text className="text-sm font-mono font-semibold text-gray-800">
                                    {dose.batch}
                                  </Text>
                                </View>
                              </View>

                              <View className="flex-row items-center">
                                <View className="bg-white rounded-full p-2 mr-3">
                                  <Ionicons
                                    name="medical"
                                    size={16}
                                    color="#6b7280"
                                  />
                                </View>
                                <View>
                                  <Text className="text-xs text-gray-500 mb-1">
                                    Provider
                                  </Text>
                                  <Text className="text-sm font-semibold text-gray-800">
                                    {dose.provider}
                                  </Text>
                                </View>
                              </View>

                              {dose.facility && dose.facility !== "TBD" && (
                                <View className="flex-row items-center">
                                  <View className="bg-white rounded-full p-2 mr-3">
                                    <Ionicons
                                      name="location"
                                      size={16}
                                      color="#6b7280"
                                    />
                                  </View>
                                  <View>
                                    <Text className="text-xs text-gray-500 mb-1">
                                      Facility
                                    </Text>
                                    <Text className="text-sm font-semibold text-gray-800">
                                      {dose.facility}
                                    </Text>
                                  </View>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Instructions Popup */}
        {showInstructionsPopup && (
          <InstructionsPopup
            visible={showInstructionsPopup}
            onClose={() => {
              setShowInstructionsPopup(false);
              setInstructionsData(null);
              setGeneratingInstructions(false);
              // Don't reset autoPopupTriggered - this prevents the loop
            }}
            instructions={instructionsData?.instructions || ""}
            vaccineName={instructionsData?.vaccineName || ""}
            completedDoseNo={instructionsData?.completedDoseNo || 0}
            totalDoses={instructionsData?.totalDoses || 0}
            loading={generatingInstructions}
          />
        )}

        {/* Custom Alert */}
        <CustomAlert
          visible={customAlert.visible}
          title={customAlert.title}
          message={customAlert.message}
          buttons={customAlert.buttons}
          icon={customAlert.icon}
          onClose={() =>
            setCustomAlert((prev) => ({ ...prev, visible: false }))
          }
        />
      </View>
    </SafeAreaView>
  );
}
