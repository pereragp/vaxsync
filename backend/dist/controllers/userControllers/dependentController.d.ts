import { Request, Response } from "express";
declare const addDependent: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getDependentsByGuardian: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export { addDependent, getDependentsByGuardian };
//# sourceMappingURL=dependentController.d.ts.map