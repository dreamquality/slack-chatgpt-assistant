import { App } from "@slack/bolt";
export declare class SSOHandler {
    private authService;
    constructor();
    handleSSO(req: any, res: any): Promise<any>;
    handleLogout(_req: any, res: any): Promise<void>;
}
export declare function registerSSOHandler(app: App): void;
//# sourceMappingURL=ssoHandler.d.ts.map