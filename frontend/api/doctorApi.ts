const BASE_URL = "http://10.170.82.39:5000"; //Pramod URL

// Types
export interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  hospitals: string[];
  rating: number;
  availability: string;
  imageUrls: string[];
  doc990Id: string;
  doc990Link: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Enhanced error handling
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Network timeout configuration
const TIMEOUT_DURATION = 10000; // 10 seconds

// Helper to create timeout promise
const timeoutPromise = (ms: number) => {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new ApiError("Request timeout", 408)), ms)
  );
};

// Generic API request with better error handling
const apiRequest = async <T>(
  endpoint = "",
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  if (!BASE_URL) {
    throw new ApiError(
      "API Base URL is not defined. Please check your configuration."
    );
  }

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  };

  const fullUrl = `${BASE_URL}${endpoint}`;

  try {
    // Add timeout to prevent hanging requests
    const fetchPromise = fetch(fullUrl, config);
    const response = (await Promise.race([
      fetchPromise,
      timeoutPromise(TIMEOUT_DURATION),
    ])) as Response;

    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        // If not JSON, use the text response
        errorMessage = errorText || errorMessage;
      }

      throw new ApiError(errorMessage, response.status);
    }

    // Parse JSON response
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new ApiError("Invalid response format - expected JSON");
    }

    const data: ApiResponse<T> = await response.json();

    // Check API-level success
    if (!data.success) {
      throw new ApiError(data.message || data.error || "API request failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);

    // Handle different types of errors
    if (error instanceof ApiError) {
      throw error;
    }

    // Network errors
    if (
      error instanceof TypeError &&
      error.message.includes("Network request failed")
    ) {
      throw new ApiError(
        `Cannot connect to server. Please check:\n• Your server is running on ${BASE_URL}\n• Your IP address is correct\n• Both devices are on the same network`,
        0,
        "NETWORK_ERROR"
      );
    }

    // Other fetch errors
    if (error instanceof Error) {
      throw new ApiError(error.message);
    }

    throw new ApiError("Unknown error occurred");
  }
};

// Doctor API functions with enhanced error handling
export const doctorApi = {
  /**
   * Test connection to the server
   */
  testConnection: async (): Promise<boolean> => {
    try {
      console.log("Testing connection...");
      await apiRequest("");
      console.log("Connection test successful");
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  },

  /**
   * Get all doctors, optional search by name/specialty
   */
  getAllDoctors: async (query?: string): Promise<Doctor[]> => {
    try {
      const params = new URLSearchParams();
      if (query && query.trim()) {
        params.append("q", query.trim());
      }
      const queryString = params.toString() ? `?${params.toString()}` : "";

      const response = await apiRequest<Doctor[]>(`/api/doctors${queryString}`);

      if (!response.data) {
        console.warn("No data received from server");
        return [];
      }

      return response.data;
    } catch (error) {
      console.error("Failed to fetch doctors:", error);

      // Re-throw with more context
      if (error instanceof ApiError) {
        throw new ApiError(
          `Failed to fetch doctors: ${error.message}`,
          error.status,
          error.code
        );
      }
      throw error;
    }
  },

  /**
   * Get doctor by ID
   */
  getDoctorById: async (doctorId: string): Promise<Doctor> => {
    if (!doctorId || !doctorId.trim()) {
      throw new ApiError("Doctor ID is required");
    }

    try {
      const response = await apiRequest<Doctor>(
        `/api/doctors/${doctorId.trim()}`
      );

      if (!response.data) {
        throw new ApiError("Doctor not found");
      }

      return response.data;
    } catch (error) {
      console.error(`Failed to fetch doctor ${doctorId}:`, error);

      if (error instanceof ApiError) {
        throw new ApiError(
          `Failed to fetch doctor: ${error.message}`,
          error.status,
          error.code
        );
      }
      throw error;
    }
  },

  /**
   * Get current configuration info for debugging
   */
  getConfig: () => {
    return {
      baseUrl: BASE_URL,
      timeout: TIMEOUT_DURATION,
    };
  },
};

export default doctorApi;

// Export the error class for use in components
export { ApiError };
