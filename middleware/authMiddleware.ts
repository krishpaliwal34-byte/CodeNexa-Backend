import {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

interface AdminPayload {
  id: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  admin?: AdminPayload;
}

export const verifyAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = req.cookies?.adminToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        message: "JWT_SECRET is missing",
      });
      return;
    }

    const decoded = jwt.verify(
      token,
      jwtSecret
    ) as AdminPayload;

    req.admin = decoded;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};