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
                        Creator: 'VaxSync Digital Vaccination Tracker'
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
        const finalY = this.addVaccinationHistory(doc, vaccinations);
        this.addFooter(doc, data, finalY);
    }
    static addHeader(doc) {
        doc.rect(0, 0, 595, 80)
            .fill('#2563eb');
        doc.fontSize(22)
            .font('Helvetica-Bold')
            .fillColor('#ffffff')
            .text('VaxSync', 50, 25, { align: 'center' });
        doc.fontSize(11)
            .font('Helvetica')
            .fillColor('#dbeafe')
            .text('Digital Vaccination Tracker', 50, 52, { align: 'center' });
    }
    static addCertificateTitle(doc) {
        doc.roundedRect(100, 95, 395, 45, 8)
            .lineWidth(1.5)
            .strokeColor('#2563eb')
            .fillAndStroke('#f0f9ff', '#2563eb');
        doc.fontSize(18)
            .font('Helvetica-Bold')
            .fillColor('#1e40af')
            .text('VACCINATION CERTIFICATE', 50, 107, { align: 'center' });
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#3b82f6')
            .text('Official Immunization Record', 50, 127, { align: 'center' });
    }
    static addPersonalInfo(doc, healthCard) {
        let yPosition = 160;
        doc.roundedRect(50, yPosition, 495, 22, 5)
            .fill('#f3f4f6');
        doc.fontSize(13)
            .font('Helvetica-Bold')
            .fillColor('#1f2937')
            .text('Personal Information', 60, yPosition + 5);
        yPosition += 30;
        doc.roundedRect(50, yPosition, 495, 100, 8)
            .lineWidth(1)
            .strokeColor('#d1d5db')
            .stroke();
        yPosition += 15;
        const personalInfo = [
            { label: 'Full Name:', value: healthCard.fullName },
            { label: 'Date of Birth:', value: new Date(healthCard.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
            { label: 'Gender:', value: healthCard.gender.charAt(0).toUpperCase() + healthCard.gender.slice(1) },
            { label: 'Type:', value: healthCard.cardType === 'user' ? 'Parent' : 'Dependent' },
            { label: 'Generated:', value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }
        ];
        personalInfo.forEach((info, index) => {
            doc.fontSize(9)
                .font('Helvetica-Bold')
                .fillColor('#4b5563')
                .text(info.label, 65, yPosition);
            doc.fontSize(9)
                .font('Helvetica')
                .fillColor('#1f2937')
                .text(info.value, 180, yPosition);
            yPosition += 18;
        });
    }
    static addVaccinationHistory(doc, vaccinations) {
        let yPosition = 300;
        doc.roundedRect(50, yPosition, 495, 22, 5)
            .fill('#f3f4f6');
        doc.fontSize(13)
            .font('Helvetica-Bold')
            .fillColor('#1f2937')
            .text('Vaccination History', 60, yPosition + 5);
        yPosition += 30;
        if (vaccinations.length === 0) {
            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#6b7280')
                .text('No completed vaccinations recorded.', 50, yPosition);
            return yPosition + 30;
        }
        const groupedVaccinations = this.groupVaccinationsByName(vaccinations);
        const totalDoses = vaccinations.length;
        const uniqueVaccines = groupedVaccinations.length;
        doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#6b7280')
            .text(`Total: ${uniqueVaccines} vaccine${uniqueVaccines !== 1 ? 's' : ''} | ${totalDoses} dose${totalDoses !== 1 ? 's' : ''} completed`, 50, yPosition, { align: 'center' });
        yPosition += 20;
        groupedVaccinations.forEach((group, index) => {
            const cardHeight = 25 + (group.doses.length * 60);
            if (yPosition + cardHeight > 750) {
                doc.addPage();
                this.addHeader(doc);
                yPosition = 100;
            }
            doc.roundedRect(50, yPosition, 495, cardHeight, 6)
                .lineWidth(1.5)
                .strokeColor('#2563eb')
                .stroke();
            doc.roundedRect(50, yPosition, 495, 25, 6)
                .fill('#2563eb');
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor('#ffffff')
                .text(group.vaccineName, 60, yPosition + 7);
            if (group.manufacturer) {
                doc.fontSize(8)
                    .font('Helvetica')
                    .fillColor('#dbeafe')
                    .text(`Mfr: ${group.manufacturer}`, 60, yPosition + 7, { align: 'right', width: 475 });
            }
            yPosition += 30;
            group.doses.forEach((dose, doseIndex) => {
                doc.roundedRect(60, yPosition, 20, 20, 10)
                    .lineWidth(1.5)
                    .strokeColor('#10b981')
                    .fillAndStroke('#d1fae5', '#10b981');
                doc.fontSize(10)
                    .font('Helvetica-Bold')
                    .fillColor('#047857')
                    .text(dose.doseNumber.toString(), 60, yPosition + 5, { width: 20, align: 'center' });
                const doseDetails = [
                    { label: 'Dose:', value: `${dose.doseNumber} of ${dose.totalDoses}` },
                    { label: 'Date:', value: new Date(dose.dateCompleted).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) },
                    { label: 'Provider:', value: dose.administeredBy || 'Unknown' },
                    { label: 'Facility:', value: dose.facility || 'Health Center' },
                ];
                if (dose.certificateNumber && dose.certificateNumber !== 'N/A') {
                    doseDetails.push({ label: 'Batch:', value: dose.certificateNumber });
                }
                let detailY = yPosition;
                doseDetails.forEach(detail => {
                    doc.fontSize(8)
                        .font('Helvetica-Bold')
                        .fillColor('#6b7280')
                        .text(detail.label, 90, detailY);
                    doc.fontSize(8)
                        .font('Helvetica')
                        .fillColor('#1f2937')
                        .text(detail.value, 150, detailY, { width: 390 });
                    detailY += 11;
                });
                yPosition += 60;
                if (doseIndex < group.doses.length - 1) {
                    doc.strokeColor('#e5e7eb')
                        .lineWidth(0.5)
                        .moveTo(60, yPosition - 5)
                        .lineTo(535, yPosition - 5)
                        .stroke();
                }
            });
            yPosition += 15;
        });
        return yPosition;
    }
    static addFooter(doc, data, yPosition) {
        const footerY = yPosition + 20;
        doc.strokeColor('#2563eb')
            .lineWidth(2)
            .moveTo(50, footerY)
            .lineTo(545, footerY)
            .stroke();
        const col1X = 50;
        const col2X = 320;
        const metaY = footerY + 15;
        doc.fontSize(8)
            .font('Helvetica-Bold')
            .fillColor('#6b7280')
            .text('Certificate ID:', col1X, metaY);
        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#374151')
            .text(data.certificateId, col1X, metaY + 12);
        doc.fontSize(8)
            .font('Helvetica-Bold')
            .fillColor('#6b7280')
            .text('Date Generated:', col2X, metaY);
        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#374151')
            .text(data.generatedAt.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }), col2X, metaY + 12);
        doc.roundedRect(50, footerY + 42, 495, 20, 4)
            .fill('#f9fafb');
        doc.fontSize(7)
            .font('Helvetica-Oblique')
            .fillColor('#6b7280')
            .text('This digital certificate is generated by VaxSync Digital Vaccination Tracker for record-keeping purposes.', 60, footerY + 48, { width: 475, align: 'center' });
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