import { AppConfig } from '../types';
export declare class Config {
    private static instance;
    private config;
    private configPath;
    private constructor();
    static getInstance(): Config;
    private getDefaultConfig;
    private loadConfig;
    private mergeConfig;
    getConfig(): AppConfig;
    updateConfig(updates: Partial<AppConfig>): void;
    get<K extends keyof AppConfig>(key: K): AppConfig[K];
    set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void;
    getWindowConfig(): import("../types").WindowConfig;
    getClipboardConfig(): import("../types").ClipboardConfig;
    getPomodoroConfig(): import("../types").PomodoroConfig;
    private saveConfig;
    reset(): void;
    validate(): boolean;
}
export declare const config: Config;
//# sourceMappingURL=Config.d.ts.map