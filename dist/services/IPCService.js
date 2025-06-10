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
exports.IPCService = void 0;
const electron_1 = require("electron");
const events_1 = require("events");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const Logger_1 = require("../utils/Logger");
/**
 * IPC服务 - 负责主进程和渲染进程之间的安全通信
 */
class IPCService extends events_1.EventEmitter {
    constructor() {
        super();
        this.handlers = new Map();
        this.setupHandlers();
    }
    /**
     * 设置IPC处理程序
     */
    setupHandlers() {
        // 应用相关
        this.registerHandler('app:get-version', this.handleGetAppVersion.bind(this));
        this.registerHandler('app:get-config', this.handleGetConfig.bind(this));
        this.registerHandler('app:set-config', this.handleSetConfig.bind(this));
        this.registerHandler('app:show-notification', this.handleShowNotification.bind(this));
        // 窗口控制
        this.registerHandler('window:minimize', this.handleMinimizeWindow.bind(this));
        this.registerHandler('window:close', this.handleCloseWindow.bind(this));
        this.registerHandler('window:show', this.handleShowWindow.bind(this));
        this.registerHandler('window:hide', this.handleHideWindow.bind(this));
        this.registerHandler('window:set-size', this.handleSetWindowSize.bind(this));
        this.registerHandler('window:get-bounds', this.handleGetWindowBounds.bind(this));
        // 边缘触发功能
        this.registerHandler('window:set-trigger-zone-width', this.handleSetTriggerZoneWidth.bind(this));
        this.registerHandler('window:get-trigger-zone-width', this.handleGetTriggerZoneWidth.bind(this));
        this.registerHandler('window:set-edge-trigger-enabled', this.handleSetEdgeTriggerEnabled.bind(this));
        this.registerHandler('window:get-edge-trigger-enabled', this.handleGetEdgeTriggerEnabled.bind(this));
        // 剪切板相关
        this.registerHandler('clipboard:read', this.handleReadClipboard.bind(this));
        this.registerHandler('clipboard:write', this.handleWriteClipboard.bind(this));
        this.registerHandler('clipboard:get-history', this.handleGetClipboardHistory.bind(this));
        this.registerHandler('clipboard:clear-history', this.handleClearClipboardHistory.bind(this));
        this.registerHandler('clipboard:toggle-pin', this.handleToggleClipboardPin.bind(this));
        this.registerHandler('clipboard:remove-item', this.handleRemoveClipboardItem.bind(this));
        // 数据存储相关
        this.registerHandler('data:save', this.handleSaveData.bind(this));
        this.registerHandler('data:load', this.handleLoadData.bind(this));
        this.registerHandler('data:save-todos', this.handleSaveTodos.bind(this));
        this.registerHandler('data:load-todos', this.handleLoadTodos.bind(this));
        this.registerHandler('data:save-notes', this.handleSaveNotes.bind(this));
        this.registerHandler('data:load-notes', this.handleLoadNotes.bind(this));
        // 主题相关
        this.registerHandler('theme:get', this.handleGetTheme.bind(this));
        this.registerHandler('theme:set', this.handleSetTheme.bind(this));
        // 自启动相关
        this.registerHandler('auto-start:get-status', this.handleGetAutoStartStatus.bind(this));
        this.registerHandler('auto-start:toggle', this.handleToggleAutoStart.bind(this));
        this.registerHandler('auto-start:enable', this.handleEnableAutoStart.bind(this));
        this.registerHandler('auto-start:disable', this.handleDisableAutoStart.bind(this));
        // 文件和文件夹操作
        this.registerHandler('get-default-notes-folder', this.handleGetDefaultNotesFolder.bind(this));
        this.registerHandler('open-folder-dialog', this.handleOpenFolderDialog.bind(this));
        this.registerHandler('list-markdown-files', this.handleListMarkdownFiles.bind(this));
        this.registerHandler('read-file', this.handleReadFile.bind(this));
        this.registerHandler('write-file', this.handleWriteFile.bind(this));
        this.registerHandler('delete-file', this.handleDeleteFile.bind(this));
        this.registerHandler('open-external', this.handleOpenExternal.bind(this));
        // 兼容性别名
        this.setupCompatibilityAliases();
        Logger_1.logger.info('IPC handlers registered');
    }
    /**
     * 设置兼容性别名
     */
    setupCompatibilityAliases() {
        // 应用相关
        this.registerHandler('get-app-version', this.handleGetAppVersion.bind(this));
        this.registerHandler('get-config', this.handleGetConfig.bind(this));
        this.registerHandler('set-config', this.handleSetConfig.bind(this));
        this.registerHandler('show-notification', this.handleShowNotification.bind(this));
        // 窗口相关
        this.registerHandler('minimize-window', this.handleMinimizeWindow.bind(this));
        this.registerHandler('close-window', this.handleCloseWindow.bind(this));
        this.registerHandler('show-window', this.handleShowWindow.bind(this));
        this.registerHandler('hide-window', this.handleHideWindow.bind(this));
        this.registerHandler('set-window-size', this.handleSetWindowSize.bind(this));
        this.registerHandler('get-window-bounds', this.handleGetWindowBounds.bind(this));
        // 剪切板相关
        this.registerHandler('read-clipboard', this.handleReadClipboard.bind(this));
        this.registerHandler('write-clipboard', this.handleWriteClipboard.bind(this));
        this.registerHandler('write-image-clipboard', this.handleWriteImageClipboard.bind(this));
        this.registerHandler('get-clipboard-history', this.handleGetClipboardHistory.bind(this));
        this.registerHandler('clear-clipboard-history', this.handleClearClipboardHistory.bind(this));
        this.registerHandler('toggle-clipboard-pin', this.handleToggleClipboardPin.bind(this));
        this.registerHandler('remove-clipboard-item', this.handleRemoveClipboardItem.bind(this));
        // 数据存储相关
        this.registerHandler('save-data', this.handleSaveData.bind(this));
        this.registerHandler('load-data', this.handleLoadData.bind(this));
        this.registerHandler('save-todos', this.handleSaveTodos.bind(this));
        this.registerHandler('load-todos', this.handleLoadTodos.bind(this));
        this.registerHandler('save-notes', this.handleSaveNotes.bind(this));
        this.registerHandler('load-notes', this.handleLoadNotes.bind(this));
        // 主题相关
        this.registerHandler('get-theme', this.handleGetTheme.bind(this));
        this.registerHandler('set-theme', this.handleSetTheme.bind(this));
        // 自启动相关
        this.registerHandler('get-auto-start-status', this.handleGetAutoStartStatus.bind(this));
        this.registerHandler('toggle-auto-start', this.handleToggleAutoStart.bind(this));
        this.registerHandler('enable-auto-start', this.handleEnableAutoStart.bind(this));
        this.registerHandler('disable-auto-start', this.handleDisableAutoStart.bind(this));
        Logger_1.logger.info('IPC compatibility aliases registered');
    }
    /**
     * 注册IPC处理程序
     */
    registerHandler(channel, handler) {
        this.handlers.set(channel, handler);
        electron_1.ipcMain.handle(channel, async (event, ...args) => {
            try {
                Logger_1.logger.debug(`IPC call: ${channel}`, args);
                const result = await handler(event, ...args);
                return { success: true, data: result };
            }
            catch (error) {
                Logger_1.logger.error(`IPC error in ${channel}:`, error);
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        });
    }
    /**
     * 发送消息到渲染进程
     */
    sendToRenderer(webContents, channel, data) {
        try {
            webContents.send(channel, data);
            Logger_1.logger.debug(`Sent to renderer: ${channel}`, data);
        }
        catch (error) {
            Logger_1.logger.error(`Failed to send to renderer: ${channel}`, error);
        }
    }
    /**
     * 广播消息到所有渲染进程
     */
    broadcast(channel, data) {
        this.emit('broadcast', { channel, data });
    }
    // === 应用相关处理程序 ===
    async handleGetAppVersion() {
        return electron_1.app.getVersion();
    }
    async handleGetConfig() {
        this.emit('get-config');
        return new Promise((resolve) => {
            this.once('config-response', resolve);
        });
    }
    async handleSetConfig(event, config) {
        this.emit('set-config', config);
    }
    async handleShowNotification(event, { title, body, icon }) {
        this.emit('show-notification', { title, body, icon });
    }
    // === 窗口控制处理程序 ===
    async handleMinimizeWindow() {
        this.emit('window-minimize');
    }
    async handleCloseWindow() {
        this.emit('window-close');
    }
    async handleShowWindow() {
        this.emit('window-show');
    }
    async handleHideWindow() {
        this.emit('window-hide');
    }
    async handleSetWindowSize(event, { width, height }) {
        this.emit('window-set-size', { width, height });
    }
    async handleGetWindowBounds() {
        return new Promise((resolve) => {
            this.emit('window-get-bounds');
            this.once('window-bounds-response', resolve);
        });
    }
    // === 边缘触发功能相关处理程序 ===
    async handleSetTriggerZoneWidth(event, width) {
        return new Promise((resolve) => {
            this.emit('window-set-trigger-zone-width', width);
            this.once('trigger-zone-width-set', resolve);
        });
    }
    async handleGetTriggerZoneWidth() {
        return new Promise((resolve) => {
            this.emit('window-get-trigger-zone-width');
            this.once('trigger-zone-width-response', resolve);
        });
    }
    async handleSetEdgeTriggerEnabled(event, enabled) {
        return new Promise((resolve) => {
            this.emit('window-set-edge-trigger-enabled', enabled);
            this.once('edge-trigger-enabled-set', resolve);
        });
    }
    async handleGetEdgeTriggerEnabled() {
        return new Promise((resolve) => {
            this.emit('window-get-edge-trigger-enabled');
            this.once('edge-trigger-enabled-response', resolve);
        });
    }
    // === 剪切板相关处理程序 ===
    async handleReadClipboard() {
        return new Promise((resolve) => {
            this.emit('clipboard-read');
            this.once('clipboard-read-response', resolve);
        });
    }
    async handleWriteClipboard(event, text) {
        this.emit('clipboard-write', text);
    }
    async handleWriteImageClipboard(event, imageData) {
        this.emit('clipboard-write-image', imageData);
    }
    async handleGetClipboardHistory() {
        return new Promise((resolve) => {
            this.emit('clipboard-get-history');
            this.once('clipboard-history-response', resolve);
        });
    }
    async handleClearClipboardHistory() {
        this.emit('clipboard-clear-history');
    }
    async handleToggleClipboardPin(event, id) {
        return new Promise((resolve) => {
            this.emit('clipboard-toggle-pin', id);
            this.once('clipboard-pin-toggled', resolve);
        });
    }
    async handleRemoveClipboardItem(event, id) {
        return new Promise((resolve) => {
            this.emit('clipboard-remove-item', id);
            this.once('clipboard-item-removed', resolve);
        });
    }
    // === 数据存储处理程序 ===
    async handleSaveData(event, data) {
        this.emit('data-save', data);
    }
    async handleLoadData() {
        return new Promise((resolve) => {
            this.emit('data-load');
            this.once('data-load-response', resolve);
        });
    }
    async handleSaveTodos(event, todos) {
        this.emit('data-save-todos', todos);
    }
    async handleLoadTodos() {
        return new Promise((resolve) => {
            this.emit('data-load-todos');
            this.once('data-todos-response', resolve);
        });
    }
    async handleSaveNotes(event, notes) {
        this.emit('data-save-notes', notes);
    }
    async handleLoadNotes() {
        return new Promise((resolve) => {
            this.emit('data-load-notes');
            this.once('data-notes-response', resolve);
        });
    }
    // === 主题相关处理程序 ===
    async handleGetTheme() {
        return new Promise((resolve) => {
            this.emit('theme-get');
            this.once('theme-response', resolve);
        });
    }
    async handleSetTheme(event, theme) {
        this.emit('theme-set', theme);
    }
    // === 自启动相关处理程序 ===
    async handleGetAutoStartStatus() {
        return new Promise((resolve) => {
            this.emit('auto-start-get-status');
            this.once('auto-start-status-response', resolve);
        });
    }
    async handleToggleAutoStart() {
        return new Promise((resolve) => {
            this.emit('auto-start-toggle');
            this.once('auto-start-toggled', resolve);
        });
    }
    async handleEnableAutoStart(event, options) {
        this.emit('auto-start-enable', options);
    }
    async handleDisableAutoStart() {
        this.emit('auto-start-disable');
    }
    // === 文件和文件夹操作处理程序 ===
    async handleGetDefaultNotesFolder(event) {
        try {
            const userDataPath = electron_1.app.getPath('userData');
            const notesFolder = path.join(userDataPath, 'notes');
            // 确保 notes 文件夹存在
            await fs.mkdir(notesFolder, { recursive: true });
            return { folderPath: notesFolder };
        }
        catch (error) {
            Logger_1.logger.error('Get default notes folder error:', error);
            throw error;
        }
    }
    async handleOpenFolderDialog(event, options) {
        try {
            // 构建对话框选项，确保 defaultPath 是字符串或不传递
            const dialogOptions = {
                properties: ['openDirectory'],
                title: options?.title || '选择文件夹'
            };
            // 只有当 defaultPath 是有效字符串时才添加
            if (options?.defaultPath && typeof options.defaultPath === 'string') {
                dialogOptions.defaultPath = options.defaultPath;
            }
            // 添加其他选项（排除已处理的 title 和 defaultPath）
            if (options) {
                const { title, defaultPath, ...otherOptions } = options;
                Object.assign(dialogOptions, otherOptions);
            }
            const result = await electron_1.dialog.showOpenDialog(dialogOptions);
            return result;
        }
        catch (error) {
            Logger_1.logger.error('Open folder dialog error:', error);
            throw error;
        }
    }
    async handleListMarkdownFiles(event, folderPath) {
        try {
            const files = await fs.readdir(folderPath, { withFileTypes: true });
            const markdownFiles = [];
            for (const file of files) {
                const fullPath = path.join(folderPath, file.name);
                const stat = await fs.stat(fullPath);
                if (file.isFile() && /\.(md|markdown)$/i.test(file.name)) {
                    markdownFiles.push({
                        name: file.name,
                        path: fullPath,
                        isDirectory: false,
                        lastModified: stat.mtime,
                        size: stat.size
                    });
                }
            }
            // 按修改时间倒序排列
            markdownFiles.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
            return { files: markdownFiles };
        }
        catch (error) {
            Logger_1.logger.error('List markdown files error:', error);
            throw error;
        }
    }
    async handleReadFile(event, filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const stat = await fs.stat(filePath);
            return {
                content,
                lastModified: stat.mtime,
                size: stat.size
            };
        }
        catch (error) {
            Logger_1.logger.error('Read file error:', error);
            throw error;
        }
    }
    async handleWriteFile(event, filePath, content) {
        try {
            await fs.writeFile(filePath, content, 'utf-8');
            Logger_1.logger.info(`File written: ${filePath}`);
            return { filePath };
        }
        catch (error) {
            Logger_1.logger.error('Write file error:', error);
            throw error;
        }
    }
    async handleDeleteFile(event, filePath) {
        try {
            await fs.unlink(filePath);
            Logger_1.logger.info(`File deleted: ${filePath}`);
            return { filePath };
        }
        catch (error) {
            Logger_1.logger.error('Delete file error:', error);
            throw error;
        }
    }
    async handleOpenExternal(event, url) {
        try {
            await electron_1.shell.openExternal(url);
            Logger_1.logger.info(`Opened external URL: ${url}`);
        }
        catch (error) {
            Logger_1.logger.error('Open external URL error:', error);
            throw error;
        }
    }
    /**
     * 移除处理程序
     */
    removeHandler(channel) {
        if (this.handlers.has(channel)) {
            electron_1.ipcMain.removeHandler(channel);
            this.handlers.delete(channel);
            Logger_1.logger.debug(`Removed IPC handler: ${channel}`);
        }
    }
    /**
     * 移除所有处理程序
     */
    removeAllHandlers() {
        Array.from(this.handlers.keys()).forEach(channel => {
            electron_1.ipcMain.removeHandler(channel);
        });
        this.handlers.clear();
        Logger_1.logger.info('All IPC handlers removed');
    }
    /**
     * 获取已注册的处理程序列表
     */
    getRegisteredHandlers() {
        return Array.from(this.handlers.keys());
    }
    /**
     * 销毁服务
     */
    destroy() {
        this.removeAllHandlers();
        this.removeAllListeners();
        Logger_1.logger.info('IPCService destroyed');
    }
}
exports.IPCService = IPCService;
//# sourceMappingURL=IPCService.js.map