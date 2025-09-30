// Base URL configuration
const BASE_URL = 'http://172.29.6.227:5000'; // Your backend URL
export const Googele_API_KEY = 'AIzaSyDhfgoyumPBmt0HVYBc8QzFZ6LJDAGI1Uc'; // Google API Key

// Types
export interface VaccinationCenter {
  _id: string;
  name: string;
  address: string;
  district: string;
  phone: string;
  location: { coordinates: [number, number] };
  vaccineTypes: string[];
  openingHours: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  distance?: number; // Distance in meters
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ApiError class for consistent error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Network timeout
const TIMEOUT_DURATION = 10000;
const timeoutPromise = (ms: number) =>
  new Promise<never>((_, reject) => setTimeout(() => reject(new ApiError("Request timeout", 408)), ms));

// Generic request helper
const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const config: RequestInit = {
    headers: { "Content-Type": "application/json", Accept: "application/json", ...options.headers },
    ...options,
  };

  try {
    const fetchPromise = fetch(`${BASE_URL}${endpoint}`, config);
    const response = (await Promise.race([fetchPromise, timeoutPromise(TIMEOUT_DURATION)])) as Response;

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try { const json = JSON.parse(errorText); errorMessage = json.message || errorMessage; } catch {}
      throw new ApiError(errorMessage, response.status);
    }

    const data: ApiResponse<T> = await response.json();
    if (!data.success) throw new ApiError(data.message || data.error || "API request failed");
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof TypeError && error.message.includes("Network request failed")) {
      throw new ApiError(
        `Cannot connect to server. Check if backend is running on ${BASE_URL}`,
        0,
        "NETWORK_ERROR"
      );
    }
    throw new ApiError((error as Error).message);
  }
};

// Helper to calculate distance
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Vaccination Center API
export const vaccCenterApi = {
  getNearbyCenters: async (
    lat: number,
    lng: number,
    radius = 5000,
    limit = 10,
    type?: string,
    district?: string,
    q?: string
  ): Promise<VaccinationCenter[]> => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
      limit: limit.toString(),
    });
    if (type) params.append("type", type);
    if (district) params.append("district", district);
    if (q) params.append("q", q);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await apiRequest<VaccinationCenter[]>(`/api/centers${queryString}`);

    // Add distance to each center
    const centers = (response.data || []).map((center) => ({
      ...center,
      distance: calculateDistance(lat, lng, center.location.coordinates[1], center.location.coordinates[0]),
    }));

    return centers;
  },

  getCenterById: async (id: string): Promise<VaccinationCenter> => {
    if (!id.trim()) throw new ApiError("Center ID is required");
    const response = await apiRequest<VaccinationCenter>(`/api/centers/${id}`);
    if (!response.data) throw new ApiError("Center not found");
    return response.data;
  },

  addCenter: async (centerData: Partial<VaccinationCenter>): Promise<VaccinationCenter> => {
    const response = await apiRequest<VaccinationCenter>("/api/centers", {
      method: "POST",
      body: JSON.stringify(centerData),
    });
    if (!response.data) throw new ApiError("Failed to add center");
    return response.data;
  },

  // Get unique districts for filtering
  getDistricts: async (): Promise<string[]> => {
    const response = await apiRequest<VaccinationCenter[]>("/api/centers?limit=1000");
    const districts = [...new Set((response.data || []).map((c) => c.district))];
    return districts.sort();
  },

  // Get unique vaccine types for filtering
  getVaccineTypes: async (): Promise<string[]> => {
    const response = await apiRequest<VaccinationCenter[]>("/api/centers?limit=1000");
    const types = [...new Set((response.data || []).flatMap((c) => c.vaccineTypes))];
    return types.sort();
  },
};

export default vaccCenterApi;