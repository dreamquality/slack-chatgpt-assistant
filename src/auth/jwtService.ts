import jwt, { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";

export class JWTService {
  static generateToken(payload: any): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    const options: SignOptions = {
      expiresIn: (process.env.JWT_EXPIRES_IN as StringValue) || "24h",
    };

    return jwt.sign(payload, secret, options);
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
