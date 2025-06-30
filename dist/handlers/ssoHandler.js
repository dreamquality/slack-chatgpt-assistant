"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSOHandler = void 0;
exports.registerSSOHandler = registerSSOHandler;
const googleAuthService_1 = require("../auth/googleAuthService");
class SSOHandler {
    constructor() {
        this.authService = new googleAuthService_1.GoogleAuthService();
    }
    async handleSSO(req, res) {
        try {
            const { code } = req.query;
            if (!code) {
                return res.status(400).json({
                    success: false,
                    error: "Authorization code is required",
                });
            }
            const tokens = await this.authService.getTokens(code);
            const userInfo = await this.authService.getUserInfo(tokens.access_token);
            const jwt = this.authService.generateJWT(userInfo);
            res.json({
                success: true,
                message: "Authentication successful",
                token: jwt,
                user: userInfo,
            });
        }
        catch (error) {
            console.error("SSO callback error", { error });
            res.status(500).json({
                success: false,
                error: "Failed to exchange authorization code for tokens",
            });
        }
    }
    async handleLogout(_req, res) {
        res.json({
            success: true,
            message: "Logout successful",
        });
    }
}
exports.SSOHandler = SSOHandler;
function registerSSOHandler(app) {
    const handler = new SSOHandler();
    const expressApp = app.receiver?.app;
    if (expressApp && typeof expressApp.get === "function") {
        expressApp.get("/auth/google", (_req, res) => {
            const authUrl = handler["authService"].getAuthUrl();
            res.redirect(authUrl);
        });
        expressApp.get("/auth/google/callback", async (req, res) => {
            await handler.handleSSO(req, res);
        });
        expressApp.get("/auth/logout", (_req, res) => {
            res.clearCookie("jwt");
            res.redirect("/");
        });
        expressApp.get("/auth/me", (req, res) => {
            const token = req.cookies?.jwt;
            if (!token) {
                return res.status(401).json({ error: "Not authenticated" });
            }
            try {
                const user = handler["authService"].verifyJWT(token);
                res.json({ user });
            }
            catch (error) {
                res.status(401).json({ error: "Invalid token" });
            }
        });
    }
}
//# sourceMappingURL=ssoHandler.js.map