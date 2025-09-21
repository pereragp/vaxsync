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

      const prompt = `You are a medical AI assistant providing post-vaccination care instructions. 

Based on the following vaccination details, provide comprehensive but concise post-vaccination care instructions:

**Patient Information:**
- Age: ${age} years old
- Gender: ${userData.gender || 'Not specified'}

**Vaccination Details:**
- Vaccine: ${userData.vaccineName}
- Completed Doses: ${userData.completedDoseNo} of ${userData.totalDoses}
- Date: ${userData.vaccineDate.toLocaleDateString()}

**Instructions:**
Please provide post-vaccination care instructions including:

1. **Immediate Care (First 24 hours):**
   - What to expect (normal side effects)
   - When to seek medical attention
   - Activity restrictions

2. **Follow-up Care:**
   - Timeline for next dose (if applicable)
   - Monitoring requirements
   - Lifestyle recommendations

3. **Special Considerations:**
   - Age-specific advice
   - Any contraindications to watch for

**Format Requirements:**
- Use clear, simple language
- Include bullet points for easy reading
- Keep instructions practical and actionable
- End with a clear medical disclaimer

**Important:** Include a prominent disclaimer that this is general information only and the patient should consult their healthcare provider for personalized medical advice.

Provide instructions in a structured, easy-to-read format suitable for a mobile app notification.`;

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
