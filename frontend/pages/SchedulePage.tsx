import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  scheduleService,
  scheduleUtils,
  VaccinationSchedule,
  CreateScheduleRequest,
  UpdateDoseStatusRequest,
} from "../api/scheduleApi";

// Icons as Text Components
const IconText = ({ name, size = 20, color = "#000", style }: any) => {
  const getIcon = (iconName: string) => {
    const icons: { [key: string]: string } = {
      add: "➕",
      edit: "✏",
      delete: "🗑",
      check: "✓",
      close: "✕",
      calendar: "📅",
      syringe: "💉",
      refresh: "🔄",
      sync: "🔄",
      "chevron-down": "⌄",
      "chevron-up": "⌃",
    };
    return icons[iconName] || "•";
  };

  return (
    <Text style={[{ fontSize: size, color }, style]}>{getIcon(name)}</Text>
  );
};

const VaccinationScheduleScreen = () => {
  // State management
  const [schedules, setSchedules] = useState<VaccinationSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<VaccinationSchedule | null>(null);
  const [showDoseModal, setShowDoseModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<VaccinationSchedule | null>(null);
  const [selectedDose, setSelectedDose] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState<CreateScheduleRequest>({
    vaccineId: "",
    vaccineName: "",
    manufacturer: "",
    totalDoses: 1,
    interval: 0,
    dateScheduled: "",
    notes: "",
    healthcareProvider: {
      name: "",
      facility: "",
      contact: "",
    },
  });

  // Load schedules on component mount
  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const response = await scheduleService.getSchedules();
      setSchedules(response.data || []);
    } catch (error) {
      console.error("Error loading schedules:", error);
      Alert.alert("Error", "Failed to load schedules. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSchedules();
    setRefreshing(false);
  };

  const openAddModal = () => {
    setEditingSchedule(null);
    setFormData({
      vaccineId: "",
      vaccineName: "",
      manufacturer: "",
      totalDoses: 1,
      interval: 0,
      dateScheduled: "",
      notes: "",
      healthcareProvider: { name: "", facility: "", contact: "" },
    });
    setModalVisible(true);
  };

  const openEditModal = (schedule: VaccinationSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      vaccineId: schedule.vaccineId || "",
      vaccineName: schedule.vaccineName,
      manufacturer: schedule.healthcareProvider?.name || "",
      totalDoses: schedule.totalDoses,
      interval: schedule.interval,
      dateScheduled: schedule.doses[0]?.dateScheduled || "",
      notes: schedule.notes || "",
      healthcareProvider: {
        name: schedule.healthcareProvider?.name || "",
        facility: schedule.healthcareProvider?.facility || "",
        contact: schedule.healthcareProvider?.contact || "",
      },
    });
    setModalVisible(true);
  };

  const saveSchedule = async () => {
    if (!formData.vaccineName || !formData.dateScheduled) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      if (editingSchedule) {
        // Update existing schedule
        await scheduleService.updateSchedule(editingSchedule._id, formData);
        Alert.alert("Success", "Schedule updated successfully!");
      } else {
        // Create new schedule
        await scheduleService.createSchedule(formData);
        Alert.alert("Success", "Schedule created successfully!");
      }
      setModalVisible(false);
      await loadSchedules();
    } catch (error) {
      console.error("Error saving schedule:", error);
      Alert.alert("Error", "Failed to save schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this schedule?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await scheduleService.deleteSchedule(id);
              Alert.alert("Success", "Schedule deleted successfully!");
              await loadSchedules();
            } catch (error) {
              console.error("Error deleting schedule:", error);
              Alert.alert(
                "Error",
                "Failed to delete schedule. Please try again."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdateDoseStatus = async (
    scheduleId: string,
    doseNumber: number,
    data: UpdateDoseStatusRequest
  ) => {
    try {
      setLoading(true);
      await scheduleService.updateDoseStatus(scheduleId, doseNumber, data);
      Alert.alert("Success", "Dose status updated successfully!");
      setShowDoseModal(false);
      await loadSchedules();
    } catch (error) {
      console.error("Error updating dose status:", error);
      Alert.alert("Error", "Failed to update dose status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncHealthCard = async () => {
    try {
      setLoading(true);
      await scheduleService.syncHealthCard();
      Alert.alert("Success", "Health card synced successfully!");
    } catch (error) {
      console.error("Error syncing health card:", error);
      Alert.alert("Error", "Failed to sync health card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "missed":
        return "#F44336";
      case "cancelled":
        return "#9E9E9E";
      default:
        return "#FF9800";
    }
  };

  const renderScheduleItem = ({ item }: { item: VaccinationSchedule }) => {
    const progressPercentage = scheduleUtils.getProgressPercentage(item);
    const nextDueDose = scheduleUtils.getNextDueDose(item);
    const completedDoses = item.doses.filter(
      (dose) => dose.status === "completed"
    ).length;

    return (
      <View style={styles.scheduleItem}>
        <View style={styles.itemHeader}>
          <Text style={styles.vaccineName}>{item.vaccineName}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: scheduleUtils.getOverallStatusColor(
                  item.overallStatus
                ),
              },
            ]}
          >
            <Text style={styles.statusText}>
              {item.overallStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.dateText}>
          {completedDoses}/{item.totalDoses} doses completed
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progressPercentage}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progressPercentage)}%
          </Text>
        </View>

        {/* Doses List */}
        <View style={styles.dosesContainer}>
          <Text style={styles.dosesTitle}>Doses:</Text>
          {item.doses.map((dose, index) => (
            <View key={index} style={styles.doseItem}>
              <Text style={styles.doseNumber}>Dose {dose.doseNumber}</Text>
              <Text style={styles.doseDate}>
                Scheduled: {scheduleUtils.formatDateTime(dose.dateScheduled)}
              </Text>
              {dose.dateCompleted && (
                <Text style={styles.doseDate}>
                  Completed: {scheduleUtils.formatDateTime(dose.dateCompleted)}
                </Text>
              )}
              <View style={styles.doseStatusContainer}>
                <View
                  style={[
                    styles.doseStatusBadge,
                    { backgroundColor: getStatusColor(dose.status) },
                  ]}
                >
                  <Text style={styles.doseStatusText}>
                    {dose.status.toUpperCase()}
                  </Text>
                </View>
                {dose.status === "scheduled" && (
                  <TouchableOpacity
                    style={styles.doseEditButton}
                    onPress={() => {
                      setSelectedSchedule(item);
                      setSelectedDose(dose);
                      setShowDoseModal(true);
                    }}
                  >
                    <IconText name="edit" size={16} color="#2196F3" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => openEditModal(item)}
          >
            <IconText name="edit" size={16} color="white" />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.statusBtn]}
            onPress={() => {
              setSelectedSchedule(item);
              setShowDoseModal(true);
            }}
          >
            <IconText name="syringe" size={16} color="white" />
            <Text style={styles.actionBtnText}>Manage Doses</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => deleteSchedule(item._id)}
          >
            <IconText name="delete" size={16} color="white" />
            <Text style={styles.actionBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const DoseModal: React.FC = () => {
    const [doseStatus, setDoseStatus] = useState<
      "scheduled" | "completed" | "missed" | "cancelled"
    >("scheduled");
    const [doseNotes, setDoseNotes] = useState("");
    const [dateCompleted, setDateCompleted] = useState("");

    useEffect(() => {
      if (selectedDose) {
        setDoseStatus(selectedDose.status);
        setDoseNotes(selectedDose.notes || "");
        setDateCompleted(
          selectedDose.dateCompleted
            ? scheduleUtils.formatDate(selectedDose.dateCompleted)
            : ""
        );
      }
    }, [selectedDose]);

    const handleDoseUpdate = () => {
      if (!selectedSchedule || !selectedDose) return;
      const updateData: UpdateDoseStatusRequest = {
        status: doseStatus,
        notes: doseNotes,
        dateCompleted: dateCompleted || undefined,
      };
      handleUpdateDoseStatus(
        selectedSchedule._id,
        selectedDose.doseNumber,
        updateData
      );
    };

    return (
      <Modal visible={showDoseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Dose Status</Text>
              <TouchableOpacity onPress={() => setShowDoseModal(false)}>
                <IconText name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.doseInfo}>
              {selectedSchedule?.vaccineName} - Dose {selectedDose?.doseNumber}
            </Text>

            <View style={styles.statusSelector}>
              <Text style={styles.selectorLabel}>Status:</Text>
              <View style={styles.statusOptions}>
                {["scheduled", "completed", "missed", "cancelled"].map(
                  (status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusOption,
                        doseStatus === status && styles.statusOptionSelected,
                      ]}
                      onPress={() => setDoseStatus(status as any)}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          doseStatus === status &&
                            styles.statusOptionTextSelected,
                        ]}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Notes (optional)"
              value={doseNotes}
              onChangeText={setDoseNotes}
              multiline
            />

            <TextInput
              style={styles.input}
              placeholder="Completion Date (YYYY-MM-DD) - optional"
              value={dateCompleted}
              onChangeText={setDateCompleted}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowDoseModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleDoseUpdate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vaccination Schedule</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSyncHealthCard}
            disabled={loading}
          >
            <IconText name="sync" size={16} color="white" />
            <Text style={styles.syncButtonText}>Sync Health Card</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <IconText name="add" size={16} color="white" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading schedules...</Text>
        </View>
      ) : (
        <FlatList
          data={schedules}
          renderItem={renderScheduleItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconText name="syringe" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No schedules found</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add a new schedule
              </Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSchedule ? "Edit Schedule" : "Add New Schedule"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconText name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Vaccine Name *"
              value={formData.vaccineName}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, vaccineName: text }))
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Manufacturer"
              value={formData.manufacturer}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, manufacturer: text }))
              }
            />

            <View style={styles.rowInputs}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Total Doses *"
                value={formData.totalDoses?.toString() || "1"}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    totalDoses: parseInt(text) || 1,
                  }))
                }
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Interval (days)"
                value={formData.interval?.toString() || "0"}
                onChangeText={(text) =>
                  setFormData((prev) => ({
                    ...prev,
                    interval: parseInt(text) || 0,
                  }))
                }
                keyboardType="numeric"
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Scheduled Date (YYYY-MM-DD) *"
              value={formData.dateScheduled}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, dateScheduled: text }))
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Healthcare Provider Name"
              value={formData.healthcareProvider?.name || ""}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  healthcareProvider: {
                    ...prev.healthcareProvider,
                    name: text,
                  },
                }))
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Facility"
              value={formData.healthcareProvider?.facility || ""}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  healthcareProvider: {
                    ...prev.healthcareProvider,
                    facility: text,
                  },
                }))
              }
            />

            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notes (optional)"
              value={formData.notes}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, notes: text }))
              }
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={saveSchedule}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DoseModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  addButton: {
    backgroundColor: "#2196F3",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
  },
  syncButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  syncButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  scheduleItem: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  vaccineName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    marginRight: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  dosesContainer: {
    marginBottom: 12,
  },
  dosesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  doseItem: {
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  doseNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  doseDate: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  doseStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  doseStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  doseStatusText: {
    color: "white",
    fontSize: 9,
    fontWeight: "600",
  },
  doseEditButton: {
    padding: 4,
  },
  notesText: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  editBtn: {
    backgroundColor: "#FF9800",
  },
  statusBtn: {
    backgroundColor: "#4CAF50",
  },
  deleteBtn: {
    backgroundColor: "#F44336",
  },
  actionBtnText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    width: "90%",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  doseInfo: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  statusSelector: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  statusOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
  },
  statusOptionSelected: {
    backgroundColor: "#2196F3",
  },
  statusOptionText: {
    fontSize: 14,
    color: "#666",
  },
  statusOptionTextSelected: {
    color: "white",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  notesInput: {
    height: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#f0f0f0",
  },
  saveBtn: {
    backgroundColor: "#2196F3",
  },
  cancelBtnText: {
    color: "#666",
    fontWeight: "600",
  },
  saveBtnText: {
    color: "white",
    fontWeight: "600",
  },
});

export default VaccinationScheduleScreen;
