declare class GeminiService {
    private genAI;
    constructor();
    generateVaccineInstructions(userData: {
        dateOfBirth: Date;
        gender?: string;
        vaccineName: string;
        totalDoses: number;
        vaccineDate: Date;
        completedDoseNo: number;
    }): Promise<string>;
}
declare const _default: GeminiService;
export default _default;
//# sourceMappingURL=geminiService.d.ts.map