//const API_BASE_URL = "http://192.168.1.3:5000";
const API_BASE_URL = "http://10.170.82.39:5000";

// Helper function to get authentication token
const getAuthToken = async (): Promise<string | null> => {
  try {
    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default;
    return await AsyncStorage.getItem("userToken");
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(url, {
    ...options,
    headers,
  });
};

export interface GeminiInstructionsRequest {
  dateOfBirth: string;
  gender?: string;
  vaccineName: string;
  totalDoses: number;
  vaccineDate: string;
  completedDoseNo: number;
  userId?: string;
}

export interface GeminiInstructionsResponse {
  success: boolean;
  message: string;
  data: {
    instructions: string;
    metadata: {
      vaccineName: string;
      totalDoses: number;
      completedDoseNo: number;
      remainingDoses: number;
      generatedAt: string;
    };
  };
}

class GeminiAPI {
  /**
   * Generate vaccine instructions using Gemini AI
   */
  async generateVaccineInstructions(
    requestData: GeminiInstructionsRequest
  ): Promise<GeminiInstructionsResponse> {
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/gemini/generate-instructions`,
        {
          method: "POST",
          body: JSON.stringify(requestData),
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(`Failed to generate instructions: ${errorMessage}`);
      }

      const data: GeminiInstructionsResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Gemini API error:", error);
      throw error;
    }
  }
}

export default new GeminiAPI();
