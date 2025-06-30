"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAuth = void 0;
const googleAuthService_1 = require("./googleAuthService");
const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        res.status(401).json({
            success: false,
            error: "No token provided",
        });
        return;
    }
    try {
        const authService = new googleAuthService_1.GoogleAuthService();
        const user = authService.verifyJWT(token);
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: "Invalid token",
        });
    }
};
exports.requireAuth = requireAuth;
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
        try {
            const authService = new googleAuthService_1.GoogleAuthService();
            const user = authService.verifyJWT(token);
            req.user = user;
        }
        catch (error) {
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=authMiddleware.js.map