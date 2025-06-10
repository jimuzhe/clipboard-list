import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { AppConfig } from '../types';
import { logger } from './Logger';

export class Config {
    private static instance: Config;
    private config: AppConfig;
    private configPath: string;

    private constructor() {
        this.configPath = path.join(app.getPath('userData'), 'config.json');
        this.config = this.loadConfig();
    }

    static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    } private getDefaultConfig(): AppConfig {
        return {
            theme: 'light',
            autoStart: true,
            firstRun: true,
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
            }, pomodoro: {
                workDuration: 25,
                breakDuration: 5,
                longBreakDuration: 15,
                soundEnabled: true,
                autoStartBreak: false,
                sessionsBeforeLongBreak: 4
            },
            online: {
                currentUrl: 'http://8.130.41.186:3000/',
                presetWebsites: [
                    {
                        id: 'yuanbao',
                        name: '元宝',
                        url: 'https://yuanbao.tencent.com/chat/',
                        icon: '🐙',
                        description: 'ai'
                    },
                    {
                        id: 'doubao',
                        name: '豆包',
                        url: 'https://www.doubao.com/chat/',
                        icon: '📚',
                        description: 'ai'
                    },
                    {
                        id: 'baidu',
                        name: '百度',
                        url: 'https://www.baidu.com/',
                        icon: '📖',
                        description: '搜索'
                    },
                    {
                        id: 'chatgpt',
                        name: 'ChatGPT',
                        url: 'https://chat.openai.com',
                        icon: '🤖',
                        description: 'ai'
                    }
                ],
                showPresetButtons: true
            }
        };
    }

    private loadConfig(): AppConfig {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf-8');
                const parsedConfig = JSON.parse(configData);

                // 合并默认配置，确保新增的配置项有默认值
                return this.mergeConfig(this.getDefaultConfig(), parsedConfig);
            }
        } catch (error) {
            logger.error('Failed to load config, using defaults', error);
        }

        return this.getDefaultConfig();
    } private mergeConfig(defaultConfig: AppConfig, userConfig: any): AppConfig {
        const merged = { ...defaultConfig };

        if (userConfig) {
            // 合并顶级属性
            if (userConfig.theme) merged.theme = userConfig.theme;
            if (typeof userConfig.autoStart === 'boolean') merged.autoStart = userConfig.autoStart;
            if (typeof userConfig.firstRun === 'boolean') merged.firstRun = userConfig.firstRun;

            // 合并嵌套对象
            if (userConfig.window) {
                merged.window = { ...defaultConfig.window, ...userConfig.window };
            }
            if (userConfig.clipboard) {
                merged.clipboard = { ...defaultConfig.clipboard, ...userConfig.clipboard };
            } if (userConfig.pomodoro) {
                merged.pomodoro = { ...defaultConfig.pomodoro, ...userConfig.pomodoro };
            }
            if (userConfig.online) {
                merged.online = {
                    ...defaultConfig.online,
                    ...userConfig.online,
                    presetWebsites: userConfig.online.presetWebsites || defaultConfig.online.presetWebsites
                };
            }
        }

        return merged;
    }

    getConfig(): AppConfig {
        return { ...this.config };
    }

    updateConfig(updates: Partial<AppConfig>): void {
        this.config = this.mergeConfig(this.config, updates);
        this.saveConfig();
    }

    get<K extends keyof AppConfig>(key: K): AppConfig[K] {
        return this.config[key];
    }

    set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
        this.config[key] = value;
        this.saveConfig();
    }

    // 获取嵌套配置的便捷方法
    getWindowConfig() {
        return this.config.window;
    }

    getClipboardConfig() {
        return this.config.clipboard;
    } getPomodoroConfig() {
        return this.config.pomodoro;
    }

    getOnlineConfig() {
        return this.config.online;
    }

    private saveConfig(): void {
        try {
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
            logger.info('Configuration saved successfully');
        } catch (error) {
            logger.error('Failed to save configuration', error);
            throw error;
        }
    }

    // 重置配置到默认值
    reset(): void {
        this.config = this.getDefaultConfig();
        this.saveConfig();
        logger.info('Configuration reset to defaults');
    }

    // 验证配置的有效性
    validate(): boolean {
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
        } catch (error) {
            logger.error('Configuration validation failed', error);
            return false;
        }
    }
}

// 创建全局实例
export const config = Config.getInstance();
