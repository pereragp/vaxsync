import { Request, Response } from "express";
interface AuthenticatedRequest extends Request {
    user?: any;
}
declare const registerUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getUserById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const loginUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getMyProfile: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const logoutUser: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const updateProfile: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export { registerUser, getUserById, loginUser, getMyProfile, logoutUser, updateProfile, };
//# sourceMappingURL=userController.d.ts.map