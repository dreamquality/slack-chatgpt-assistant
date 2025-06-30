import { Request, Response, NextFunction } from "express";
import { GoogleAuthService } from "./googleAuthService";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({
      success: false,
      error: "No token provided",
    });
    return;
  }

  try {
    const authService = new GoogleAuthService();
    const user = authService.verifyJWT(token);

    // Add user to request object
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};

export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    try {
      const authService = new GoogleAuthService();
      const user = authService.verifyJWT(token);
      (req as any).user = user;
    } catch (error) {
      // Token is invalid, but we continue without authentication
    }
  }

  next();
};
