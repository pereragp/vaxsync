import { Response } from 'express';
import { AuthRequest } from '../../types';
export declare class ScheduleController {
    private static syncCompletedDoseToHealthCard;
    static getAvailableVaccines(req: AuthRequest, res: Response): Promise<void>;
    static getVaccineById(req: AuthRequest, res: Response): Promise<void>;
    static createSchedule(req: AuthRequest, res: Response): Promise<void>;
    static getScheduleById(req: AuthRequest, res: Response): Promise<void>;
    static getUserSchedules(req: AuthRequest, res: Response): Promise<void>;
    static updateSchedule(req: AuthRequest, res: Response): Promise<void>;
    static updateDoseStatus(req: AuthRequest, res: Response): Promise<void>;
    static deleteSchedule(req: AuthRequest, res: Response): Promise<void>;
    static syncAllCompletedDosesToHealthCard(req: AuthRequest, res: Response): Promise<void>;
    static getUpcomingSchedules(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=scheduleController.d.ts.map