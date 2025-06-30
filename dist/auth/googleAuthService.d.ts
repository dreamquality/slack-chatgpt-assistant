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
export declare class GoogleAuthService {
    private oauth2Client;
    constructor();
    getAuthUrl(): string;
    getTokens(code: string): Promise<GoogleTokens>;
    getUserInfo(accessToken: string): Promise<GoogleUser>;
    generateJWT(user: GoogleUser): string;
    verifyJWT(token: string): JWTUser;
}
//# sourceMappingURL=googleAuthService.d.ts.map