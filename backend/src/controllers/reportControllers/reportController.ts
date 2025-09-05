import { Response } from 'express';
import VaccinationRecord from '../../models/scheduleModels/vaccineScheduleModel';
import Report from '../../models/reportModels/report';
import User from '../../models/userModels/user';
import Vaccine from '../../models/scheduleModels/vaccinesModel';
import { AuthRequest, VaccinationAnalytics, ApiResponse, PaginationInfo } from '../../types';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

export class ReportController {
  /**
   * Get vaccination analytics for dashboard
   */
  static async getVaccinationAnalytics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      // Validate user exists
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        } as ApiResponse);
        return;
      }

      // Get all vaccination records for user
      const records = await VaccinationRecord.find({ userId })
        .populate('vaccineId', 'name type manufacturer')
        .sort({ dateAdministered: -1 });

      // Calculate analytics
      const currentDate = new Date();
      const thirtyDaysFromNow = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      const analytics: VaccinationAnalytics = {
        totalVaccinations: records.length,
        completedVaccinations: records.filter(r => r.status === 'completed').length,
        pendingVaccinations: records.filter(r => r.status === 'scheduled').length,
        missedVaccinations: records.filter(r => r.status === 'missed').length,
        upcomingVaccinations: records.filter(r => {
          return r.status === 'scheduled' && 
                 new Date(r.dateScheduled) > currentDate &&
                 new Date(r.dateScheduled) <= thirtyDaysFromNow;
        }).length,
        vaccinationsByYear: await ReportController.getVaccinationsByYear(userId),
        vaccinationsByType: await ReportController.getVaccinationsByType(userId),
        complianceRate: records.length > 0 ? 
          parseFloat(((records.filter(r => r.status === 'completed').length / records.length) * 100).toFixed(2)) : 0
      };

      res.status(200).json({
        success: true,
        message: 'Analytics retrieved successfully',
        data: {
          user: {
            name: user.name,
            userId: user.userId,
            avatar: user.avatar,
            email: user.email
          },
          analytics,
          recentRecords: records.slice(0, 5).map(record => ({
            _id: record._id,
            recordId: record.recordId,
            vaccineName: record.vaccineName,
            doseNumber: record.doseNumber,
            totalDoses: record.totalDoses,
            dateAdministered: record.dateAdministered,
            status: record.status,
            healthcareProvider: record.healthcareProvider
          }))
        }
      } as ApiResponse);

    } catch (error: any) {
      console.error('Get analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * Generate vaccination report
   */
  static async generateVaccinationReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { 
        reportType = 'vaccination_history', 
        format = 'pdf',
        dateRange,
        includeRecords 
      } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        } as ApiResponse);
        return;
      }

      // Build query for vaccination records
      let query: any = { userId };
      
      if (dateRange?.from && dateRange?.to) {
        query.dateAdministered = {
          $gte: new Date(dateRange.from),
          $lte: new Date(dateRange.to)
        };
      }

      if (includeRecords && Array.isArray(includeRecords) && includeRecords.length > 0) {
        query._id = { $in: includeRecords };
      }

      const records = await VaccinationRecord.find(query)
        .populate('vaccineId', 'name manufacturer type')
        .sort({ dateAdministered: -1 });

      // Create report record
      const report = new Report({
        userId,
        reportType,
        title: `${reportType.replace(/_/g, ' ').toUpperCase()} - ${user.name}`,
        format,
        dateRange: dateRange ? {
          from: dateRange.from ? new Date(dateRange.from) : undefined,
          to: dateRange.to ? new Date(dateRange.to) : undefined
        } : undefined,
        includeRecords: records.map(r => r._id)
      });

      let filePath: string | undefined;

      if (format === 'pdf') {
        filePath = await ReportController.generatePDFReport(user, records, report);
        report.filePath = filePath;
      } else if (format === 'json') {
        filePath = await ReportController.generateJSONReport(user, records, report);
        report.filePath = filePath;
      } else if (format === 'csv') {
        filePath = await ReportController.generateCSVReport(user, records, report);
        report.filePath = filePath;
      }

      await report.save();

      res.status(200).json({
        success: true,
        message: 'Report generated successfully',
        data: {
          reportId: report.reportId,
          downloadUrl: `/api/reports/download/${report.reportId}`,
          report: {
            _id: report._id,
            reportId: report.reportId,
            reportType: report.reportType,
            title: report.title,
            format: report.format,
            generatedAt: report.generatedAt,
            recordCount: records.length
          }
        }
      } as ApiResponse);

    } catch (error: any) {
      console.error('Generate report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * Download generated report
   */
  static async downloadReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      
      const report = await Report.findOne({ reportId, isActive: true })
        .populate('userId', 'name email');
      
      if (!report) {
        res.status(404).json({
          success: false,
          message: 'Report not found or has expired'
        } as ApiResponse);
        return;
      }

      if (!report.filePath || !fs.existsSync(report.filePath)) {
        res.status(404).json({
          success: false,
          message: 'Report file not found'
        } as ApiResponse);
        return;
      }

      // Check if report has expired
      if (report.expiresAt < new Date()) {
        res.status(410).json({
          success: false,
          message: 'Report has expired'
        } as ApiResponse);
        return;
      }

      // Increment download count
      report.downloadCount += 1;
      await report.save();

      // Set headers for file download
      const mimeTypes = {
        pdf: 'application/pdf',
        json: 'application/json',
        csv: 'text/csv'
      };

      const fileExtension = path.extname(report.filePath).substring(1) as keyof typeof mimeTypes;
      const mimeType = mimeTypes[fileExtension] || 'application/octet-stream';

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.title}.${fileExtension}"`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Stream the file
      const fileStream = fs.createReadStream(report.filePath);
      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error('File streaming error:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error downloading file'
          } as ApiResponse);
        }
      });

    } catch (error: any) {
      console.error('Download report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * Get user's vaccination history with pagination and filters
   */
  static async getVaccinationHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { 
        page = '1', 
        limit = '10', 
        status, 
        vaccineName,
        dateFrom,
        dateTo,
        sortBy = 'dateAdministered',
        sortOrder = 'desc'
      } = req.query;

      // Build filter query
      let query: any = { userId };
      
      if (status && typeof status === 'string') {
        query.status = status;
      }
      
      if (vaccineName && typeof vaccineName === 'string') {
        query.vaccineName = new RegExp(vaccineName, 'i');
      }
      
      if (dateFrom || dateTo) {
        query.dateAdministered = {};
        if (dateFrom && typeof dateFrom === 'string') {
          query.dateAdministered.$gte = new Date(dateFrom);
        }
        if (dateTo && typeof dateTo === 'string') {
          query.dateAdministered.$lte = new Date(dateTo);
        }
      }

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Build sort object
      const sortDirection = sortOrder === 'asc' ? 1 : -1;
      const sortObj: any = {};
      sortObj[sortBy as string] = sortDirection;
      
      const records = await VaccinationRecord.find(query)
        .populate('vaccineId', 'name manufacturer type')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean();

      const totalRecords = await VaccinationRecord.countDocuments(query);
      const totalPages = Math.ceil(totalRecords / limitNum);

      const pagination: PaginationInfo = {
        currentPage: pageNum,
        totalPages,
        totalRecords,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      };

      res.status(200).json({
        success: true,
        message: 'Vaccination history retrieved successfully',
        data: {
          records,
          pagination,
          filters: {
            status,
            vaccineName,
            dateFrom,
            dateTo
          }
        }
      } as ApiResponse);

    } catch (error: any) {
      console.error('Get vaccination history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve vaccination history',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * Get user's generated reports list
   */
  static async getUserReports(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = '1', limit = '10', reportType } = req.query;

      let query: any = { userId, isActive: true };
      
      if (reportType && typeof reportType === 'string') {
        query.reportType = reportType;
      }

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;
      
      const reports = await Report.find(query)
        .sort({ generatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'name email')
        .lean();

      const totalReports = await Report.countDocuments(query);

      res.status(200).json({
        success: true,
        message: 'Reports retrieved successfully',
        data: {
          reports: reports.map(report => ({
            ...report,
            downloadUrl: `/api/reports/download/${report.reportId}`
          })),
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalReports / limitNum),
            totalRecords: totalReports,
            hasNextPage: pageNum < Math.ceil(totalReports / limitNum),
            hasPreviousPage: pageNum > 1
          }
        }
      } as ApiResponse);

    } catch (error: any) {
      console.error('Get user reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve reports',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * Delete report
   */
  static async deleteReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      
      const report = await Report.findOne({ reportId });
      if (!report) {
        res.status(404).json({
          success: false,
          message: 'Report not found'
        } as ApiResponse);
        return;
      }

      // Check if user owns the report or is admin
      if (report.userId.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        } as ApiResponse);
        return;
      }

      // Delete file if exists
      if (report.filePath && fs.existsSync(report.filePath)) {
        try {
          fs.unlinkSync(report.filePath);
        } catch (fileError) {
          console.error('Error deleting file:', fileError);
        }
      }

      await Report.findOneAndDelete({ reportId });

      res.status(200).json({
        success: true,
        message: 'Report deleted successfully'
      } as ApiResponse);

    } catch (error: any) {
      console.error('Delete report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  /**
   * Share report with others
   */
  static async shareReport(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { reportId } = req.params;
      const { emails, accessLevel = 'read' } = req.body;

      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Email addresses are required'
        } as ApiResponse);
        return;
      }

      const report = await Report.findOne({ reportId });
      if (!report) {
        res.status(404).json({
          success: false,
          message: 'Report not found'
        } as ApiResponse);
        return;
      }

      // Check if user owns the report
      if (report.userId.toString() !== req.user!._id.toString()) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        } as ApiResponse);
        return;
      }

      // Add new shared emails
      const newSharedEmails = emails.map((email: string) => ({
        email: email.toLowerCase(),
        sharedAt: new Date(),
        accessLevel
      }));

      report.sharedWith.push(...newSharedEmails);
      await report.save();

      res.status(200).json({
        success: true,
        message: 'Report shared successfully',
        data: {
          reportId: report.reportId,
          sharedWith: report.sharedWith
        }
      } as ApiResponse);

    } catch (error: any) {
      console.error('Share report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to share report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      } as ApiResponse);
    }
  }

  // HELPER METHODS

  /**
   * Generate PDF report
   */
  private static async generatePDFReport(user: any, records: any[], reportInfo: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Ensure reports directory exists
        const reportsDir = path.join(process.cwd(), 'uploads', 'reports');
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }

        const filename = `${reportInfo.reportId}.pdf`;
        const filePath = path.join(reportsDir, filename);
        
        const doc = new PDFDocument({ 
          margin: 50,
          size: 'A4',
          info: {
            Title: reportInfo.title,
            Author: 'VaxSync',
            Subject: 'Vaccination Report',
            Creator: 'VaxSync Application'
          }
        });
        
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Header
        doc.fontSize(24)
           .fillColor('#4CAF50')
           .text('VaxSync', { align: 'center' });
        
        doc.fontSize(18)
           .fillColor('#333')
           .text('Vaccination Report', { align: 'center' });
        
        doc.fontSize(12)
           .fillColor('#666')
           .text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
             year: 'numeric', 
             month: 'long', 
             day: 'numeric',
             hour: '2-digit',
             minute: '2-digit'
           })}`, { align: 'center' });
        
        doc.moveDown(2);

        // User Information Section
        doc.fontSize(16)
           .fillColor('#333')
           .text('Personal Information', { underline: true });
        
        doc.moveDown(0.5);
        doc.fontSize(12)
           .fillColor('#000');
        
        doc.text(`Name: ${user.name}`);
        doc.text(`ID: ${user.userId}`);
        doc.text(`Email: ${user.email}`);
        doc.text(`Date of Birth: ${user.dateOfBirth.toLocaleDateString()}`);
        doc.text(`Phone: ${user.phone}`);
        
        doc.moveDown(2);

        // Vaccination Records Section
        doc.fontSize(16)
           .fillColor('#333')
           .text('Vaccination History', { underline: true });
        
        doc.moveDown(1);

        if (records.length === 0) {
          doc.fontSize(12)
             .fillColor('#666')
             .text('No vaccination records found for the specified criteria.');
        } else {
          records.forEach((record, index) => {
            // Check if we need a new page
            if (doc.y > doc.page.height - 150) {
              doc.addPage();
            }

            doc.fontSize(14)
               .fillColor('#333')
               .text(`${index + 1}. ${record.vaccineName}`, { continued: false });
            
            doc.fontSize(10)
               .fillColor('#4CAF50')
               .text(`Status: ${record.status.toUpperCase()}`, { align: 'right', continued: false });
            
            doc.fontSize(11)
               .fillColor('#000');
            
            doc.text(`Date Administered: ${record.dateAdministered.toLocaleDateString()}`);
            doc.text(`Dose: ${record.doseNumber} of ${record.totalDoses}`);
            doc.text(`Healthcare Provider: ${record.healthcareProvider.name}`);
            doc.text(`Facility: ${record.healthcareProvider.facility}`);
            doc.text(`Location: ${record.location.name}`);
            doc.text(`Batch Number: ${record.batchNumber}`);
            
            if (record.certificate && record.certificate.certificateNumber) {
              doc.text(`Certificate Number: ${record.certificate.certificateNumber}`);
            }
            
            if (record.notes) {
              doc.text(`Notes: ${record.notes}`);
            }
            
            doc.moveDown(0.8);
          });
        }

        // Footer
        doc.fontSize(8)
           .fillColor('#666')
           .text('This report is generated by VaxSync mobile application. For verification purposes, please contact the healthcare provider.', 
                 { align: 'center' });

        doc.text(`Report ID: ${reportInfo.reportId}`, 
                 { align: 'center' });

        doc.end();

        writeStream.on('finish', () => {
          resolve(filePath);
        });

        writeStream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate JSON report
   */
  private static async generateJSONReport(user: any, records: any[], reportInfo: any): Promise<string> {
    try {
      const reportsDir = path.join(process.cwd(), 'uploads', 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `${reportInfo.reportId}.json`;
      const filePath = path.join(reportsDir, filename);

      const reportData = {
        reportInfo: {
          reportId: reportInfo.reportId,
          title: reportInfo.title,
          generatedAt: new Date().toISOString(),
          reportType: reportInfo.reportType
        },
        userInfo: {
          name: user.name,
          userId: user.userId,
          email: user.email,
          dateOfBirth: user.dateOfBirth,
          phone: user.phone
        },
        vaccinationRecords: records.map(record => ({
          recordId: record.recordId,
          vaccineName: record.vaccineName,
          doseNumber: record.doseNumber,
          totalDoses: record.totalDoses,
          dateAdministered: record.dateAdministered,
          dateScheduled: record.dateScheduled,
          status: record.status,
          healthcareProvider: record.healthcareProvider,
          location: record.location,
          batchNumber: record.batchNumber,
          expiryDate: record.expiryDate,
          certificate: record.certificate,
          notes: record.notes
        })),
        summary: {
          totalRecords: records.length,
          completedVaccinations: records.filter(r => r.status === 'completed').length,
          pendingVaccinations: records.filter(r => r.status === 'scheduled').length,
          missedVaccinations: records.filter(r => r.status === 'missed').length
        }
      };

      fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2));
      return filePath;

    } catch (error) {
      throw new Error(`Failed to generate JSON report: ${error}`);
    }
  }

  /**
   * Generate CSV report
   */
  private static async generateCSVReport(user: any, records: any[], reportInfo: any): Promise<string> {
    try {
      const reportsDir = path.join(process.cwd(), 'uploads', 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `${reportInfo.reportId}.csv`;
      const filePath = path.join(reportsDir, filename);

      // CSV Headers
      const headers = [
        'Record ID',
        'Vaccine Name',
        'Dose Number',
        'Total Doses',
        'Date Administered',
        'Date Scheduled',
        'Status',
        'Healthcare Provider',
        'Facility',
        'Location',
        'Batch Number',
        'Certificate Number',
        'Notes'
      ];

      let csvContent = headers.join(',') + '\n';

      // Add user info as comments
      csvContent += `# Report: ${reportInfo.title}\n`;
      csvContent += `# Generated: ${new Date().toISOString()}\n`;
      csvContent += `# User: ${user.name} (${user.userId})\n`;
      csvContent += `# Total Records: ${records.length}\n\n`;

      // Add data rows
      records.forEach(record => {
        const row = [
          record.recordId,
          `"${record.vaccineName}"`,
          record.doseNumber,
          record.totalDoses,
          record.dateAdministered.toISOString().split('T')[0],
          record.dateScheduled.toISOString().split('T')[0],
          record.status,
          `"${record.healthcareProvider.name}"`,
          `"${record.healthcareProvider.facility}"`,
          `"${record.location.name}"`,
          record.batchNumber,
          record.certificate?.certificateNumber || '',
          `"${record.notes || ''}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      fs.writeFileSync(filePath, csvContent);
      return filePath;

    } catch (error) {
      throw new Error(`Failed to generate CSV report: ${error}`);
    }
  }

  /**
   * Get vaccinations by year for analytics
   */
  private static async getVaccinationsByYear(userId: string): Promise<{ year: number; count: number }[]> {
    try {
      const result = await VaccinationRecord.aggregate([
        { 
          $match: { 
            userId: new mongoose.Types.ObjectId(userId), 
            status: 'completed' 
          } 
        },
        {
          $group: {
            _id: { $year: '$dateAdministered' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return result.map(item => ({
        year: item._id,
        count: item.count
      }));
    } catch (error) {
      console.error('Error getting vaccinations by year:', error);
      return [];
    }
  }

  /**
   * Get vaccinations by type for analytics
   */
  private static async getVaccinationsByType(userId: string): Promise<{ type: string; count: number }[]> {
    try {
      const result = await VaccinationRecord.aggregate([
        { 
          $match: { 
            userId: new mongoose.Types.ObjectId(userId), 
            status: 'completed' 
          } 
        },
        {
          $lookup: {
            from: 'vaccines',
            localField: 'vaccineId',
            foreignField: '_id',
            as: 'vaccine'
          }
        },
        { $unwind: '$vaccine' },
        {
          $group: {
            _id: '$vaccine.type',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return result.map(item => ({
        type: item._id,
        count: item.count
      }));
    } catch (error) {
      console.error('Error getting vaccinations by type:', error);
      return [];
    }
  }
}