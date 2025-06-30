import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleTokens {
  access_token?: string | null;
  refresh_token?: string | null;
}

export interface JWTUser {
  userId: string;
  email: string;
  name: string;
  provider: string;
}

export class GoogleAuthService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });
  }

  async getTokens(code: string): Promise<GoogleTokens> {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async getUserInfo(accessToken: string): Promise<GoogleUser> {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
    );
    const userInfo = (await response.json()) as any;

    return {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    };
  }

  generateJWT(user: GoogleUser): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: "google",
      },
      process.env.JWT_SECRET!,
      { expiresIn: "24h" }
    );
  }

  verifyJWT(token: string): JWTUser {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTUser;
    return decoded;
  }
}
