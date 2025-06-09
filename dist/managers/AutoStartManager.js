"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoStartManager = void 0;
const electron_1 = require("electron");
const Logger_1 = require("../utils/Logger");
const events_1 = require("events");
/**
 * 自启动管理器 - 负责管理应用的开机自启动功能
 */
class AutoStartManager extends events_1.EventEmitter {
    constructor() {
        super();
    }
    /**
     * 启用开机自启动
     */
    enable(options = {}) {
        try {
            const { openAsHidden = true, args = ['--hidden'] } = options;
            electron_1.app.setLoginItemSettings({
                openAtLogin: true,
                openAsHidden,
                args
            });
            Logger_1.logger.info('Auto-start enabled', { openAsHidden, args });
            this.emit('auto-start-enabled', { openAsHidden, args });
        }
        catch (error) {
            Logger_1.logger.error('Failed to enable auto-start:', error);
            throw error;
        }
    }
    /**
     * 禁用开机自启动
     */
    disable() {
        try {
            electron_1.app.setLoginItemSettings({
                openAtLogin: false
            });
            Logger_1.logger.info('Auto-start disabled');
            this.emit('auto-start-disabled');
        }
        catch (error) {
            Logger_1.logger.error('Failed to disable auto-start:', error);
            throw error;
        }
    }
    /**
     * 切换自启动状态
     */
    toggle(options) {
        const currentStatus = this.isEnabled();
        if (currentStatus) {
            this.disable();
            return false;
        }
        else {
            this.enable(options);
            return true;
        }
    }
    /**
     * 检查是否已启用自启动
     */
    isEnabled() {
        try {
            const settings = electron_1.app.getLoginItemSettings();
            return settings.openAtLogin;
        }
        catch (error) {
            Logger_1.logger.error('Failed to check auto-start status:', error);
            return false;
        }
    }
    /**
     * 获取当前自启动设置
     */
    getSettings() {
        try {
            return electron_1.app.getLoginItemSettings();
        }
        catch (error) {
            Logger_1.logger.error('Failed to get auto-start settings:', error);
            return {
                openAtLogin: false,
                openAsHidden: false,
                wasOpenedAtLogin: false,
                wasOpenedAsHidden: false,
                restoreState: false,
                status: 'not-registered',
                executableWillLaunchAtLogin: false,
                launchItems: []
            };
        }
    }
    /**
     * 检查应用是否是通过自启动启动的
     */
    wasStartedAtLogin() {
        try {
            const settings = electron_1.app.getLoginItemSettings();
            return settings.wasOpenedAtLogin;
        }
        catch (error) {
            Logger_1.logger.error('Failed to check if started at login:', error);
            return false;
        }
    }
    /**
     * 检查应用是否是以隐藏方式启动的
     */
    wasStartedHidden() {
        try {
            const settings = electron_1.app.getLoginItemSettings();
            return settings.wasOpenedAsHidden;
        }
        catch (error) {
            Logger_1.logger.error('Failed to check if started hidden:', error);
            return false;
        }
    } /**
     * 处理命令行参数（检查是否包含隐藏启动标志）
     */
    handleCommandLineArgs(argv) {
        const shouldStartHidden = argv.includes('--hidden') || this.wasStartedHidden();
        const isAutoStart = this.wasStartedAtLogin();
        const isFirstRun = false; // 这里将在主进程中传入实际的首次运行状态
        Logger_1.logger.info('Command line args processed', {
            argv,
            shouldStartHidden,
            isAutoStart,
            isFirstRun
        });
        return {
            shouldStartHidden,
            isAutoStart,
            isFirstRun
        };
    }
    /**
     * 配置自启动参数
     */
    configure(settings) {
        if (settings.enabled) {
            this.enable({
                openAsHidden: settings.openAsHidden,
                args: settings.args
            });
        }
        else {
            this.disable();
        }
    }
    /**
     * 重置自启动设置
     */
    reset() {
        Logger_1.logger.info('Resetting auto-start settings');
        this.disable();
    }
    /**
     * 获取自启动状态信息
     */
    getStatusInfo() {
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
    isSupported() {
        try {
            // 尝试获取设置来验证功能是否可用
            electron_1.app.getLoginItemSettings();
            return true;
        }
        catch (error) {
            Logger_1.logger.warn('Auto-start functionality not supported:', error);
            return false;
        }
    }
    /**
     * 销毁管理器
     */
    destroy() {
        this.removeAllListeners();
        Logger_1.logger.info('AutoStartManager destroyed');
    }
}
exports.AutoStartManager = AutoStartManager;
//# sourceMappingURL=AutoStartManager.js.map