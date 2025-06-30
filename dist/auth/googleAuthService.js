"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleAuthService = void 0;
const google_auth_library_1 = require("google-auth-library");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class GoogleAuthService {
    constructor() {
        this.oauth2Client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
    }
    getAuthUrl() {
        return this.oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: [
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ],
        });
    }
    async getTokens(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        return tokens;
    }
    async getUserInfo(accessToken) {
        const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
        const userInfo = (await response.json());
        return {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
        };
    }
    generateJWT(user) {
        return jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            name: user.name,
            provider: "google",
        }, process.env.JWT_SECRET, { expiresIn: "24h" });
    }
    verifyJWT(token) {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        return decoded;
    }
}
exports.GoogleAuthService = GoogleAuthService;
//# sourceMappingURL=googleAuthService.js.map