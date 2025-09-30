import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Linking,
  TextInput,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_GOOGLE, MapViewProps, Region } from "react-native-maps";
import { vaccCenterApi, VaccinationCenter } from "../api/vaccCenterApi"; // Assuming this path is correct
import { Ionicons } from "@expo/vector-icons";
import MapViewDirections from "react-native-maps-directions";
import Constants from "expo-constants"; // Import Constants

// 1. USE EXPO CONSTANTS TO SAFELY READ THE API KEY
// NOTE: For Expo to expose this, the variable MUST be prefixed with EXPO_PUBLIC_ in your .env file
const GOOGLE_MAPS_API_KEY = "AIzaSyDhfgoyumPBmt0HVYBc8QzFZ6LJDAGI1Uc"

const { width } = Dimensions.get("window");

const VaccinationCentersScreen = () => {
  const mapRef = useRef<MapView>(null);
  const [centers, setCenters] = useState<VaccinationCenter[]>([]);
  const [filteredCenters, setFilteredCenters] = useState<VaccinationCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<VaccinationCenter | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVaccineType, setSelectedVaccineType] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [vaccineTypes, setVaccineTypes] = useState<string[]>([]);
  const [showDirections, setShowDirections] = useState(false);
  const [directionsCenter, setDirectionsCenter] = useState<VaccinationCenter | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);


  useEffect(() => {
    // 2. IMPORTANT: Check if API Key is available
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "AIzaSyDhfgoyumPBmt0HVYBc8QzFZ6LJDAGI1Uc" || GOOGLE_MAPS_API_KEY === "AIzaSyDhfgoyumPBmt0HVYBc8QzFZ6LJDAGI1Uc") {

    }
    fetchCenters();
  }, []);

  useEffect(() => {
    filterCenters();
  }, [searchQuery, selectedVaccineType, centers]);

  const fetchCenters = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to find nearby centers.");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      setUserLocation({ latitude: lat, longitude: lng });

      // Fetch nearby centers using the user's current location
      const nearbyCenters = await vaccCenterApi.getNearbyCenters(lat, lng, 50000, 50);
      setCenters(nearbyCenters);

      const types = [...new Set(nearbyCenters.flatMap((c) => c.vaccineTypes))];
      setVaccineTypes(types);
    } catch (error) {
      console.error("Failed to fetch centers:", error);
      Alert.alert("Error", "Failed to load vaccination centers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCenters();
    setRefreshing(false);
  };

  const filterCenters = () => {
    let filtered = centers;

    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedVaccineType) {
      filtered = filtered.filter((c) => c.vaccineTypes.includes(selectedVaccineType));
    }

    setFilteredCenters(filtered);
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return "N/A";
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const openInAppDirections = (center: VaccinationCenter) => {
    setDirectionsCenter(center);
    setShowMap(true);
    setShowDirections(true);
    setSelectedCenter(null); // Close the modal
    setRouteInfo(null); // Clear previous route info
  };

  const callCenter = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleDirectionsReady = (result: any) => {
    // 3. Auto-zoom map to show the entire route
    if (mapRef.current) {
        mapRef.current.fitToCoordinates(result.coordinates, {
            edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
            animated: true,
        });
    }

    // 4. Set route information for the overlay card
    setRouteInfo({
        distance: result.distance.toFixed(1),
        duration: Math.round(result.duration).toString(),
    });

    console.log(`Distance: ${result.distance} km`);
    console.log(`Duration: ${result.duration} min`);
  };
  
  const handleDirectionsError = (errorMessage: string) => {
    console.error("Directions Error:", errorMessage);
    Alert.alert("Route Error", "Could not calculate the route. Check your API key or location data.");
    setDirectionsCenter(null);
    setShowDirections(false);
  };

  const renderCenterCard = ({ item }: { item: VaccinationCenter }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedCenter(item)} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Ionicons name="medical" size={24} color="#4A90E2" />
          <Text style={styles.cardTitle}>{item.name}</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Ionicons name="location" size={14} color="#fff" />
          <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.district}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.phone}</Text>
        </View>

        <View style={styles.vaccineContainer}>
          {item.vaccineTypes.slice(0, 3).map((vaccine, idx) => (
            <View key={idx} style={styles.vaccineBadge}>
              <Text style={styles.vaccineText}>{vaccine}</Text>
            </View>
          ))}
          {item.vaccineTypes.length > 3 && (
            <Text style={styles.moreText}>+{item.vaccineTypes.length - 3}</Text>
          )}
        </View>
      </View>

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openInAppDirections(item)}>
          <Ionicons name="navigate" size={18} color="#4A90E2" />
          <Text style={styles.actionBtnText}>Directions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => callCenter(item.phone)}>
          <Ionicons name="call" size={18} color="#4A90E2" />
          <Text style={styles.actionBtnText}>Call</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Finding nearby centers...</Text>
      </View>
    );
  }

  // Determine initial map region based on user location or default to Colombo center
  const initialRegion: Region = {
    latitude: userLocation?.latitude || 6.9271,
    longitude: userLocation?.longitude || 79.8612,
    latitudeDelta: showDirections ? 0.05 : 0.5,
    longitudeDelta: showDirections ? 0.05 : 0.5,
  };


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vaccination Centers</Text>
        <Text style={styles.headerSubtitle}>{filteredCenters.length} centers found</Text>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search centers, districts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowFilters(!showFilters)}>
          <Ionicons name="options-outline" size={20} color="#4A90E2" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconBtn, showMap && styles.iconBtnActive]}
          onPress={() => {
            setShowMap(!showMap);
            // Only clear directions if switching to list view
            if(showMap) { 
              setShowDirections(false);
              setDirectionsCenter(null);
              setRouteInfo(null);
            }
          }}
        >
          <Ionicons name={showMap ? "list" : "map-outline"} size={20} color={showMap ? "#fff" : "#4A90E2"} />
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      {showFilters && (
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsContainer}>
            <TouchableOpacity
              style={[styles.filterChip, !selectedVaccineType && styles.filterChipActive]}
              onPress={() => setSelectedVaccineType(null)}
            >
              <Text style={[styles.filterChipText, !selectedVaccineType && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {vaccineTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.filterChip, selectedVaccineType === type && styles.filterChipActive]}
                onPress={() => setSelectedVaccineType(type === selectedVaccineType ? null : type)}
              >
                <Text style={[styles.filterChipText, selectedVaccineType === type && styles.filterChipTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Map or List View */}
      {showMap ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton
          >
            {/* Show all filtered centers as markers when not showing directions */}
            {!showDirections &&
              filteredCenters.map((c) => (
                <Marker
                  key={c._id}
                  coordinate={{
                    latitude: c.location.coordinates[1],
                    longitude: c.location.coordinates[0],
                  }}
                  title={c.name}
                  description={`${c.district} • ${formatDistance(c.distance)}`}
                  onPress={() => setSelectedCenter(c)}
                >
                  <View style={styles.markerContainer}>
                    <Ionicons name="medical" size={24} color="#fff" />
                  </View>
                </Marker>
              ))}

            {/* Show directions route and markers */}
            {showDirections && directionsCenter && userLocation && (
              <>
                <Marker
                  coordinate={{
                    latitude: directionsCenter.location.coordinates[1],
                    longitude: directionsCenter.location.coordinates[0],
                  }}
                  title={directionsCenter.name}
                >
                  <View style={styles.markerContainer}>
                    <Ionicons name="medical" size={24} color="#fff" />
                  </View>
                </Marker>
                
                <Marker
                    coordinate={userLocation}
                    title="Your Location"
                    pinColor="#007AFF" // Blue for user location
                />

                <MapViewDirections
                  origin={userLocation}
                  destination={{
                    latitude: directionsCenter.location.coordinates[1],
                    longitude: directionsCenter.location.coordinates[0],
                  }}
                  apikey={GOOGLE_MAPS_API_KEY}
                  strokeWidth={4}
                  strokeColor="#4A90E2"
                  optimizeWaypoints={true}
                  onReady={handleDirectionsReady}
                  onError={handleDirectionsError}
                />
              </>
            )}
          </MapView>

          {/* Directions Overlay Card */}
          {showDirections && directionsCenter && routeInfo && (
            <View style={styles.directionsOverlay}>
              <View style={styles.directionsCard}>
                <View style={styles.directionsHeader}>
                  <View style={styles.directionsInfo}>
                    <Ionicons name="navigate" size={24} color="#4A90E2" />
                    <View style={styles.directionsText}>
                      <Text style={styles.directionsTitle}>{directionsCenter.name}</Text>
                      <Text style={styles.directionsSubtitle}>
                        {routeInfo.distance} km • {routeInfo.duration} min
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.closeDirectionsBtn}
                    onPress={() => {
                      setShowDirections(false);
                      setDirectionsCenter(null);
                      setRouteInfo(null);
                      // Recenter map to user location when directions are closed
                      mapRef.current?.animateToRegion(initialRegion, 500); 
                    }}
                  >
                    <Ionicons name="close-outline" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredCenters}
          keyExtractor={(item) => item._id}
          renderItem={renderCenterCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4A90E2"]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="sad-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No vaccination centers found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          }
        />
      )}

      {/* Detail Modal (Unchanged) */}
      <Modal visible={!!selectedCenter} transparent animationType="slide" onRequestClose={() => setSelectedCenter(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="medical" size={32} color="#4A90E2" />
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedCenter(null)}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalTitle}>{selectedCenter?.name}</Text>
              <View style={styles.modalDistanceContainer}>
                <Ionicons name="location" size={16} color="#4A90E2" />
                <Text style={styles.modalDistance}>{formatDistance(selectedCenter?.distance)} away</Text>
              </View>

              {/* Contact Info */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Contact Information</Text>
                <View style={styles.modalInfoRow}>
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <Text style={styles.modalInfoText}>{selectedCenter?.address}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Ionicons name="business-outline" size={20} color="#666" />
                  <Text style={styles.modalInfoText}>{selectedCenter?.district}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalInfoRow}
                  onPress={() => selectedCenter && callCenter(selectedCenter.phone)}
                >
                  <Ionicons name="call-outline" size={20} color="#4A90E2" />
                  <Text style={[styles.modalInfoText, styles.modalLinkText]}>{selectedCenter?.phone}</Text>
                </TouchableOpacity>
              </View>

              {/* Vaccines Available */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Available Vaccines</Text>
                <View style={styles.modalVaccineGrid}>
                  {selectedCenter?.vaccineTypes.map((vaccine, idx) => (
                    <View key={idx} style={styles.modalVaccineBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.modalVaccineText}>{vaccine}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Availability */}
              {selectedCenter && Object.keys(selectedCenter.availability).length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Current Stock</Text>
                  {Object.entries(selectedCenter.availability).map(([vaccine, qty]) => (
                    <View key={vaccine} style={styles.availabilityRow}>
                      <Text style={styles.availabilityVaccine}>{vaccine}</Text>
                      <Text
                        style={[
                          styles.availabilityQty,
                          qty > 50 ? styles.stockHigh : qty > 20 ? styles.stockMedium : styles.stockLow,
                        ]}
                      >
                        {qty} doses
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Opening Hours */}
              {selectedCenter && Object.keys(selectedCenter.openingHours).length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Opening Hours</Text>
                  {Object.entries(selectedCenter.openingHours).map(([day, hours]) => (
                    <View key={day} style={styles.hoursRow}>
                      <Text style={styles.dayText}>{day}</Text>
                      <Text style={styles.hoursText}>{hours}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalActionBtnPrimary]}
                  onPress={() => selectedCenter && openInAppDirections(selectedCenter)}
                >
                  <Ionicons name="navigate" size={20} color="#fff" />
                  <Text style={styles.modalActionBtnTextPrimary}>Get Directions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalActionBtnSecondary]}
                  onPress={() => selectedCenter && callCenter(selectedCenter.phone)}
                >
                  <Ionicons name="call" size={20} color="#4A90E2" />
                  <Text style={styles.modalActionBtnTextSecondary}>Call Center</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F7FA" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECF0",
  },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#1A1A1A" },
  headerSubtitle: { fontSize: 14, color: "#666", marginTop: 4 },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECF0",
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    height: 40,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: "#1A1A1A" },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    marginLeft: 4,
  },
  iconBtnActive: { backgroundColor: "#4A90E2" },
  filterSection: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E8ECF0" },
  filterChipsContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: "#F5F7FA",
    borderRadius: 16,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: "#4A90E2" },
  filterChipText: { fontSize: 13, color: "#666", fontWeight: "500" },
  filterChipTextActive: { color: "#fff" },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  markerContainer: {
    width: 40,
    height: 40,
    backgroundColor: "#4A90E2",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  directionsOverlay: { position: "absolute", top: 20, left: 0, right: 0, paddingHorizontal: 16 },
  directionsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  directionsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  directionsInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  directionsText: { marginLeft: 12, flex: 1 },
  directionsTitle: { fontSize: 16, fontWeight: "bold", color: "#1A1A1A" },
  directionsSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },
  closeDirectionsBtn: { padding: 4 },
  listContent: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F7FA",
  },
  cardTitleContainer: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#1A1A1A", marginLeft: 12, flex: 1 },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  distanceText: { fontSize: 12, fontWeight: "600", color: "#fff", marginLeft: 4 },
  cardContent: { padding: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  infoText: { fontSize: 14, color: "#666", marginLeft: 8 },
  vaccineContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  vaccineBadge: {
    backgroundColor: "#E8F4FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  vaccineText: { fontSize: 12, color: "#4A90E2", fontWeight: "500" },
  moreText: { fontSize: 12, color: "#999", alignSelf: "center" },
  cardFooter: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#F5F7FA" },
  actionBtn: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14 },
  actionBtnText: { fontSize: 14, color: "#4A90E2", fontWeight: "600", marginLeft: 6 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#999", marginTop: 16 },
  emptySubtext: { fontSize: 14, color: "#999", marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 0 },
  modalIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: "#E8F4FD",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: { padding: 4 },
  modalTitle: { fontSize: 24, fontWeight: "bold", color: "#1A1A1A", paddingHorizontal: 20, marginTop: 16 },
  modalDistanceContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, marginTop: 8 },
  modalDistance: { fontSize: 14, color: "#4A90E2", fontWeight: "600", marginLeft: 6 },
  modalSection: { paddingHorizontal: 20, paddingTop: 20 },
  modalSectionTitle: { fontSize: 16, fontWeight: "bold", color: "#1A1A1A", marginBottom: 12 },
  modalInfoRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  modalInfoText: { fontSize: 15, color: "#666", marginLeft: 12, flex: 1 },
  modalLinkText: { color: "#4A90E2" },
  modalVaccineGrid: { flexDirection: "row", flexWrap: "wrap" },
  modalVaccineBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  modalVaccineText: { fontSize: 14, color: "#1A1A1A", marginLeft: 6, fontWeight: "500" },
  availabilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F7FA",
  },
  availabilityVaccine: { fontSize: 15, color: "#1A1A1A", fontWeight: "500" },
  availabilityQty: { fontSize: 15, fontWeight: "600" },
  stockHigh: { color: "#4CAF50" },
  stockMedium: { color: "#FF9800" },
  stockLow: { color: "#F44336" },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F7FA",
  },
  dayText: { fontSize: 15, color: "#1A1A1A", fontWeight: "500", textTransform: "capitalize" },
  hoursText: { fontSize: 15, color: "#666" },
  modalActions: { flexDirection: "row", paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  modalActionBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalActionBtnPrimary: { backgroundColor: "#4A90E2" },
  modalActionBtnSecondary: { backgroundColor: "#E8F4FD" },
  modalActionBtnTextPrimary: { fontSize: 16, fontWeight: "600", color: "#fff", marginLeft: 8 },
  modalActionBtnTextSecondary: { fontSize: 16, fontWeight: "600", color: "#4A90E2", marginLeft: 8 },
});

export default VaccinationCentersScreen;
