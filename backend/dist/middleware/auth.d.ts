import { Request, Response, NextFunction } from "express";
interface AuthenticatedRequest extends Request {
    user?: any;
}
declare const protect: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export default protect;
//# sourceMappingURL=auth.d.ts.map