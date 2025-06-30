"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class JWTService {
    static generateToken(payload) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET environment variable is not set");
        }
        const options = {
            expiresIn: process.env.JWT_EXPIRES_IN || "24h",
        };
        return jsonwebtoken_1.default.sign(payload, secret, options);
    }
    static verifyToken(token) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET environment variable is not set");
        }
        return jsonwebtoken_1.default.verify(token, secret);
    }
    static decodeToken(token) {
        return jsonwebtoken_1.default.decode(token);
    }
}
exports.JWTService = JWTService;
//# sourceMappingURL=jwtService.js.map