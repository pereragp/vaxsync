import { Response } from 'express';
import { AuthRequest } from '../../types';
export declare class ScheduleController {
    static createVaccineSchedule(req: AuthRequest, res: Response): Promise<void>;
    static getAllVaccineSchedules(req: AuthRequest, res: Response): Promise<void>;
    static updateVaccineSchedule(req: AuthRequest, res: Response): Promise<void>;
    static updateDoseStatus(req: AuthRequest, res: Response): Promise<void>;
    static addDoseToSchedule(req: AuthRequest, res: Response): Promise<void>;
    static deleteVaccineSchedule(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=scheduleController.d.ts.map