import { Request, Response } from "express";
export declare const syncVaccinesToHealthCard: (scheduleId: string) => Promise<void>;
declare const createUserHealthCard: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const createDependentHealthCard: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const createHealthCardsForUserAndDependents: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getHealthCardByUserId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getHealthCardByDependentId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getAllHealthCardsByUserId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const syncCompletedVaccinesToHealthCard: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getHealthCardWithVaccinations: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const deleteVaccinationFromHealthCard: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const downloadVaccinationCertificate: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export { createUserHealthCard, createDependentHealthCard, createHealthCardsForUserAndDependents, getHealthCardByUserId, getHealthCardByDependentId, getAllHealthCardsByUserId, syncCompletedVaccinesToHealthCard, getHealthCardWithVaccinations, deleteVaccinationFromHealthCard, downloadVaccinationCertificate };
//# sourceMappingURL=healthCardController.d.ts.map