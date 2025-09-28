import PDFDocument from 'pdfkit';
import { IHealthCard } from '../types';

export interface VaccinationCertificateData {
  healthCard: IHealthCard;
  generatedAt: Date;
  certificateId: string;
}

export class VaccinationCertificateService {
  
  /**
   * Generate a PDF vaccination certificate
   */
  static async generateCertificate(data: VaccinationCertificateData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: 'Vaccination Certificate',
            Author: 'VaxSync',
            Subject: `Vaccination Certificate for ${data.healthCard.fullName}`,
            Creator: 'VaxSync Digital Health Platform'
          }
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Generate the certificate content
        this.generateCertificateContent(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate the certificate content
   */
  private static generateCertificateContent(doc: InstanceType<typeof PDFDocument>, data: VaccinationCertificateData) {
    const { healthCard } = data;
    const vaccinations = healthCard.completedVaccinations || [];

    // Header Section
    this.addHeader(doc);
    
    // Certificate Title
    this.addCertificateTitle(doc);
    
    // Personal Information Section
    this.addPersonalInfo(doc, healthCard);
    
    // Vaccination History Section
    this.addVaccinationHistory(doc, vaccinations);
    
    // Footer Section
    this.addFooter(doc, data);
  }

  /**
   * Add header with logo and organization info
   */
  private static addHeader(doc: InstanceType<typeof PDFDocument>) {
    // Organization name
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#2563eb')
       .text('VaxSync', 50, 50, { align: 'center' });
    
    // Tagline
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#64748b')
       .text('Digital Health Platform', 50, 80, { align: 'center' });
    
    // Decorative line
    doc.strokeColor('#e5e7eb')
       .lineWidth(2)
       .moveTo(50, 100)
       .lineTo(545, 100)
       .stroke();
  }

  /**
   * Add certificate title
   */
  private static addCertificateTitle(doc: InstanceType<typeof PDFDocument>) {
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .fillColor('#1f2937')
       .text('VACCINATION CERTIFICATE', 50, 130, { align: 'center' });
    
    doc.fontSize(14)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('Digital Health Record', 50, 160, { align: 'center' });
  }

  /**
   * Add personal information section
   */
  private static addPersonalInfo(doc: InstanceType<typeof PDFDocument>, healthCard: IHealthCard) {
    let yPosition = 200;
    
    // Section title
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .fillColor('#374151')
       .text('Personal Information', 50, yPosition);
    
    yPosition += 30;
    
    // Personal details
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

  /**
   * Add vaccination history section
   */
  private static addVaccinationHistory(doc: InstanceType<typeof PDFDocument>, vaccinations: any[]) {
    let yPosition = 350;
    
    // Section title
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

    // Group vaccinations by vaccine name
    const groupedVaccinations = this.groupVaccinationsByName(vaccinations);
    
    groupedVaccinations.forEach((group, index) => {
      // Vaccine name header
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1f2937')
         .text(`${group.vaccineName}`, 50, yPosition);
      
      yPosition += 25;
      
      // Vaccine details
      group.doses.forEach((dose: any, doseIndex: number) => {
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
      
      // Check if we need a new page
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
    });
  }

  /**
   * Add footer section
   */
  private static addFooter(doc: InstanceType<typeof PDFDocument>, data: VaccinationCertificateData) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 100;
    
    // Decorative line
    doc.strokeColor('#e5e7eb')
       .lineWidth(1)
       .moveTo(50, footerY)
       .lineTo(545, footerY)
       .stroke();
    
    // Certificate ID
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text(`Certificate ID: ${data.certificateId}`, 50, footerY + 20);
    
    // Generation timestamp
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text(`Generated: ${data.generatedAt.toLocaleString()}`, 50, footerY + 35);
    
    // Disclaimer
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#9ca3af')
       .text('This is a digital certificate generated by VaxSync. Please verify with your healthcare provider for official records.', 
             50, footerY + 50, { width: 495, align: 'justify' });
  }

  /**
   * Group vaccinations by vaccine name for better organization
   */
  private static groupVaccinationsByName(vaccinations: any[]) {
    const grouped: { [key: string]: any } = {};
    
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

  /**
   * Generate a unique certificate ID
   */
  static generateCertificateId(healthCardId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `VC-${healthCardId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase();
  }
}
