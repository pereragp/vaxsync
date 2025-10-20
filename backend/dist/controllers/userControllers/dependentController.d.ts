import { Request, Response } from "express";
interface AuthenticatedRequest extends Request {
    user?: any;
}
declare const addDependent: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getDependentsByGuardian: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const updateDependent: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const removeDependent: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export { addDependent, getDependentsByGuardian, updateDependent, removeDependent };
//# sourceMappingURL=dependentController.d.ts.map