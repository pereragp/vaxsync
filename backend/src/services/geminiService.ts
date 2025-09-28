import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    //const apiKey = process.env.GEMINI_API_KEY;
    const apiKey = 'AIzaSyAOajTN7bvCGezTeqa_oVbKaYYQXFz5PVE';
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate post-vaccination instructions based on user and vaccination data
   */
  async generateVaccineInstructions(userData: {
    dateOfBirth: Date;
    gender?: string;
    vaccineName: string;
    totalDoses: number;
    vaccineDate: Date;
    completedDoseNo: number;
  }): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Calculate age from date of birth
      const age = Math.floor((Date.now() - new Date(userData.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365));

      const prompt = `You are a medical AI assistant providing concise, immediate post-vaccination care advice for a mobile push notification.

Based on the following vaccination details, generate a very brief (max 150 characters total) but actionable message focused on immediate care and next steps.

**Input Variables:**
- Age: ${age}
- Vaccine: ${userData.vaccineName}
- Completed Doses: ${userData.completedDoseNo} of ${userData.totalDoses}
- Next Dose Required (Yes/No, inferred from completed doses and total doses)

**Instructions for Output:**
1.  **Format:** Provide the output as a single, short string.
2.  **Length:** Do not exceed **150 characters** total.
3.  **Content:** The message must include:
    * Acknowledge normal **side effects** (e.g., pain/fatigue).
    * One **immediate care tip** (e.g., rest, cool compress).
    * A call-to-action to check for **full instructions** or the **next dose**.
4.  **Tone:** Clear, simple, and direct.

**Example Target Output (Max 150 chars):**
"Vaccine Complete! Mild soreness/fatigue is normal. Rest & use a cool compress. Tap to see your next dose date and full care guide."

**Final Output:** Generate only the short notification message.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text();
    } catch (error) {
      console.error('Error generating vaccine instructions:', error);
      throw new Error('Failed to generate vaccine instructions');
    }
  }

  
}

export default new GeminiService();
