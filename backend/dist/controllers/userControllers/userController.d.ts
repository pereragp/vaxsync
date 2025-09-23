import { Request, Response } from "express";
declare const registerUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const getUserById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
declare const loginUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export { registerUser, getUserById, loginUser };
//# sourceMappingURL=userController.d.ts.map