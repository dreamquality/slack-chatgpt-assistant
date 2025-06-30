import { Request, Response, NextFunction } from "express";
import { JWTService } from "./jwtService";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token =
    req.cookies?.jwt || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = JWTService.verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token =
    req.cookies?.jwt || req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    try {
      const decoded = JWTService.verifyToken(token);
      (req as any).user = decoded;
    } catch (error) {
      // Token is invalid, but we continue without auth
    }
  }

  next();
};
