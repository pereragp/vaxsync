import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    //const apiKey = process.env.GEMINI_API_KEY;
    const apiKey = 'AIzaSyA4E4nZU6Zbiqffo3sKrWy513u11kj5U3A';
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
    // Calculate age from date of birth (moved outside try block)
    const age = Math.floor((Date.now() - new Date(userData.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365));
    
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `You are a medical AI assistant providing concise post-vaccination care advice. Generate a brief, point-wise response.

**Input Variables:**
- Age: ${age}
- Vaccine: ${userData.vaccineName}
- Completed Doses: ${userData.completedDoseNo} of ${userData.totalDoses}

**Required Response Format:**
Provide a concise response with these sections (keep each section brief):

1. **About ${userData.vaccineName}:**
   - What it protects against (1-2 sentences)
   - Why it's important (1 sentence)

2. **Care Tips for Age ${age}:**
   - Expected side effects (bullet points)
   - Immediate care steps (bullet points)

3. **Next 24 Hours:**
   - Do's and don'ts (bullet points)
   - When to call doctor (bullet points)

4. **Remaining Doses:**
   - ${userData.completedDoseNo < userData.totalDoses ? `Next dose in X weeks/months` : 'All doses completed'}

**Guidelines:**
- Keep each section under 3 bullet points
- Use simple, clear language
- Focus on actionable advice
- Total response should be concise and easy to scan

**Response Format:**
Use bullet points (•) and keep each point short (1 line max).`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text();
    } catch (error: any) {
      console.error('Error generating vaccine instructions:', error);
      
      // Provide fallback instructions if API fails
      const fallbackInstructions = `**About ${userData.vaccineName}:**
• Protects against specific diseases
• Important for maintaining health

**Care Tips for Age ${age}:**
• Expect mild soreness, fatigue, or low fever
• Side effects usually resolve in 1-2 days

**Next 24 Hours:**
• Rest and stay hydrated
• Apply cool compress if sore
• Avoid strenuous activities

**Remaining Doses:**
${userData.completedDoseNo < userData.totalDoses ? `• Next dose scheduled by your healthcare provider` : '• All doses completed'}

**When to Call Doctor:**
• High fever (over 101°F)
• Severe allergic reactions
• Symptoms that worsen after 2-3 days`;
      
      // Provide more specific error messages
      if (error.message?.includes('404')) {
        console.log('Using fallback instructions due to model not found');
        return fallbackInstructions;
      } else if (error.message?.includes('API key')) {
        throw new Error('Invalid API key. Please check your Gemini API configuration.');
      } else if (error.message?.includes('quota')) {
        console.log('Using fallback instructions due to quota exceeded');
        return fallbackInstructions;
      } else {
        console.log('Using fallback instructions due to unknown error');
        return fallbackInstructions;
      }
    }
  }

  
}

export default new GeminiService();
