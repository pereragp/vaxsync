"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaccinationCertificateService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
class VaccinationCertificateService {
    static async generateCertificate(data) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({
                    size: 'A4',
                    margin: 50,
                    info: {
                        Title: 'Vaccination Certificate',
                        Author: 'VaxSync',
                        Subject: `Vaccination Certificate for ${data.healthCard.fullName}`,
                        Creator: 'VaxSync Digital Health Platform'
                    }
                });
                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });
                this.generateCertificateContent(doc, data);
                doc.end();
            }
            catch (error) {
                reject(error);
            }
        });
    }
    static generateCertificateContent(doc, data) {
        const { healthCard } = data;
        const vaccinations = healthCard.completedVaccinations || [];
        this.addHeader(doc);
        this.addCertificateTitle(doc);
        this.addPersonalInfo(doc, healthCard);
        this.addVaccinationHistory(doc, vaccinations);
        this.addFooter(doc, data);
    }
    static addHeader(doc) {
        doc.fontSize(24)
            .font('Helvetica-Bold')
            .fillColor('#2563eb')
            .text('VaxSync', 50, 50, { align: 'center' });
        doc.fontSize(12)
            .font('Helvetica')
            .fillColor('#64748b')
            .text('Digital Health Platform', 50, 80, { align: 'center' });
        doc.strokeColor('#e5e7eb')
            .lineWidth(2)
            .moveTo(50, 100)
            .lineTo(545, 100)
            .stroke();
    }
    static addCertificateTitle(doc) {
        doc.fontSize(20)
            .font('Helvetica-Bold')
            .fillColor('#1f2937')
            .text('VACCINATION CERTIFICATE', 50, 130, { align: 'center' });
        doc.fontSize(14)
            .font('Helvetica')
            .fillColor('#6b7280')
            .text('Digital Health Record', 50, 160, { align: 'center' });
    }
    static addPersonalInfo(doc, healthCard) {
        let yPosition = 200;
        doc.fontSize(16)
            .font('Helvetica-Bold')
            .fillColor('#374151')
            .text('Personal Information', 50, yPosition);
        yPosition += 30;
        const personalInfo = [
            { label: 'Full Name:', value: healthCard.fullName },
            { label: 'Date of Birth:', value: new Date(healthCard.dateOfBirth).toLocaleDateString() },
            { label: 'Gender:', value: healthCard.gender },
            { label: 'Card Type:', value: healthCard.cardType === 'user' ? 'Primary User' : 'Dependent' },
            { label: 'Health Card ID:', value: healthCard._id.toString() },
            { label: 'Generated On:', value: new Date().toLocaleDateString() }
        ];
        personalInfo.forEach(info => {
            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#4b5563')
                .text(info.label, 50, yPosition);
            doc.fontSize(12)
                .font('Helvetica')
                .fillColor('#1f2937')
                .text(info.value, 200, yPosition);
            yPosition += 20;
        });
    }
    static addVaccinationHistory(doc, vaccinations) {
        let yPosition = 350;
        doc.fontSize(16)
            .font('Helvetica-Bold')
            .fillColor('#374151')
            .text('Vaccination History', 50, yPosition);
        yPosition += 30;
        if (vaccinations.length === 0) {
            doc.fontSize(12)
                .font('Helvetica')
                .fillColor('#6b7280')
                .text('No completed vaccinations recorded.', 50, yPosition);
            return;
        }
        const groupedVaccinations = this.groupVaccinationsByName(vaccinations);
        groupedVaccinations.forEach((group, index) => {
            doc.fontSize(14)
                .font('Helvetica-Bold')
                .fillColor('#1f2937')
                .text(`${group.vaccineName}`, 50, yPosition);
            yPosition += 25;
            group.doses.forEach((dose, doseIndex) => {
                const doseInfo = [
                    `Dose ${dose.doseNumber} of ${dose.totalDoses}`,
                    `Date: ${new Date(dose.dateCompleted).toLocaleDateString()}`,
                    `Administered by: ${dose.administeredBy || 'Unknown'}`,
                    `Facility: ${dose.facility || 'Health Center'}`,
                    `Certificate: ${dose.certificateNumber || 'N/A'}`
                ];
                doseInfo.forEach(info => {
                    doc.fontSize(10)
                        .font('Helvetica')
                        .fillColor('#4b5563')
                        .text(`  • ${info}`, 70, yPosition);
                    yPosition += 15;
                });
                yPosition += 10;
            });
            yPosition += 10;
            if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
            }
        });
    }
    static addFooter(doc, data) {
        const pageHeight = doc.page.height;
        const footerY = pageHeight - 100;
        doc.strokeColor('#e5e7eb')
            .lineWidth(1)
            .moveTo(50, footerY)
            .lineTo(545, footerY)
            .stroke();
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#6b7280')
            .text(`Certificate ID: ${data.certificateId}`, 50, footerY + 20);
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#6b7280')
            .text(`Generated: ${data.generatedAt.toLocaleString()}`, 50, footerY + 35);
        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#9ca3af')
            .text('This is a digital certificate generated by VaxSync. Please verify with your healthcare provider for official records.', 50, footerY + 50, { width: 495, align: 'justify' });
    }
    static groupVaccinationsByName(vaccinations) {
        const grouped = {};
        vaccinations.forEach(vaccination => {
            const key = vaccination.vaccineName;
            if (!grouped[key]) {
                grouped[key] = {
                    vaccineName: vaccination.vaccineName,
                    manufacturer: vaccination.manufacturer,
                    doses: []
                };
            }
            grouped[key].doses.push({
                doseNumber: vaccination.doseNumber,
                totalDoses: vaccination.totalDoses,
                dateCompleted: vaccination.dateCompleted,
                administeredBy: vaccination.administeredBy,
                facility: vaccination.facility,
                certificateNumber: vaccination.certificateNumber,
                notes: vaccination.notes
            });
        });
        return Object.values(grouped);
    }
    static generateCertificateId(healthCardId) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `VC-${healthCardId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase();
    }
}
exports.VaccinationCertificateService = VaccinationCertificateService;
//# sourceMappingURL=vaccinationCertificateService.js.map