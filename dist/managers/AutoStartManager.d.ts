import { EventEmitter } from 'events';
/**
 * 自启动选项接口
 */
export interface AutoStartOptions {
    openAsHidden?: boolean;
    args?: string[];
}
/**
 * 自启动管理器 - 负责管理应用的开机自启动功能
 */
export declare class AutoStartManager extends EventEmitter {
    constructor();
    /**
     * 启用开机自启动
     */
    enable(options?: AutoStartOptions): void;
    /**
     * 禁用开机自启动
     */
    disable(): void;
    /**
     * 切换自启动状态
     */
    toggle(options?: {
        openAsHidden?: boolean;
        args?: string[];
    }): boolean;
    /**
     * 检查是否已启用自启动
     */
    isEnabled(): boolean;
    /**
     * 获取当前自启动设置
     */
    getSettings(): Electron.LoginItemSettings;
    /**
     * 检查应用是否是通过自启动启动的
     */
    wasStartedAtLogin(): boolean;
    /**
     * 检查应用是否是以隐藏方式启动的
     */
    wasStartedHidden(): boolean;
    /**
     * 处理命令行参数（检查是否包含隐藏启动标志）
     */
    handleCommandLineArgs(argv: string[]): {
        shouldStartHidden: boolean;
        isAutoStart: boolean;
    };
    /**
     * 配置自启动参数
     */
    configure(settings: {
        enabled: boolean;
        openAsHidden?: boolean;
        args?: string[];
    }): void;
    /**
     * 重置自启动设置
     */
    reset(): void;
    /**
     * 获取自启动状态信息
     */
    getStatusInfo(): {
        enabled: boolean;
        wasStartedAtLogin: boolean;
        wasStartedHidden: boolean;
        currentSettings: Electron.LoginItemSettings;
    };
    /**
     * 验证自启动功能是否可用
     */
    isSupported(): boolean;
    /**
     * 销毁管理器
     */
    destroy(): void;
}
//# sourceMappingURL=AutoStartManager.d.ts.map