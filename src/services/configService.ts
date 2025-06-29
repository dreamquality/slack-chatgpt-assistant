import * as fs from "fs";
import * as path from "path";

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
  users: { [userId: string]: UserConfig };
  teams: { [teamId: string]: TeamConfig };
}

export type AnalysisMethod =
  | "full_history"
  | "recent_messages"
  | "thread_specific"
  | "keyword_based";

const DEFAULT_TEAM_CONFIG: TeamConfig = {
  defaultAnalysisMethod: "recent_messages",
  defaultRecentDays: 7,
  defaultMaxMessages: 50,
  allowedKeywords: ["urgent", "important", "help", "question", "review"],
};

const DEFAULT_USER_CONFIG: UserConfig = {
  analysisMethod: "recent_messages",
  recentDays: 7,
  maxMessages: 50,
  keywords: ["urgent", "important"],
};

class ConfigService {
  private configPath: string;
  private config: ConfigData;
  private cache: Map<
    string,
    { config: UserConfig | TeamConfig; timestamp: number }
  >;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.configPath = process.env.CONFIG_PATH || "./data/config.json";
    this.config = { users: {}, teams: {} };
    this.cache = new Map();
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, "utf8");
        this.config = JSON.parse(data);
      } else {
        this.saveConfig();
      }
    } catch (error) {
      console.error("Failed to load config:", error);
      this.config = { users: {}, teams: {} };
    }
  }

  private saveConfig(): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error("Failed to save config:", error);
    }
  }

  private getCacheKey(type: "user" | "team", id: string): string {
    return `${type}:${id}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  // User configuration methods
  getUserConfig(userId: string): UserConfig {
    const cacheKey = this.getCacheKey("user", userId);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.config as UserConfig;
    }

    const userConfig = this.config.users[userId] || { ...DEFAULT_USER_CONFIG };
    this.cache.set(cacheKey, { config: userConfig, timestamp: Date.now() });

    return userConfig;
  }

  setUserConfig(userId: string, config: Partial<UserConfig>): void {
    const currentConfig = this.getUserConfig(userId);
    const updatedConfig = { ...currentConfig, ...config };

    // Remove undefined values to avoid TypeScript issues
    const cleanConfig: UserConfig = {
      analysisMethod: updatedConfig.analysisMethod,
    };

    if (updatedConfig.recentDays !== undefined) {
      cleanConfig.recentDays = updatedConfig.recentDays;
    }

    if (updatedConfig.keywords !== undefined) {
      cleanConfig.keywords = updatedConfig.keywords;
    }

    if (updatedConfig.maxMessages !== undefined) {
      cleanConfig.maxMessages = updatedConfig.maxMessages;
    }

    this.config.users[userId] = cleanConfig;
    this.cache.delete(this.getCacheKey("user", userId));
    this.saveConfig();
  }

  resetUserConfig(userId: string): void {
    delete this.config.users[userId];
    this.cache.delete(this.getCacheKey("user", userId));
    this.saveConfig();
  }

  // Team configuration methods
  getTeamConfig(teamId: string): TeamConfig {
    const cacheKey = this.getCacheKey("team", teamId);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.config as TeamConfig;
    }

    const teamConfig = this.config.teams[teamId] || { ...DEFAULT_TEAM_CONFIG };
    this.cache.set(cacheKey, { config: teamConfig, timestamp: Date.now() });

    return teamConfig;
  }

  setTeamConfig(teamId: string, config: Partial<TeamConfig>): void {
    const currentConfig = this.getTeamConfig(teamId);
    const updatedConfig = { ...currentConfig, ...config };

    // Remove undefined values to avoid TypeScript issues
    const cleanConfig: TeamConfig = {
      defaultAnalysisMethod: updatedConfig.defaultAnalysisMethod,
      defaultRecentDays: updatedConfig.defaultRecentDays,
      defaultMaxMessages: updatedConfig.defaultMaxMessages,
      allowedKeywords: updatedConfig.allowedKeywords,
    };

    this.config.teams[teamId] = cleanConfig;
    this.cache.delete(this.getCacheKey("team", teamId));
    this.saveConfig();
  }

  resetTeamConfig(teamId: string): void {
    delete this.config.teams[teamId];
    this.cache.delete(this.getCacheKey("team", teamId));
    this.saveConfig();
  }

  // Utility methods
  getEffectiveUserConfig(userId: string, teamId: string): UserConfig {
    const userConfig = this.getUserConfig(userId);
    const teamConfig = this.getTeamConfig(teamId);

    return {
      analysisMethod:
        userConfig.analysisMethod || teamConfig.defaultAnalysisMethod,
      recentDays: userConfig.recentDays || teamConfig.defaultRecentDays,
      maxMessages: userConfig.maxMessages || teamConfig.defaultMaxMessages,
      keywords: userConfig.keywords || teamConfig.allowedKeywords,
    };
  }

  validateUserConfig(config: Partial<UserConfig>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (
      config.analysisMethod &&
      ![
        "full_history",
        "recent_messages",
        "thread_specific",
        "keyword_based",
      ].includes(config.analysisMethod)
    ) {
      errors.push("Invalid analysis method");
    }

    if (
      config.recentDays !== undefined &&
      (config.recentDays < 1 || config.recentDays > 365)
    ) {
      errors.push("Recent days must be between 1 and 365");
    }

    if (
      config.maxMessages !== undefined &&
      (config.maxMessages < 1 || config.maxMessages > 1000)
    ) {
      errors.push("Max messages must be between 1 and 1000");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Configuration sharing
  shareUserConfig(userId: string, targetUserId: string): void {
    const sourceConfig = this.getUserConfig(userId);
    this.setUserConfig(targetUserId, sourceConfig);
  }

  // Get available analysis methods
  getAvailableAnalysisMethods(): {
    value: AnalysisMethod;
    label: string;
    description: string;
  }[] {
    return [
      {
        value: "full_history",
        label: "Full History",
        description:
          "Analyze the complete conversation history (up to 1 month)",
      },
      {
        value: "recent_messages",
        label: "Recent Messages",
        description: "Focus on recent messages (last 7 days by default)",
      },
      {
        value: "thread_specific",
        label: "Thread Specific",
        description: "Analyze only the current thread conversation",
      },
      {
        value: "keyword_based",
        label: "Keyword Based",
        description: "Filter messages by specific keywords",
      },
    ];
  }

  // Get default configuration
  getDefaultUserConfig(): UserConfig {
    return { ...DEFAULT_USER_CONFIG };
  }

  getDefaultTeamConfig(): TeamConfig {
    return { ...DEFAULT_TEAM_CONFIG };
  }
}

export const configService = new ConfigService();
