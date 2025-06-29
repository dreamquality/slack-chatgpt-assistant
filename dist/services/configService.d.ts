export interface UserConfig {
    analysisMethod: AnalysisMethod;
    recentDays?: number;
    keywords?: string[];
    maxMessages?: number;
}
export interface TeamConfig {
    defaultAnalysisMethod: AnalysisMethod;
    defaultRecentDays: number;
    defaultMaxMessages: number;
    allowedKeywords: string[];
}
export interface ConfigData {
    users: {
        [userId: string]: UserConfig;
    };
    teams: {
        [teamId: string]: TeamConfig;
    };
}
export type AnalysisMethod = "full_history" | "recent_messages" | "thread_specific" | "keyword_based";
declare class ConfigService {
    private configPath;
    private config;
    private cache;
    private readonly CACHE_TTL;
    constructor();
    private loadConfig;
    private saveConfig;
    private getCacheKey;
    private isCacheValid;
    getUserConfig(userId: string): UserConfig;
    setUserConfig(userId: string, config: Partial<UserConfig>): void;
    resetUserConfig(userId: string): void;
    getTeamConfig(teamId: string): TeamConfig;
    setTeamConfig(teamId: string, config: Partial<TeamConfig>): void;
    resetTeamConfig(teamId: string): void;
    getEffectiveUserConfig(userId: string, teamId: string): UserConfig;
    validateUserConfig(config: Partial<UserConfig>): {
        isValid: boolean;
        errors: string[];
    };
    shareUserConfig(userId: string, targetUserId: string): void;
    getAvailableAnalysisMethods(): {
        value: AnalysisMethod;
        label: string;
        description: string;
    }[];
    getDefaultUserConfig(): UserConfig;
    getDefaultTeamConfig(): TeamConfig;
}
export declare const configService: ConfigService;
export {};
//# sourceMappingURL=configService.d.ts.map