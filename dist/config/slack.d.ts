import { App, LogLevel } from "@slack/bolt";
export declare const slackConfig: {
    token: string;
    signingSecret: string;
    appToken: string;
    socketMode: boolean;
    logLevel: LogLevel;
};
export declare function createSlackApp(): App<import("@slack/bolt").StringIndexed>;
//# sourceMappingURL=slack.d.ts.map