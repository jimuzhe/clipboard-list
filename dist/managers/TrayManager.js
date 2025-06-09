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
exports.TrayManager = void 0;
const electron_1 = require("electron");
const events_1 = require("events");
const path = __importStar(require("path"));
const Logger_1 = require("../utils/Logger");
/**
 * 托盘管理器 - 简化版，只包含核心功能
 * 功能：显示/隐藏、快捷设置（自启动、窗口置顶）、退出
 */
class TrayManager extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.tray = null;
        this.contextMenu = null;
    }
    /**
     * 创建系统托盘
     */
    create() {
        if (this.tray) {
            Logger_1.logger.warn('Tray already exists');
            return;
        }
        try {
            const iconPath = this.getIconPath();
            let icon;
            if (iconPath && iconPath.length > 0) {
                icon = electron_1.nativeImage.createFromPath(iconPath);
            }
            else {
                // 创建一个简单的默认图标
                icon = electron_1.nativeImage.createEmpty();
            }
            // 调整图标大小适应系统托盘
            if (process.platform === 'win32') {
                icon.setTemplateImage(false);
            }
            this.tray = new electron_1.Tray(icon);
            this.setupTrayMenu();
            this.setupTrayEvents();
            Logger_1.logger.info('Tray created successfully');
            this.emit('tray-created');
        }
        catch (error) {
            Logger_1.logger.error('Failed to create tray', error);
            throw error;
        }
    }
    /**
     * 获取托盘图标路径
     */
    getIconPath() {
        const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
        try {
            if (require('fs').existsSync(iconPath)) {
                return iconPath;
            }
        }
        catch (error) {
            Logger_1.logger.warn('Failed to access tray icon file:', error);
        }
        // 如果文件不存在，返回空字符串使用默认图标
        Logger_1.logger.warn('Using system default tray icon');
        return '';
    }
    /**
     * 设置托盘菜单（简化版）
     */
    setupTrayMenu() {
        if (!this.tray)
            return;
        this.contextMenu = electron_1.Menu.buildFromTemplate([
            {
                label: '显示/隐藏',
                type: 'normal',
                click: () => {
                    this.emit('toggle-window');
                    Logger_1.logger.debug('Tray: Toggle window clicked');
                }
            },
            { type: 'separator' },
            {
                label: '快捷设置',
                type: 'submenu',
                submenu: [
                    {
                        label: '开机自启动',
                        type: 'checkbox',
                        checked: this.getAutoStartStatus(),
                        click: (menuItem) => {
                            this.emit('toggle-auto-start', menuItem.checked);
                            Logger_1.logger.debug('Tray: Auto start toggled', { checked: menuItem.checked });
                        }
                    },
                    {
                        label: '窗口置顶',
                        type: 'checkbox',
                        checked: false, // 将由主进程更新
                        click: (menuItem) => {
                            this.emit('toggle-always-on-top', menuItem.checked);
                            Logger_1.logger.debug('Tray: Always on top toggled', { checked: menuItem.checked });
                        }
                    }
                ]
            },
            { type: 'separator' },
            {
                label: '退出',
                type: 'normal',
                accelerator: 'CmdOrCtrl+Q',
                click: () => {
                    this.emit('quit-app');
                    Logger_1.logger.info('Tray: Quit app clicked');
                }
            }
        ]);
        this.tray.setContextMenu(this.contextMenu);
        this.tray.setToolTip('ClipBoard List - 智能剪切板管理工具');
    }
    /**
     * 设置托盘事件
     */
    setupTrayEvents() {
        if (!this.tray)
            return;
        // 单击托盘图标 - 切换窗口显示
        this.tray.on('click', () => {
            this.emit('tray-clicked');
            Logger_1.logger.debug('Tray clicked');
        });
        // 双击托盘图标 - 显示窗口
        this.tray.on('double-click', () => {
            this.emit('tray-double-clicked');
            Logger_1.logger.debug('Tray double-clicked');
        });
        // 右击托盘图标 - 显示上下文菜单
        this.tray.on('right-click', () => {
            this.emit('tray-right-clicked');
            Logger_1.logger.debug('Tray right-clicked');
        });
    }
    /**
     * 获取自启动状态
     */
    getAutoStartStatus() {
        try {
            const loginSettings = electron_1.app.getLoginItemSettings();
            return loginSettings.openAtLogin;
        }
        catch (error) {
            Logger_1.logger.warn('Failed to get auto-start status:', error);
            return false;
        }
    }
    /**
     * 更新自启动状态
     */
    updateAutoStartStatus(enabled) {
        if (!this.contextMenu)
            return;
        const settingsMenu = this.contextMenu.items.find(item => item.label === '快捷设置');
        if (settingsMenu && settingsMenu.submenu) {
            const autoStartItem = settingsMenu.submenu.items.find(item => item.label === '开机自启动');
            if (autoStartItem) {
                autoStartItem.checked = enabled;
            }
        }
    }
    /**
     * 更新窗口置顶状态
     */
    updateAlwaysOnTopStatus(enabled) {
        if (!this.contextMenu)
            return;
        const settingsMenu = this.contextMenu.items.find(item => item.label === '快捷设置');
        if (settingsMenu && settingsMenu.submenu) {
            const alwaysOnTopItem = settingsMenu.submenu.items.find(item => item.label === '窗口置顶');
            if (alwaysOnTopItem) {
                alwaysOnTopItem.checked = enabled;
            }
        }
    }
    /**
     * 刷新菜单状态
     */
    refreshMenu() {
        if (!this.tray)
            return;
        this.setupTrayMenu();
    }
    /**
     * 显示气球提示
     */
    showBalloon(title, content, icon) {
        if (!this.tray)
            return;
        try {
            this.tray.displayBalloon({
                title,
                content,
                icon: icon || 'info'
            });
            Logger_1.logger.debug('Balloon shown', { title, content, icon });
        }
        catch (error) {
            Logger_1.logger.error('Failed to show balloon', error);
        }
    }
    /**
     * 设置工具提示
     */
    setToolTip(tooltip) {
        if (this.tray) {
            this.tray.setToolTip(tooltip);
        }
    }
    /**
     * 销毁托盘
     */
    destroy() {
        if (this.tray) {
            this.tray.destroy();
            this.tray = null;
            this.contextMenu = null;
            Logger_1.logger.info('Tray destroyed');
        }
        this.removeAllListeners();
    }
    /**
     * 检查托盘是否已销毁
     */
    isDestroyed() {
        return this.tray === null || this.tray.isDestroyed();
    }
}
exports.TrayManager = TrayManager;
//# sourceMappingURL=TrayManager.js.map