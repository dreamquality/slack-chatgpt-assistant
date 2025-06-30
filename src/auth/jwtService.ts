import jwt from "jsonwebtoken";

export class JWTService {
  static generateToken(payload: any): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    });
  }

  static verifyToken(token: string): any {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    return jwt.verify(token, secret);
  }

  static decodeToken(token: string): any {
    return jwt.decode(token);
  }
}
