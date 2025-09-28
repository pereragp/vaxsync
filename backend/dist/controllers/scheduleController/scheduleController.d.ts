import { Request, Response } from 'express';
export declare class ScheduleController {
    static createVaccineSchedule(req: Request, res: Response): Promise<void>;
    static getAllVaccineSchedules(req: Request, res: Response): Promise<void>;
    static updateVaccineSchedule(req: Request, res: Response): Promise<void>;
    static updateDoseStatus(req: Request, res: Response): Promise<void>;
    static deleteVaccineSchedule(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=scheduleController.d.ts.map