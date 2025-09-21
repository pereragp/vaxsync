import { Response } from 'express';
import { AuthRequest } from '../../types';
export declare class HealthCardController {
    static getHealthCard(req: AuthRequest, res: Response): Promise<void>;
    static createHealthCard(userId: string): Promise<any>;
    static updateHealthCard(req: AuthRequest, res: Response): Promise<void>;
    static getHealthCardByCardId(req: AuthRequest, res: Response): Promise<void>;
    static getHealthCardStats(req: AuthRequest, res: Response): Promise<void>;
    static updateUserInfo(req: AuthRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=healthCardController.d.ts.map