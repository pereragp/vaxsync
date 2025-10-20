import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModels/user";

interface JwtPayload {
  userId: string;
  email: string;
}

interface AuthenticatedRequest extends Request {
  user?: any;
}

const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Not Authorized" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    // Fetch the full user details from database
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
    return;
  } catch (error) {
    res.status(401).json({ message: "Token Failed!!" });
    return;
  }
};

export default protect;
