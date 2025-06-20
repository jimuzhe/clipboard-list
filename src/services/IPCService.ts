import { ipcMain, IpcMainInvokeEvent, WebContents, dialog, shell, app } from 'electron';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../utils/Logger';
import { ClipboardItem } from '../types/clipboard';
import { TodoItem } from '../types/todo';
import { Note } from '../types/notes';
import { AppConfig } from '../types';

/**
 * IPC服务 - 负责主进程和渲染进程之间的安全通信
 */
export class IPCService extends EventEmitter {
    private handlers: Map<string, Function> = new Map();

    constructor() {
        super();
        this.setupHandlers();
    }

    /**
     * 设置IPC处理程序
     */
    private setupHandlers(): void {
        // 应用相关
        this.registerHandler('app:get-version', this.handleGetAppVersion.bind(this));
        this.registerHandler('app:get-config', this.handleGetConfig.bind(this));
        this.registerHandler('app:set-config', this.handleSetConfig.bind(this)); this.registerHandler('app:show-notification', this.handleShowNotification.bind(this));

        // 窗口控制
        this.registerHandler('window:minimize', this.handleMinimizeWindow.bind(this));
        this.registerHandler('window:close', this.handleCloseWindow.bind(this));
        this.registerHandler('window:show', this.handleShowWindow.bind(this));
        this.registerHandler('window:hide', this.handleHideWindow.bind(this));
        this.registerHandler('window:set-size', this.handleSetWindowSize.bind(this));
        this.registerHandler('window:get-bounds', this.handleGetWindowBounds.bind(this));        // 边缘触发功能
        this.registerHandler('window:set-trigger-zone-width', this.handleSetTriggerZoneWidth.bind(this));
        this.registerHandler('window:get-trigger-zone-width', this.handleGetTriggerZoneWidth.bind(this));
        this.registerHandler('window:set-edge-trigger-enabled', this.handleSetEdgeTriggerEnabled.bind(this));
        this.registerHandler('window:get-edge-trigger-enabled', this.handleGetEdgeTriggerEnabled.bind(this));        // 窗口置顶功能
        this.registerHandler('window:set-always-on-top', this.handleSetAlwaysOnTop.bind(this));
        this.registerHandler('window:get-always-on-top', this.handleGetAlwaysOnTop.bind(this));
        this.registerHandler('window:toggle-always-on-top', this.handleToggleAlwaysOnTop.bind(this));

        // 窗口透明度功能
        this.registerHandler('window:set-opacity', this.handleSetWindowOpacity.bind(this));
        this.registerHandler('window:get-opacity', this.handleGetWindowOpacity.bind(this));

        // 剪切板相关
        this.registerHandler('clipboard:read', this.handleReadClipboard.bind(this));
        this.registerHandler('clipboard:write', this.handleWriteClipboard.bind(this));
        this.registerHandler('clipboard:get-history', this.handleGetClipboardHistory.bind(this));
        this.registerHandler('clipboard:clear-history', this.handleClearClipboardHistory.bind(this));
        this.registerHandler('clipboard:toggle-pin', this.handleToggleClipboardPin.bind(this));
        this.registerHandler('clipboard:remove-item', this.handleRemoveClipboardItem.bind(this));        // 数据存储相关
        this.registerHandler('data:save', this.handleSaveData.bind(this));
        this.registerHandler('data:load', this.handleLoadData.bind(this));
        this.registerHandler('data:save-todos', this.handleSaveTodos.bind(this));
        this.registerHandler('data:load-todos', this.handleLoadTodos.bind(this));
        this.registerHandler('data:save-notes', this.handleSaveNotes.bind(this));
        this.registerHandler('data:load-notes', this.handleLoadNotes.bind(this));        // 新的分类数据存储处理程序
        this.registerHandler('save-clipboard-history', this.handleSaveClipboardHistory.bind(this));
        this.registerHandler('load-clipboard-history', this.handleLoadClipboardHistory.bind(this));
        this.registerHandler('save-todos', this.handleSaveTodos.bind(this));
        this.registerHandler('load-todos', this.handleLoadTodos.bind(this));
        this.registerHandler('save-notes', this.handleSaveNotes.bind(this));
        this.registerHandler('load-notes', this.handleLoadNotes.bind(this));
        this.registerHandler('save-settings', this.handleSaveSettings.bind(this));
        this.registerHandler('load-settings', this.handleLoadSettings.bind(this));
        this.registerHandler('save-pomodoro-timer', this.handleSavePomodoroTimer.bind(this));
        this.registerHandler('load-pomodoro-timer', this.handleLoadPomodoroTimer.bind(this));

        // 主题相关
        this.registerHandler('theme:get', this.handleGetTheme.bind(this));
        this.registerHandler('theme:set', this.handleSetTheme.bind(this));        // 自启动相关
        this.registerHandler('auto-start:get-status', this.handleGetAutoStartStatus.bind(this));
        this.registerHandler('auto-start:toggle', this.handleToggleAutoStart.bind(this));
        this.registerHandler('auto-start:enable', this.handleEnableAutoStart.bind(this));
        this.registerHandler('auto-start:disable', this.handleDisableAutoStart.bind(this));

        // 快捷键相关
        this.registerHandler('shortcut-get-all', this.handleGetAllShortcuts.bind(this));
        this.registerHandler('shortcut-update', this.handleUpdateShortcut.bind(this));
        this.registerHandler('shortcut-get-suggestions', this.handleGetShortcutSuggestions.bind(this));
        this.registerHandler('shortcut-validate', this.handleValidateShortcut.bind(this));
        this.registerHandler('shortcut-format', this.handleFormatShortcut.bind(this));// 文件和文件夹操作
        this.registerHandler('get-default-notes-folder', this.handleGetDefaultNotesFolder.bind(this));
        this.registerHandler('open-folder-dialog', this.handleOpenFolderDialog.bind(this));
        this.registerHandler('list-markdown-files', this.handleListMarkdownFiles.bind(this));
        this.registerHandler('read-file', this.handleReadFile.bind(this));
        this.registerHandler('write-file', this.handleWriteFile.bind(this));
        this.registerHandler('delete-file', this.handleDeleteFile.bind(this));
        this.registerHandler('open-external', this.handleOpenExternal.bind(this));
        this.registerHandler('open-url-in-community', this.handleOpenUrlInCommunity.bind(this));        // 开发者工具相关
        this.registerHandler('open-devtools', this.handleOpenDevTools.bind(this));
        this.registerHandler('close-devtools', this.handleCloseDevTools.bind(this));
        this.registerHandler('toggle-devtools', this.handleToggleDevTools.bind(this));

        // 动画设置
        this.registerHandler('update-animation-settings', this.handleUpdateAnimationSettings.bind(this));

        // 兼容性别名
        this.setupCompatibilityAliases();

        logger.info('IPC handlers registered');
    }

