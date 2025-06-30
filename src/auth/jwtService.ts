import jwt from "jsonwebtoken";

export class JWTService {
  static generateToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    });
  }

  static verifyToken(token: string): any {
    return jwt.verify(token, process.env.JWT_SECRET!);
  }

  static decodeToken(token: string): any {
    return jwt.decode(token);
  }
}
