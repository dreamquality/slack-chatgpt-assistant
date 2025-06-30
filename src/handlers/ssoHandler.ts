import { App } from "@slack/bolt";
import { GoogleAuthService } from "../auth/googleAuthService";

export class SSOHandler {
  private authService: GoogleAuthService;

  constructor() {
    this.authService = new GoogleAuthService();
  }

  async handleSSO(req: any, res: any) {
    try {
      const { code } = req.query;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: "Authorization code is required",
        });
      }

      const tokens = await this.authService.getTokens(code as string);
      const userInfo = await this.authService.getUserInfo(tokens.access_token!);
      const jwt = this.authService.generateJWT(userInfo);

      res.json({
        success: true,
        message: "Authentication successful",
        token: jwt,
        user: userInfo,
      });
    } catch (error) {
      console.error("SSO callback error", { error });
      res.status(500).json({
        success: false,
        error: "Failed to exchange authorization code for tokens",
      });
    }
  }

  async handleLogout(_req: any, res: any) {
    res.json({
      success: true,
      message: "Logout successful",
    });
  }
}

export function registerSSOHandler(app: App) {
  const handler = new SSOHandler();

  // Get the Express app from the Slack app
  const expressApp = (app as any).receiver?.app;

  if (expressApp && typeof expressApp.get === "function") {
    // Google OAuth2 initiation
    expressApp.get("/auth/google", (_req: any, res: any) => {
      const authUrl = handler["authService"].getAuthUrl();
      res.redirect(authUrl);
    });

    // Google OAuth2 callback
    expressApp.get("/auth/google/callback", async (req: any, res: any) => {
      await handler.handleSSO(req, res);
    });

    // Logout
    expressApp.get("/auth/logout", (_req: any, res: any) => {
      res.clearCookie("jwt");
      res.redirect("/");
    });

    // Get current user
    expressApp.get("/auth/me", (req: any, res: any) => {
      const token = req.cookies?.jwt;

      if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      try {
        const user = handler["authService"].verifyJWT(token);
        res.json({ user });
      } catch (error) {
        res.status(401).json({ error: "Invalid token" });
      }
    });
  }
}