    /**
     * 设置兼容性别名
     */
    private setupCompatibilityAliases(): void {        // 应用相关
        this.registerHandler('get-app-version', this.handleGetAppVersion.bind(this));
        this.registerHandler('get-data-path', this.handleGetDataPath.bind(this));
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
        this.registerHandler('remove-clipboard-item', this.handleRemoveClipboardItem.bind(this));        // 数据存储相关
        this.registerHandler('save-data', this.handleSaveData.bind(this));
        this.registerHandler('load-data', this.handleLoadData.bind(this));

        // 注意：新的分类数据存储处理程序已在 setupHandlers 中注册，这里不需要重复注册
        // 以下处理程序已在主要设置中注册：save-todos, load-todos, save-notes, load-notes

        // 主题相关
        this.registerHandler('get-theme', this.handleGetTheme.bind(this));
        this.registerHandler('set-theme', this.handleSetTheme.bind(this));

        // 自启动相关
        this.registerHandler('get-auto-start-status', this.handleGetAutoStartStatus.bind(this));
        this.registerHandler('toggle-auto-start', this.handleToggleAutoStart.bind(this));
        this.registerHandler('enable-auto-start', this.handleEnableAutoStart.bind(this));
        this.registerHandler('disable-auto-start', this.handleDisableAutoStart.bind(this));

        logger.info('IPC compatibility aliases registered');
    }

