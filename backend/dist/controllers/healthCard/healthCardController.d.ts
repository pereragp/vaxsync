import { Request, Response } from "express";
declare const createUserHealthCard: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const createDependentHealthCard: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const createHealthCardsForUserAndDependents: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getHealthCardByUserId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getHealthCardByDependentId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getAllHealthCardsByUserId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export { createUserHealthCard, createDependentHealthCard, createHealthCardsForUserAndDependents, getHealthCardByUserId, getHealthCardByDependentId, getAllHealthCardsByUserId };
//# sourceMappingURL=healthCardController.d.ts.map