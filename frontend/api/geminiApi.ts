const API_BASE_URL = "http://10.170.82.39:5000";

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
      const response = await fetch(
        `${API_BASE_URL}/api/gemini/generate-instructions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
