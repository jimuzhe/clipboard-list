import { app } from 'electron';
import { logger } from '../utils/Logger';
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
export class AutoStartManager extends EventEmitter {
    constructor() {
        super();
    }
    /**
     * 启用开机自启动
     */
    public enable(options: AutoStartOptions = {}): void {
        try {
            const { openAsHidden = true, args = ['--hidden'] } = options;

            app.setLoginItemSettings({
                openAtLogin: true,
                openAsHidden,
                args
            });

            logger.info('Auto-start enabled', { openAsHidden, args });
            this.emit('auto-start-enabled', { openAsHidden, args });
        } catch (error) {
            logger.error('Failed to enable auto-start:', error);
            throw error;
        }
    }

    /**
     * 禁用开机自启动
     */
    public disable(): void {
        try {
            app.setLoginItemSettings({
                openAtLogin: false
            });

            logger.info('Auto-start disabled');
            this.emit('auto-start-disabled');
        } catch (error) {
            logger.error('Failed to disable auto-start:', error);
            throw error;
        }
    }

    /**
     * 切换自启动状态
     */
    public toggle(options?: {
        openAsHidden?: boolean;
        args?: string[];
    }): boolean {
        const currentStatus = this.isEnabled();

        if (currentStatus) {
            this.disable();
            return false;
        } else {
            this.enable(options);
            return true;
        }
    }

    /**
     * 检查是否已启用自启动
     */
    public isEnabled(): boolean {
        try {
            const settings = app.getLoginItemSettings();
            return settings.openAtLogin;
        } catch (error) {
            logger.error('Failed to check auto-start status:', error);
            return false;
        }
    }

    /**
     * 获取当前自启动设置
     */
    public getSettings() {
        try {
            return app.getLoginItemSettings();
        } catch (error) {
            logger.error('Failed to get auto-start settings:', error);
            return {
                openAtLogin: false,
                openAsHidden: false,
                wasOpenedAtLogin: false,
                wasOpenedAsHidden: false,
                restoreState: false,
                status: 'not-registered' as const,
                executableWillLaunchAtLogin: false,
                launchItems: []
            };
        }
    }

    /**
     * 检查应用是否是通过自启动启动的
     */
    public wasStartedAtLogin(): boolean {
        try {
            const settings = app.getLoginItemSettings();
            return settings.wasOpenedAtLogin;
        } catch (error) {
            logger.error('Failed to check if started at login:', error);
            return false;
        }
    }

    /**
     * 检查应用是否是以隐藏方式启动的
     */
    public wasStartedHidden(): boolean {
        try {
            const settings = app.getLoginItemSettings();
            return settings.wasOpenedAsHidden;
        } catch (error) {
            logger.error('Failed to check if started hidden:', error);
            return false;
        }
    }

    /**
     * 处理命令行参数（检查是否包含隐藏启动标志）
     */
    public handleCommandLineArgs(argv: string[]): {
        shouldStartHidden: boolean;
        isAutoStart: boolean;
    } {
        const shouldStartHidden = argv.includes('--hidden') || this.wasStartedHidden();
        const isAutoStart = this.wasStartedAtLogin();

        logger.info('Command line args processed', {
            argv,
            shouldStartHidden,
            isAutoStart
        });

        return {
            shouldStartHidden,
            isAutoStart
        };
    }

    /**
     * 配置自启动参数
     */
    public configure(settings: {
        enabled: boolean;
        openAsHidden?: boolean;
        args?: string[];
    }): void {
        if (settings.enabled) {
            this.enable({
                openAsHidden: settings.openAsHidden,
                args: settings.args
            });
        } else {
            this.disable();
        }
    }

    /**
     * 重置自启动设置
     */
    public reset(): void {
        logger.info('Resetting auto-start settings');
        this.disable();
    }

    /**
     * 获取自启动状态信息
     */
    public getStatusInfo() {
        const settings = this.getSettings();

        return {
            enabled: this.isEnabled(),
            wasStartedAtLogin: this.wasStartedAtLogin(),
            wasStartedHidden: this.wasStartedHidden(),
            currentSettings: settings
        };
    }

    /**
     * 验证自启动功能是否可用
     */
    public isSupported(): boolean {
        try {
            // 尝试获取设置来验证功能是否可用
            app.getLoginItemSettings();
            return true;
        } catch (error) {
            logger.warn('Auto-start functionality not supported:', error);
            return false;
        }
    }

    /**
     * 销毁管理器
     */
    public destroy(): void {
        this.removeAllListeners();
        logger.info('AutoStartManager destroyed');
    }
}