    /**
     * 注册IPC处理程序
     */
    private registerHandler(channel: string, handler: Function): void {
        this.handlers.set(channel, handler);
        ipcMain.handle(channel, async (event: IpcMainInvokeEvent, ...args: any[]) => {
            try {
                logger.debug(`IPC call: ${channel}`, args);
                const result = await handler(event, ...args);
                return { success: true, data: result };
            } catch (error) {
                logger.error(`IPC error in ${channel}:`, error);
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
    public sendToRenderer(webContents: WebContents, channel: string, data?: any): void {
        try {
            webContents.send(channel, data);
            logger.debug(`Sent to renderer: ${channel}`, data);
        } catch (error) {
            logger.error(`Failed to send to renderer: ${channel}`, error);
        }
    }

    /**
     * 广播消息到所有渲染进程
     */
    public broadcast(channel: string, data?: any): void {
        this.emit('broadcast', { channel, data });
    }    // === 应用相关处理程序 ===
    private async handleGetAppVersion(): Promise<string> {
        return app.getVersion();
    }

    private async handleGetDataPath(): Promise<string> {
        return app.getPath('userData');
    }

    private async handleGetConfig(): Promise<any> {
        this.emit('get-config');
        return new Promise((resolve) => {
            this.once('config-response', resolve);
        });
    }

    private async handleSetConfig(event: IpcMainInvokeEvent, config: Partial<AppConfig>): Promise<void> {
        this.emit('set-config', config);
    } private async handleShowNotification(event: IpcMainInvokeEvent, { title, body, icon }: { title: string; body: string; icon?: string }): Promise<void> {
        this.emit('show-notification', { title, body, icon });
    }

    // === 窗口控制处理程序 ===
    private async handleMinimizeWindow(): Promise<void> {
        this.emit('window-minimize');
    }

    private async handleCloseWindow(): Promise<void> {
        this.emit('window-close');
    }

    private async handleShowWindow(): Promise<void> {
        this.emit('window-show');
    }

    private async handleHideWindow(): Promise<void> {
        this.emit('window-hide');
    }

    private async handleSetWindowSize(event: IpcMainInvokeEvent, { width, height }: { width: number; height: number }): Promise<void> {
        this.emit('window-set-size', { width, height });
    }

    private async handleGetWindowBounds(): Promise<any> {
        return new Promise((resolve) => {
            this.emit('window-get-bounds');
            this.once('window-bounds-response', resolve);
        });
    }

    // === 边缘触发功能相关处理程序 ===
    private async handleSetTriggerZoneWidth(event: IpcMainInvokeEvent, width: number): Promise<void> {
        return new Promise((resolve) => {
            this.emit('window-set-trigger-zone-width', width);
            this.once('trigger-zone-width-set', resolve);
        });
    }

    private async handleGetTriggerZoneWidth(): Promise<number> {
        return new Promise((resolve) => {
            this.emit('window-get-trigger-zone-width');
            this.once('trigger-zone-width-response', resolve);
        });
    }

    private async handleSetEdgeTriggerEnabled(event: IpcMainInvokeEvent, enabled: boolean): Promise<void> {
        return new Promise((resolve) => {
            this.emit('window-set-edge-trigger-enabled', enabled);
            this.once('edge-trigger-enabled-set', resolve);
        });
    } private async handleGetEdgeTriggerEnabled(): Promise<boolean> {
        return new Promise((resolve) => {
            this.emit('window-get-edge-trigger-enabled');
            this.once('edge-trigger-enabled-response', resolve);
        });
    }

    // === 窗口置顶功能相关处理程序 ===
    private async handleSetAlwaysOnTop(event: IpcMainInvokeEvent, enabled: boolean): Promise<void> {
        this.emit('window-set-always-on-top', enabled);
    }

    private async handleGetAlwaysOnTop(): Promise<boolean> {
        return new Promise((resolve) => {
            this.emit('window-get-always-on-top');
            this.once('always-on-top-response', resolve);
        });
    } private async handleToggleAlwaysOnTop(): Promise<boolean> {
        return new Promise((resolve) => {
            this.emit('window-toggle-always-on-top');
            this.once('always-on-top-toggled', resolve);
        });
    }

    // === 窗口透明度功能相关处理程序 ===
    private async handleSetWindowOpacity(event: IpcMainInvokeEvent, opacity: number): Promise<void> {
        // 确保透明度值在有效范围内
        const clampedOpacity = Math.max(0.1, Math.min(1.0, opacity));
        this.emit('window-set-opacity', clampedOpacity);
    }

    private async handleGetWindowOpacity(): Promise<number> {
        return new Promise((resolve) => {
            this.emit('window-get-opacity');
            this.once('window-opacity-response', resolve);
        });
    }

    // === 剪切板相关处理程序 ===
    private async handleReadClipboard(): Promise<string> {
        return new Promise((resolve) => {
            this.emit('clipboard-read');
            this.once('clipboard-read-response', resolve);
        });
    }

    private async handleWriteClipboard(event: IpcMainInvokeEvent, text: string): Promise<void> {
        this.emit('clipboard-write', text);
    }

    private async handleWriteImageClipboard(event: IpcMainInvokeEvent, imageData: string): Promise<void> {
        this.emit('clipboard-write-image', imageData);
    }

    private async handleGetClipboardHistory(): Promise<ClipboardItem[]> {
        return new Promise((resolve) => {
            this.emit('clipboard-get-history');
            this.once('clipboard-history-response', resolve);
        });
    }

    private async handleClearClipboardHistory(): Promise<void> {
        this.emit('clipboard-clear-history');
    }

    private async handleToggleClipboardPin(event: IpcMainInvokeEvent, id: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.emit('clipboard-toggle-pin', id);
            this.once('clipboard-pin-toggled', resolve);
        });
    }

    private async handleRemoveClipboardItem(event: IpcMainInvokeEvent, id: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.emit('clipboard-remove-item', id);
            this.once('clipboard-item-removed', resolve);
        });
    }

