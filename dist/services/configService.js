"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.configService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const DEFAULT_TEAM_CONFIG = {
    defaultAnalysisMethod: "recent_messages",
    defaultRecentDays: 7,
    defaultMaxMessages: 50,
    allowedKeywords: ["urgent", "important", "help", "question", "review"],
};
const DEFAULT_USER_CONFIG = {
    analysisMethod: "recent_messages",
    recentDays: 7,
    maxMessages: 50,
    keywords: ["urgent", "important"],
};
class ConfigService {
    constructor() {
        this.CACHE_TTL = 5 * 60 * 1000;
        this.configPath = process.env.CONFIG_PATH || "./data/config.json";
        this.config = { users: {}, teams: {} };
        this.cache = new Map();
        this.loadConfig();
    }
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, "utf8");
                this.config = JSON.parse(data);
            }
            else {
                this.saveConfig();
            }
        }
        catch (error) {
            console.error("Failed to load config:", error);
            this.config = { users: {}, teams: {} };
        }
    }
    saveConfig() {
        try {
            const dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        }
        catch (error) {
            console.error("Failed to save config:", error);
        }
    }
    getCacheKey(type, id) {
        return `${type}:${id}`;
    }
    isCacheValid(timestamp) {
        return Date.now() - timestamp < this.CACHE_TTL;
    }
    getUserConfig(userId) {
        const cacheKey = this.getCacheKey("user", userId);
        const cached = this.cache.get(cacheKey);
        if (cached && this.isCacheValid(cached.timestamp)) {
            return cached.config;
        }
        const userConfig = this.config.users[userId] || { ...DEFAULT_USER_CONFIG };
        this.cache.set(cacheKey, { config: userConfig, timestamp: Date.now() });
        return userConfig;
    }
    setUserConfig(userId, config) {
        const currentConfig = this.getUserConfig(userId);
        const updatedConfig = { ...currentConfig, ...config };
        const cleanConfig = {
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
    resetUserConfig(userId) {
        delete this.config.users[userId];
        this.cache.delete(this.getCacheKey("user", userId));
        this.saveConfig();
    }
    getTeamConfig(teamId) {
        const cacheKey = this.getCacheKey("team", teamId);
        const cached = this.cache.get(cacheKey);
        if (cached && this.isCacheValid(cached.timestamp)) {
            return cached.config;
        }
        const teamConfig = this.config.teams[teamId] || { ...DEFAULT_TEAM_CONFIG };
        this.cache.set(cacheKey, { config: teamConfig, timestamp: Date.now() });
        return teamConfig;
    }
    setTeamConfig(teamId, config) {
        const currentConfig = this.getTeamConfig(teamId);
        const updatedConfig = { ...currentConfig, ...config };
        const cleanConfig = {
            defaultAnalysisMethod: updatedConfig.defaultAnalysisMethod,
            defaultRecentDays: updatedConfig.defaultRecentDays,
            defaultMaxMessages: updatedConfig.defaultMaxMessages,
            allowedKeywords: updatedConfig.allowedKeywords,
        };
        this.config.teams[teamId] = cleanConfig;
        this.cache.delete(this.getCacheKey("team", teamId));
        this.saveConfig();
    }
    resetTeamConfig(teamId) {
        delete this.config.teams[teamId];
        this.cache.delete(this.getCacheKey("team", teamId));
        this.saveConfig();
    }
    getEffectiveUserConfig(userId, teamId) {
        const userConfig = this.getUserConfig(userId);
        const teamConfig = this.getTeamConfig(teamId);
        return {
            analysisMethod: userConfig.analysisMethod || teamConfig.defaultAnalysisMethod,
            recentDays: userConfig.recentDays || teamConfig.defaultRecentDays,
            maxMessages: userConfig.maxMessages || teamConfig.defaultMaxMessages,
            keywords: userConfig.keywords || teamConfig.allowedKeywords,
        };
    }
    validateUserConfig(config) {
        const errors = [];
        if (config.analysisMethod &&
            ![
                "full_history",
                "recent_messages",
                "thread_specific",
                "keyword_based",
            ].includes(config.analysisMethod)) {
            errors.push("Invalid analysis method");
        }
        if (config.recentDays !== undefined &&
            (config.recentDays < 1 || config.recentDays > 365)) {
            errors.push("Recent days must be between 1 and 365");
        }
        if (config.maxMessages !== undefined &&
            (config.maxMessages < 1 || config.maxMessages > 1000)) {
            errors.push("Max messages must be between 1 and 1000");
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
    shareUserConfig(userId, targetUserId) {
        const sourceConfig = this.getUserConfig(userId);
        this.setUserConfig(targetUserId, sourceConfig);
    }
    getAvailableAnalysisMethods() {
        return [
            {
                value: "full_history",
                label: "Full History",
                description: "Analyze the complete conversation history (up to 1 month)",
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
    getDefaultUserConfig() {
        return { ...DEFAULT_USER_CONFIG };
    }
    getDefaultTeamConfig() {
        return { ...DEFAULT_TEAM_CONFIG };
    }
}
exports.configService = new ConfigService();
//# sourceMappingURL=configService.js.map