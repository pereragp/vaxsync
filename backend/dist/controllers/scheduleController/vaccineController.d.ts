import { Request, Response } from "express";
export declare class VaccinationController {
    static createVaccine(req: Request, res: Response): Promise<void>;
    static getAllVaccines(req: Request, res: Response): Promise<void>;
    static getVaccineById(req: Request, res: Response): Promise<void>;
    static updateVaccine(req: Request, res: Response): Promise<void>;
    static deleteVaccine(req: Request, res: Response): Promise<void>;
    static getVaccineByVaccineId(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=vaccineController.d.ts.map