    // === 数据存储处理程序 ===
    private async handleSaveData(event: IpcMainInvokeEvent, data: any): Promise<void> {
        this.emit('data-save', data);
    }

    private async handleLoadData(): Promise<any> {
        return new Promise((resolve) => {
            this.emit('data-load');
            this.once('data-load-response', resolve);
        });
    }

    private async handleSaveTodos(event: IpcMainInvokeEvent, todos: TodoItem[]): Promise<void> {
        this.emit('data-save-todos', todos);
    }

    private async handleLoadTodos(): Promise<TodoItem[]> {
        return new Promise((resolve) => {
            this.emit('data-load-todos');
            this.once('data-todos-response', resolve);
        });
    }

    private async handleSaveNotes(event: IpcMainInvokeEvent, notes: Note[]): Promise<void> {
        this.emit('data-save-notes', notes);
    }

    private async handleLoadNotes(): Promise<Note[]> {
        return new Promise((resolve) => {
            this.emit('data-load-notes');
            this.once('data-notes-response', resolve);
        });
    }

    // === 新的分类数据存储处理程序 ===
    private async handleSaveClipboardHistory(event: IpcMainInvokeEvent, items: ClipboardItem[]): Promise<void> {
        this.emit('save-clipboard-history', items);
    }

    private async handleLoadClipboardHistory(): Promise<ClipboardItem[]> {
        return new Promise((resolve) => {
            this.emit('load-clipboard-history');
            this.once('clipboard-history-response', resolve);
        });
    }

    private async handleSaveSettings(event: IpcMainInvokeEvent, settings: any): Promise<void> {
        this.emit('save-settings', settings);
    }

    private async handleLoadSettings(): Promise<any> {
        return new Promise((resolve) => {
            this.emit('load-settings');
            this.once('settings-response', resolve);
        });
    }

    private async handleSavePomodoroTimer(event: IpcMainInvokeEvent, timer: any): Promise<void> {
        this.emit('save-pomodoro-timer', timer);
    }

    private async handleLoadPomodoroTimer(): Promise<any> {
        return new Promise((resolve) => {
            this.emit('load-pomodoro-timer');
            this.once('pomodoro-timer-response', resolve);
        });
    }

