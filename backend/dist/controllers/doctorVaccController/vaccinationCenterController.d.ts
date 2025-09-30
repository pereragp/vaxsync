import { Request, Response } from "express";
import { IVaccinationCenter, ApiResponse } from "../../types";
export declare const addVaccinationCenter: (req: Request, res: Response<ApiResponse<IVaccinationCenter>>) => Promise<Response<ApiResponse<IVaccinationCenter>>>;
export declare const getVaccinationCenters: (req: Request, res: Response<ApiResponse<IVaccinationCenter[]>>) => Promise<Response<ApiResponse<IVaccinationCenter[]>>>;
export declare const getVaccinationCenterById: (req: Request, res: Response<ApiResponse<IVaccinationCenter>>) => Promise<Response<ApiResponse<IVaccinationCenter>>>;
//# sourceMappingURL=vaccinationCenterController.d.ts.map