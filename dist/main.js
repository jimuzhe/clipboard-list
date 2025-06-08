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
const electron_1 = require("electron");
const path = __importStar(require("path"));
const electron_updater_1 = require("electron-updater");
// 导入模块化组件
const WindowManager_1 = require("./managers/WindowManager");
const TrayManager_1 = require("./managers/TrayManager");
const ClipboardManager_advanced_1 = require("./managers/ClipboardManager_advanced");
const AutoStartManager_1 = require("./managers/AutoStartManager");
const IPCService_1 = require("./services/IPCService");
const DataService_1 = require("./services/DataService");
const Logger_1 = require("./utils/Logger");
const Config_1 = require("./utils/Config");
/**
 * ClipBoard List 主应用程序类
 * 使用模块化架构管理各个功能组件
 */
class ClipboardListApp {
    constructor() {
        this.isQuiting = false;
        this.isDev = process.env.NODE_ENV === 'development';
        this.initializeApp();
    }
    /**
     * 初始化应用程序
     */
    async initializeApp() {
        try {
            // 初始化服务
            this.dataService = new DataService_1.DataService();
            this.ipcService = new IPCService_1.IPCService(); // 初始化管理器
            this.windowManager = new WindowManager_1.WindowManager(Config_1.config.getWindowConfig());
            this.trayManager = new TrayManager_1.TrayManager();
            this.clipboardManager = new ClipboardManager_advanced_1.AdvancedClipboardManager(this.windowManager.getWindow() || undefined);
            this.autoStartManager = new AutoStartManager_1.AutoStartManager();
            // 设置事件监听
            this.setupEventListeners();
            Logger_1.logger.info('Application initialized successfully');
        }
        catch (error) {
            Logger_1.logger.error('Failed to initialize application:', error);
            throw error;
        }
    }
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // IPC服务事件
        this.setupIPCListeners();
        // 窗口管理器事件
        this.windowManager.on('window-closed', () => {
            if (!this.isQuiting) {
                // 窗口关闭时隐藏而不是退出
                this.windowManager.hide();
            }
        });
        this.windowManager.on('window-minimized', () => {
            this.windowManager.hide();
        }); // 托盘管理器事件
        this.trayManager.on('show-window', () => {
            this.windowManager.show();
            this.windowManager.focus();
        });
        this.trayManager.on('hide-window', () => {
            this.windowManager.hide();
        });
        this.trayManager.on('toggle-window', () => {
            this.windowManager.toggle();
            if (this.windowManager.isVisible()) {
                this.windowManager.focus();
            }
        });
        this.trayManager.on('tray-clicked', () => {
            // 单击托盘图标时切换窗口显示状态
            this.windowManager.toggle();
            if (this.windowManager.isVisible()) {
                this.windowManager.focus();
            }
        });
        this.trayManager.on('quit-app', () => {
            this.quit();
        }); // 剪切板管理器事件
        this.clipboardManager.on('clipboard-changed', (item) => {
            Logger_1.logger.debug('Clipboard changed:', item.type);
            // 发送到渲染进程
            if (this.windowManager.getWindow()) {
                this.ipcService.sendToRenderer(this.windowManager.getWindow().webContents, 'clipboard-changed', item);
            }
        });
        // 自启动管理器事件
        this.autoStartManager.on('auto-start-enabled', (options) => {
            Logger_1.logger.info('Auto-start enabled', options);
        });
        this.autoStartManager.on('auto-start-disabled', () => {
            Logger_1.logger.info('Auto-start disabled');
        });
        Logger_1.logger.info('Event listeners setup completed');
    }
    /**
     * 设置IPC监听器
     */
    setupIPCListeners() {
        // 窗口控制
        this.ipcService.on('window-minimize', () => this.windowManager.hide());
        this.ipcService.on('window-close', () => this.windowManager.hide());
        this.ipcService.on('window-show', () => this.windowManager.show());
        this.ipcService.on('window-hide', () => this.windowManager.hide());
        this.ipcService.on('window-toggle-always-on-top', () => {
            const result = this.windowManager.toggleAlwaysOnTop();
            this.ipcService.emit('always-on-top-toggled', result);
        });
        this.ipcService.on('window-get-bounds', () => {
            const bounds = this.windowManager.getBounds();
            this.ipcService.emit('window-bounds-response', bounds);
        });
        // 剪切板操作
        this.ipcService.on('clipboard-read', () => {
            const content = this.clipboardManager.readFromClipboard();
            this.ipcService.emit('clipboard-read-response', content);
        });
        this.ipcService.on('clipboard-write', (text) => {
            this.clipboardManager.writeToClipboard(text);
        });
        this.ipcService.on('clipboard-get-history', () => {
            const history = this.clipboardManager.getHistory();
            this.ipcService.emit('clipboard-history-response', history);
        });
        this.ipcService.on('clipboard-clear-history', () => {
            this.clipboardManager.clearHistory();
        });
        this.ipcService.on('clipboard-toggle-pin', (id) => {
            const result = this.clipboardManager.togglePin(id);
            this.ipcService.emit('clipboard-pin-toggled', result);
        });
        this.ipcService.on('clipboard-remove-item', (id) => {
            const result = this.clipboardManager.removeItem(id);
            this.ipcService.emit('clipboard-item-removed', result);
        }); // 配置管理
        this.ipcService.on('get-config', () => {
            const configData = Config_1.config.getConfig();
            this.ipcService.emit('config-response', configData);
        });
        this.ipcService.on('set-config', async (configUpdate) => {
            Config_1.config.updateConfig(configUpdate);
        });
        // 数据持久化
        this.ipcService.on('data-save', async (data) => {
            await this.dataService.saveData('app-data', data);
        });
        this.ipcService.on('data-load', async () => {
            const data = await this.dataService.loadData('app-data');
            this.ipcService.emit('data-load-response', data);
        });
        this.ipcService.on('data-save-todos', async (todos) => {
            await this.dataService.saveTodos(todos);
        });
        this.ipcService.on('data-load-todos', async () => {
            const todos = await this.dataService.loadTodos();
            this.ipcService.emit('data-todos-response', todos);
        });
        this.ipcService.on('data-save-notes', async (notes) => {
            await this.dataService.saveNotes(notes);
        });
        this.ipcService.on('data-load-notes', async () => {
            const notes = await this.dataService.loadNotes();
            this.ipcService.emit('data-notes-response', notes);
        });
        // 主题管理
        this.ipcService.on('theme-get', () => {
            const theme = Config_1.config.get('theme') || 'light';
            this.ipcService.emit('theme-response', theme);
        });
        this.ipcService.on('theme-set', async (theme) => {
            Config_1.config.set('theme', theme);
        });
        // 自启动管理
        this.ipcService.on('auto-start-get-status', () => {
            const status = this.autoStartManager.getStatusInfo();
            this.ipcService.emit('auto-start-status-response', status);
        });
        this.ipcService.on('auto-start-toggle', () => {
            const result = this.autoStartManager.toggle();
            this.ipcService.emit('auto-start-toggled', result);
        });
        this.ipcService.on('auto-start-enable', (options) => {
            this.autoStartManager.enable(options);
        });
        this.ipcService.on('auto-start-disable', () => {
            this.autoStartManager.disable();
        });
        // 通知
        this.ipcService.on('show-notification', ({ title, body, icon }) => {
            new electron_1.Notification({ title, body, icon }).show();
        });
        // IPC广播处理
        this.ipcService.on('broadcast', ({ channel, data }) => {
            if (this.windowManager.getWindow()) {
                this.ipcService.sendToRenderer(this.windowManager.getWindow().webContents, channel, data);
            }
        });
    }
    /**
     * 创建应用窗口
     */
    async createWindow() {
        const window = this.windowManager.createWindow();
        // 加载HTML文件
        const htmlPath = this.isDev
            ? 'http://localhost:3000'
            : path.join(__dirname, '../renderer/index.html');
        if (this.isDev) {
            await window.loadURL(htmlPath);
        }
        else {
            await window.loadFile(htmlPath);
        }
        Logger_1.logger.info('Main window created and loaded');
    } /**
   * 创建系统托盘
   */
    createTray() {
        this.trayManager.create();
        this.trayManager.setToolTip('ClipBoard List - 智能剪切板管理工具');
        Logger_1.logger.info('System tray created');
    }
    /**
     * 设置全局快捷键
     */
    setupGlobalShortcuts() {
        try {
            // 注册全局快捷键 Ctrl+Shift+V 切换窗口显示
            electron_1.globalShortcut.register('CommandOrControl+Shift+V', () => {
                if (this.windowManager.isVisible()) {
                    this.windowManager.hide();
                }
                else {
                    this.windowManager.show();
                    this.windowManager.focus();
                }
            });
            Logger_1.logger.info('Global shortcuts registered');
        }
        catch (error) {
            Logger_1.logger.error('Failed to register global shortcuts:', error);
        }
    }
    /**
     * 配置自启动
     */
    async setupAutoStart() {
        try {
            const autoStartEnabled = Config_1.config.get('autoStart');
            if (autoStartEnabled) {
                this.autoStartManager.enable({
                    openAsHidden: true,
                    args: ['--hidden']
                });
            }
            Logger_1.logger.info('Auto-start configured');
        }
        catch (error) {
            Logger_1.logger.error('Failed to setup auto-start:', error);
        }
    } /**
     * 启动剪切板监控
     */
    startClipboardMonitoring() {
        // 使用更低频率的监控间隔2秒，减少资源消耗
        this.clipboardManager.startMonitoring();
        Logger_1.logger.info('Clipboard monitoring started');
    }
    /**
     * 处理命令行参数
     */
    handleCommandLineArgs() {
        const { shouldStartHidden } = this.autoStartManager.handleCommandLineArgs(process.argv);
        if (shouldStartHidden) {
            this.windowManager.hide();
        }
        else {
            this.windowManager.show();
        }
        Logger_1.logger.info('Command line arguments processed', { shouldStartHidden });
    }
    /**
     * 应用启动完成
     */
    async onReady() {
        try {
            await this.createWindow();
            this.createTray();
            await this.setupAutoStart();
            this.setupGlobalShortcuts();
            this.startClipboardMonitoring();
            this.handleCommandLineArgs();
            // 自动更新检查
            if (!this.isDev) {
                electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
            }
            Logger_1.logger.info('Application ready');
        }
        catch (error) {
            Logger_1.logger.error('Failed to initialize application on ready:', error);
        }
    }
    /**
     * 退出应用
     */
    quit() {
        this.isQuiting = true;
        electron_1.app.quit();
    }
    /**
     * 获取退出状态
     */
    get isQuittingApp() {
        return this.isQuiting;
    }
    /**
     * 获取窗口管理器
     */
    get windowManagerInstance() {
        return this.windowManager;
    }
    /**
     * 公共方法：创建窗口
     */
    async createMainWindow() {
        await this.createWindow();
    }
    /**
     * 清理资源
     */
    cleanup() {
        try {
            // 注销全局快捷键
            electron_1.globalShortcut.unregisterAll();
            // 停止剪切板监控
            this.clipboardManager.stopMonitoring();
            // 销毁各个管理器
            this.windowManager?.destroy();
            this.trayManager?.destroy();
            this.clipboardManager?.destroy();
            this.autoStartManager?.destroy();
            this.ipcService?.destroy();
            this.dataService?.destroy();
            Logger_1.logger.info('Application cleanup completed');
        }
        catch (error) {
            Logger_1.logger.error('Error during cleanup:', error);
        }
    }
}
// 创建应用实例
const clipboardListApp = new ClipboardListApp();
// App 事件处理
electron_1.app.whenReady().then(() => {
    clipboardListApp.onReady();
});
electron_1.app.on('window-all-closed', () => {
    // 在 macOS 上，应用程序通常保持活动状态
    if (process.platform !== 'darwin') {
        if (!clipboardListApp.isQuittingApp) {
            // 不退出应用，只是隐藏窗口
            return;
        }
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (!clipboardListApp.windowManagerInstance.getWindow()) {
        clipboardListApp.createMainWindow();
    }
});
electron_1.app.on('before-quit', () => {
    clipboardListApp.cleanup();
});
//# sourceMappingURL=main.js.map