    // === 主题相关处理程序 ===
    private async handleGetTheme(): Promise<string> {
        return new Promise((resolve) => {
            this.emit('theme-get');
            this.once('theme-response', resolve);
        });
    }

    private async handleSetTheme(event: IpcMainInvokeEvent, theme: string): Promise<void> {
        this.emit('theme-set', theme);
    }

    // === 自启动相关处理程序 ===
    private async handleGetAutoStartStatus(): Promise<any> {
        return new Promise((resolve) => {
            this.emit('auto-start-get-status');
            this.once('auto-start-status-response', resolve);
        });
    }

    private async handleToggleAutoStart(): Promise<boolean> {
        return new Promise((resolve) => {
            this.emit('auto-start-toggle');
            this.once('auto-start-toggled', resolve);
        });
    }

    private async handleEnableAutoStart(event: IpcMainInvokeEvent, options?: any): Promise<void> {
        this.emit('auto-start-enable', options);
    }

    private async handleDisableAutoStart(): Promise<void> {
        this.emit('auto-start-disable');
    }

    // === 文件和文件夹操作处理程序 ===
    private async handleGetDefaultNotesFolder(event: IpcMainInvokeEvent): Promise<{ folderPath: string }> {
        try {
            const userDataPath = app.getPath('userData');
            const notesFolder = path.join(userDataPath, 'notes');

            // 确保 notes 文件夹存在
            await fs.mkdir(notesFolder, { recursive: true });

            return { folderPath: notesFolder };
        } catch (error) {
            logger.error('Get default notes folder error:', error);
            throw error;
        }
    } private async handleOpenFolderDialog(event: IpcMainInvokeEvent, options?: any): Promise<any> {
        try {
            // 构建对话框选项，确保 defaultPath 是字符串或不传递
            const dialogOptions: any = {
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

            const result = await dialog.showOpenDialog(dialogOptions);
            return result;
        } catch (error) {
            logger.error('Open folder dialog error:', error);
            throw error;
        }
    }

    private async handleListMarkdownFiles(event: IpcMainInvokeEvent, folderPath: string): Promise<any> {
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
        } catch (error) {
            logger.error('List markdown files error:', error);
            throw error;
        }
    }

