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
exports.config = exports.Config = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const electron_1 = require("electron");
const Logger_1 = require("./Logger");
class Config {
    constructor() {
        this.configPath = path.join(electron_1.app.getPath('userData'), 'config.json');
        this.config = this.loadConfig();
    }
    static getInstance() {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }
    getDefaultConfig() {
        return {
            theme: 'light',
            autoStart: true,
            window: {
                alwaysOnTop: false,
                dockToSide: true,
                autoHide: true,
                width: 350,
                height: 800,
                dockThreshold: 50,
                dockOffset: 5
            },
            clipboard: {
                maxHistorySize: 100,
                enableAutoSave: true,
                enableNotification: true,
                excludedApps: [],
                enableCodeDetection: true
            },
            pomodoro: {
                workDuration: 25,
                breakDuration: 5,
                longBreakDuration: 15,
                soundEnabled: true,
                autoStartBreak: false,
                sessionsBeforeLongBreak: 4
            }
        };
    }
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf-8');
                const parsedConfig = JSON.parse(configData);
                // 合并默认配置，确保新增的配置项有默认值
                return this.mergeConfig(this.getDefaultConfig(), parsedConfig);
            }
        }
        catch (error) {
            Logger_1.logger.error('Failed to load config, using defaults', error);
        }
        return this.getDefaultConfig();
    }
    mergeConfig(defaultConfig, userConfig) {
        const merged = { ...defaultConfig };
        if (userConfig) {
            // 合并顶级属性
            if (userConfig.theme)
                merged.theme = userConfig.theme;
            if (typeof userConfig.autoStart === 'boolean')
                merged.autoStart = userConfig.autoStart;
            // 合并嵌套对象
            if (userConfig.window) {
                merged.window = { ...defaultConfig.window, ...userConfig.window };
            }
            if (userConfig.clipboard) {
                merged.clipboard = { ...defaultConfig.clipboard, ...userConfig.clipboard };
            }
            if (userConfig.pomodoro) {
                merged.pomodoro = { ...defaultConfig.pomodoro, ...userConfig.pomodoro };
            }
        }
        return merged;
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(updates) {
        this.config = this.mergeConfig(this.config, updates);
        this.saveConfig();
    }
    get(key) {
        return this.config[key];
    }
    set(key, value) {
        this.config[key] = value;
        this.saveConfig();
    }
    // 获取嵌套配置的便捷方法
    getWindowConfig() {
        return this.config.window;
    }
    getClipboardConfig() {
        return this.config.clipboard;
    }
    getPomodoroConfig() {
        return this.config.pomodoro;
    }
    saveConfig() {
        try {
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
            Logger_1.logger.info('Configuration saved successfully');
        }
        catch (error) {
            Logger_1.logger.error('Failed to save configuration', error);
            throw error;
        }
    }
    // 重置配置到默认值
    reset() {
        this.config = this.getDefaultConfig();
        this.saveConfig();
        Logger_1.logger.info('Configuration reset to defaults');
    }
    // 验证配置的有效性
    validate() {
        try {
            const config = this.config;
            // 验证主题
            if (!['light', 'dark', 'blue', 'green'].includes(config.theme)) {
                return false;
            }
            // 验证窗口配置
            if (config.window.width <= 0 || config.window.height <= 0) {
                return false;
            }
            // 验证剪切板配置
            if (config.clipboard.maxHistorySize <= 0) {
                return false;
            }
            // 验证番茄时钟配置
            if (config.pomodoro.workDuration <= 0 ||
                config.pomodoro.breakDuration <= 0 ||
                config.pomodoro.longBreakDuration <= 0) {
                return false;
            }
            return true;
        }
        catch (error) {
            Logger_1.logger.error('Configuration validation failed', error);
            return false;
        }
    }
}
exports.Config = Config;
// 创建全局实例
exports.config = Config.getInstance();
//# sourceMappingURL=Config.js.map