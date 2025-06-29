import * as fs from "fs";
import * as path from "path";

export interface UserConfig {
  userId: string;
  analysisMethod:
    | "full_history"
    | "recent_messages"
    | "thread_specific"
    | "keyword_based";
  recentDays?: number;
  keywords?: string[];
  maxMessages?: number;
  lastUpdated: number;
}

export interface TeamConfig {
  teamId: string;
  defaultAnalysisMethod:
    | "full_history"
    | "recent_messages"
    | "thread_specific"
    | "keyword_based";
  defaultRecentDays: number;
  defaultMaxMessages: number;
  lastUpdated: number;
}

class ConfigService {
  private configDir: string;
  private userConfigFile: string;
  private teamConfigFile: string;

  constructor() {
    this.configDir = path.join(process.cwd(), "data");
    this.userConfigFile = path.join(this.configDir, "user-configs.json");
    this.teamConfigFile = path.join(this.configDir, "team-configs.json");
    this.ensureConfigDir();
  }

  private ensureConfigDir(): void {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
  }

  private readJsonFile(filePath: string): any {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, "utf8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`Error reading config file ${filePath}:`, error);
    }
    return {};
  }

  private writeJsonFile(filePath: string, data: any): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (error) {
      console.error(`Error writing config file ${filePath}:`, error);
      throw error;
    }
  }

  private validateUserConfig(config: Partial<UserConfig>): void {
    if (
      config.analysisMethod &&
      ![
        "full_history",
        "recent_messages",
        "thread_specific",
        "keyword_based",
      ].includes(config.analysisMethod)
    ) {
      throw new Error("Invalid analysis method");
    }

    if (
      config.recentDays &&
      (config.recentDays < 1 || config.recentDays > 365)
    ) {
      throw new Error("Recent days must be between 1 and 365");
    }

    if (
      config.maxMessages &&
      (config.maxMessages < 1 || config.maxMessages > 10000)
    ) {
      throw new Error("Max messages must be between 1 and 10000");
    }

    if (
      config.keywords &&
      (!Array.isArray(config.keywords) ||
        config.keywords.some((k) => typeof k !== "string"))
    ) {
      throw new Error("Keywords must be an array of strings");
    }
  }

  async getUserConfig(userId: string): Promise<UserConfig | null> {
    const configs = this.readJsonFile(this.userConfigFile);
    return configs[userId] || null;
  }

  async saveUserConfig(config: UserConfig): Promise<void> {
    try {
      this.validateUserConfig(config);
      const configs = this.readJsonFile(this.userConfigFile);
      configs[config.userId] = {
        ...config,
        lastUpdated: Date.now(),
      };
      this.writeJsonFile(this.userConfigFile, configs);
    } catch (error) {
      console.error("Error saving user config:", error);
      throw error;
    }
  }

  async getTeamConfig(teamId: string): Promise<TeamConfig | null> {
    const configs = this.readJsonFile(this.teamConfigFile);
    return configs[teamId] || null;
  }

  async saveTeamConfig(config: TeamConfig): Promise<void> {
    const configs = this.readJsonFile(this.teamConfigFile);
    configs[config.teamId] = {
      ...config,
      lastUpdated: Date.now(),
    };
    this.writeJsonFile(this.teamConfigFile, configs);
  }

  async updateAnalysisMethod(
    userId: string,
    method: UserConfig["analysisMethod"],
    options?: {
      recentDays?: number;
      keywords?: string[];
      maxMessages?: number;
    }
  ): Promise<void> {
    const existingConfig = await this.getUserConfig(userId);
    const updatedConfig: UserConfig = {
      userId,
      analysisMethod: method,
      recentDays: options?.recentDays || existingConfig?.recentDays || 7,
      keywords: options?.keywords || existingConfig?.keywords || [],
      maxMessages: options?.maxMessages || existingConfig?.maxMessages || 100,
      lastUpdated: Date.now(),
    };

    await this.saveUserConfig(updatedConfig);
  }

  async resetToDefaults(userId: string): Promise<void> {
    const defaultConfig: UserConfig = {
      userId,
      analysisMethod: "full_history",
      recentDays: 7,
      keywords: [],
      maxMessages: 100,
      lastUpdated: Date.now(),
    };

    await this.saveUserConfig(defaultConfig);
  }

  getDefaultConfig(): UserConfig {
    return {
      userId: "",
      analysisMethod: "full_history",
      recentDays: 7,
      keywords: [],
      maxMessages: 100,
      lastUpdated: Date.now(),
    };
  }

  async getUserSpecificSettings(userId: string): Promise<Partial<UserConfig>> {
    const config = await this.getUserConfig(userId);
    if (!config) return {};

    return {
      analysisMethod: config.analysisMethod,
      recentDays: config.recentDays,
      keywords: config.keywords,
      maxMessages: config.maxMessages,
    };
  }

  async shareConfigWithTeam(userId: string, teamId: string): Promise<void> {
    const userConfig = await this.getUserConfig(userId);
    if (!userConfig) {
      throw new Error("No user configuration found to share");
    }

    const teamConfig: TeamConfig = {
      teamId,
      defaultAnalysisMethod: userConfig.analysisMethod,
      defaultRecentDays: userConfig.recentDays || 7,
      defaultMaxMessages: userConfig.maxMessages || 100,
      lastUpdated: Date.now(),
    };

    await this.saveTeamConfig(teamConfig);
  }

  async getTeamSharedConfig(teamId: string): Promise<TeamConfig | null> {
    return await this.getTeamConfig(teamId);
  }

  async resetUserConfig(userId: string): Promise<void> {
    const defaultConfig = this.getDefaultConfig();
    defaultConfig.userId = userId;
    await this.saveUserConfig(defaultConfig);
  }

  async resetTeamConfig(teamId: string): Promise<void> {
    const defaultTeamConfig: TeamConfig = {
      teamId,
      defaultAnalysisMethod: "full_history",
      defaultRecentDays: 7,
      defaultMaxMessages: 100,
      lastUpdated: Date.now(),
    };
    await this.saveTeamConfig(defaultTeamConfig);
  }

  getDefaultSettings(): Partial<UserConfig> {
    return {
      analysisMethod: "full_history",
      recentDays: 7,
      keywords: [],
      maxMessages: 100,
    };
  }
}

export const configService = new ConfigService();
