import { Response, NextFunction } from 'express';
import { AuthRequest, IUser } from '../types';
interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
}
export declare const generateToken: (user: IUser) => string;
export declare const generateRefreshToken: (user: IUser) => string;
export declare const verifyToken: (token: string) => JWTPayload;
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validateUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireHealthcareProvider: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const requireParent: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validateDependentAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const userRateLimit: (maxRequests: number, windowMs: number) => (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const validateApiKey: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const logAuthEvents: (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare const validateRefreshToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
declare const _default: {
    generateToken: (user: IUser) => string;
    generateRefreshToken: (user: IUser) => string;
    verifyToken: (token: string) => JWTPayload;
    authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    optionalAuth: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    validateUser: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireHealthcareProvider: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    requireParent: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    validateDependentAccess: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    userRateLimit: (maxRequests: number, windowMs: number) => (req: AuthRequest, res: Response, next: NextFunction) => void;
    validateApiKey: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
    logAuthEvents: (req: AuthRequest, res: Response, next: NextFunction) => void;
    validateRefreshToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
//# sourceMappingURL=auth.d.ts.map