    private async handleReadFile(event: IpcMainInvokeEvent, filePath: string): Promise<any> {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const stat = await fs.stat(filePath);

            return {
                content,
                lastModified: stat.mtime,
                size: stat.size
            };
        } catch (error) {
            logger.error('Read file error:', error);
            throw error;
        }
    }

    private async handleWriteFile(event: IpcMainInvokeEvent, filePath: string, content: string): Promise<any> {
        try {
            await fs.writeFile(filePath, content, 'utf-8');
            logger.info(`File written: ${filePath}`);
            return { filePath };
        } catch (error) {
            logger.error('Write file error:', error);
            throw error;
        }
    }

    private async handleDeleteFile(event: IpcMainInvokeEvent, filePath: string): Promise<any> {
        try {
            await fs.unlink(filePath);
            logger.info(`File deleted: ${filePath}`);
            return { filePath };
        } catch (error) {
            logger.error('Delete file error:', error);
            throw error;
        }
    } private async handleOpenExternal(event: IpcMainInvokeEvent, url: string): Promise<void> {
        try {
            await shell.openExternal(url);
            logger.info(`Opened external URL: ${url}`);
        } catch (error) {
            logger.error('Open external URL error:', error);
            throw error;
        }
    }

    /**
     * 处理在社区页面中打开URL请求
     */
    private async handleOpenUrlInCommunity(event: IpcMainInvokeEvent, url: string): Promise<void> {
        try {
            // 通知窗口管理器切换到在线页面并导航到指定URL
            this.emit('navigate-to-online', url);
            logger.info(`Navigate to online page with URL: ${url}`);
        } catch (error) {
            logger.error('Open URL in community error:', error);
            throw error;
        }
    }

    /**
     * 处理打开开发者工具请求
     */
    private async handleOpenDevTools(event: IpcMainInvokeEvent): Promise<void> {
        try {
            this.emit('devtools:open');
            logger.info('DevTools open requested from renderer');
        } catch (error) {
            logger.error('Open DevTools error:', error);
            throw error;
        }
    }

    /**
     * 处理关闭开发者工具请求
     */
    private async handleCloseDevTools(event: IpcMainInvokeEvent): Promise<void> {
        try {
            this.emit('devtools:close');
            logger.info('DevTools close requested from renderer');
        } catch (error) {
            logger.error('Close DevTools error:', error);
            throw error;
        }
    }    /**
     * 处理切换开发者工具请求
     */
    private async handleToggleDevTools(event: IpcMainInvokeEvent): Promise<void> {
        try {
            this.emit('devtools:toggle');
            logger.info('DevTools toggle requested from renderer');
        } catch (error) {
            logger.error('Toggle DevTools error:', error);
            throw error;
        }
    }    /**
     * 处理动画设置更新请求
     */
    private async handleUpdateAnimationSettings(event: IpcMainInvokeEvent, settings: { showAnimationDuration: number; hideAnimationDuration: number }): Promise<void> {
        try {
            this.emit('update-animation-settings', settings);
            logger.info('Animation settings update requested:', settings);
        } catch (error) {
            logger.error('Update animation settings error:', error);
            throw error;
        }
    }

    /**
     * 处理获取所有快捷键请求
     */
    private async handleGetAllShortcuts(event: IpcMainInvokeEvent): Promise<void> {
        try {
            this.emit('shortcut-get-all');
            logger.debug('Get all shortcuts requested from renderer');
        } catch (error) {
            logger.error('Get all shortcuts error:', error);
            throw error;
        }
    }

    /**
     * 处理更新快捷键请求
     */
    private async handleUpdateShortcut(event: IpcMainInvokeEvent, data: { action: string, shortcut: string }): Promise<void> {
        try {
            this.emit('shortcut-update', data);
            logger.info('Shortcut update requested:', data);
        } catch (error) {
            logger.error('Update shortcut error:', error);
            throw error;
        }
    }

    /**
     * 处理获取快捷键建议请求
     */
    private async handleGetShortcutSuggestions(event: IpcMainInvokeEvent): Promise<void> {
        try {
            this.emit('shortcut-get-suggestions');
            logger.debug('Get shortcut suggestions requested from renderer');
        } catch (error) {
            logger.error('Get shortcut suggestions error:', error);
            throw error;
        }
    }

    /**
     * 处理验证快捷键请求
     */
    private async handleValidateShortcut(event: IpcMainInvokeEvent, shortcut: string): Promise<void> {
        try {
            this.emit('shortcut-validate', shortcut);
            logger.debug('Validate shortcut requested:', shortcut);
        } catch (error) {
            logger.error('Validate shortcut error:', error);
            throw error;
        }
    }

    /**
     * 处理格式化快捷键请求
     */
    private async handleFormatShortcut(event: IpcMainInvokeEvent, shortcut: string): Promise<void> {
        try {
            this.emit('shortcut-format', shortcut);
            logger.debug('Format shortcut requested:', shortcut);
        } catch (error) {
            logger.error('Format shortcut error:', error);
            throw error;
        }
    }

    /**
     * 移除处理程序
     */
    public removeHandler(channel: string): void {
        if (this.handlers.has(channel)) {
            ipcMain.removeHandler(channel);
            this.handlers.delete(channel);
            logger.debug(`Removed IPC handler: ${channel}`);
        }
    }

    /**
     * 移除所有处理程序
     */
    public removeAllHandlers(): void {
        Array.from(this.handlers.keys()).forEach(channel => {
            ipcMain.removeHandler(channel);
        });
        this.handlers.clear();
        logger.info('All IPC handlers removed');
    }

    /**
     * 获取已注册的处理程序列表
     */
    public getRegisteredHandlers(): string[] {
        return Array.from(this.handlers.keys());
    }

    /**
     * 销毁服务
     */
    public destroy(): void {
        this.removeAllHandlers();
        this.removeAllListeners();
        logger.info('IPCService destroyed');
    }
}
