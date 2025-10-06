import { IHealthCard } from '../types';
export interface VaccinationCertificateData {
    healthCard: IHealthCard;
    generatedAt: Date;
    certificateId: string;
}
export declare class VaccinationCertificateService {
    static generateCertificate(data: VaccinationCertificateData): Promise<Buffer>;
    private static generateCertificateContent;
    private static addHeader;
    private static addCertificateTitle;
    private static addPersonalInfo;
    private static addVaccinationHistory;
    private static addFooter;
    private static groupVaccinationsByName;
    static generateCertificateId(healthCardId: string): string;
}
//# sourceMappingURL=vaccinationCertificateService.d.ts.map