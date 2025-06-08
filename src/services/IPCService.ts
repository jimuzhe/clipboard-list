import { ipcMain, IpcMainInvokeEvent, WebContents } from 'electron';
import { EventEmitter } from 'events';
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
        this.registerHandler('app:set-config', this.handleSetConfig.bind(this));
        this.registerHandler('app:show-notification', this.handleShowNotification.bind(this));

        // 窗口控制
        this.registerHandler('window:minimize', this.handleMinimizeWindow.bind(this));
        this.registerHandler('window:close', this.handleCloseWindow.bind(this));
        this.registerHandler('window:show', this.handleShowWindow.bind(this));
        this.registerHandler('window:hide', this.handleHideWindow.bind(this));
        this.registerHandler('window:toggle-always-on-top', this.handleToggleAlwaysOnTop.bind(this));
        this.registerHandler('window:set-size', this.handleSetWindowSize.bind(this));
        this.registerHandler('window:get-bounds', this.handleGetWindowBounds.bind(this));

        // 剪切板相�?
        this.registerHandler('clipboard:read', this.handleReadClipboard.bind(this));
        this.registerHandler('clipboard:write', this.handleWriteClipboard.bind(this));
        this.registerHandler('clipboard:get-history', this.handleGetClipboardHistory.bind(this));
        this.registerHandler('clipboard:clear-history', this.handleClearClipboardHistory.bind(this));
        this.registerHandler('clipboard:toggle-pin', this.handleToggleClipboardPin.bind(this));
        this.registerHandler('clipboard:remove-item', this.handleRemoveClipboardItem.bind(this));

        // 数据持久�?
        this.registerHandler('data:save', this.handleSaveData.bind(this));
        this.registerHandler('data:load', this.handleLoadData.bind(this));
        this.registerHandler('data:save-todos', this.handleSaveTodos.bind(this));
        this.registerHandler('data:load-todos', this.handleLoadTodos.bind(this));
        this.registerHandler('data:save-notes', this.handleSaveNotes.bind(this));
        this.registerHandler('data:load-notes', this.handleLoadNotes.bind(this));

        // 主题相关
        this.registerHandler('theme:get', this.handleGetTheme.bind(this));
        this.registerHandler('theme:set', this.handleSetTheme.bind(this));

        // 自启动相�?
        this.registerHandler('auto-start:get-status', this.handleGetAutoStartStatus.bind(this));
        this.registerHandler('auto-start:toggle', this.handleToggleAutoStart.bind(this));
        this.registerHandler('auto-start:enable', this.handleEnableAutoStart.bind(this));
        this.registerHandler('auto-start:disable', this.handleDisableAutoStart.bind(this));

        // ??????????? - ??????????API??
        this.setupCompatibilityAliases();

        logger.info('IPC handlers registered');
    }

    /**
     * ???????????
     * ??????????API??????????????
     */
    private setupCompatibilityAliases(): void {
        // ??????
        this.registerHandler('get-app-version', this.handleGetAppVersion.bind(this));
        this.registerHandler('get-config', this.handleGetConfig.bind(this));
        this.registerHandler('set-config', this.handleSetConfig.bind(this));
        this.registerHandler('show-notification', this.handleShowNotification.bind(this));

        // ??????
        this.registerHandler('minimize-window', this.handleMinimizeWindow.bind(this));
        this.registerHandler('close-window', this.handleCloseWindow.bind(this));
        this.registerHandler('show-window', this.handleShowWindow.bind(this));
        this.registerHandler('hide-window', this.handleHideWindow.bind(this));
        this.registerHandler('toggle-always-on-top', this.handleToggleAlwaysOnTop.bind(this));
        this.registerHandler('set-window-size', this.handleSetWindowSize.bind(this));
        this.registerHandler('get-window-bounds', this.handleGetWindowBounds.bind(this));

        // ???????
        this.registerHandler('read-clipboard', this.handleReadClipboard.bind(this));
        this.registerHandler('write-clipboard', this.handleWriteClipboard.bind(this));
        this.registerHandler('get-clipboard-history', this.handleGetClipboardHistory.bind(this));
        this.registerHandler('clear-clipboard-history', this.handleClearClipboardHistory.bind(this));
        this.registerHandler('toggle-clipboard-pin', this.handleToggleClipboardPin.bind(this));
        this.registerHandler('remove-clipboard-item', this.handleRemoveClipboardItem.bind(this));

        // ???????
        this.registerHandler('save-data', this.handleSaveData.bind(this));
        this.registerHandler('load-data', this.handleLoadData.bind(this));
        this.registerHandler('save-todos', this.handleSaveTodos.bind(this));
        this.registerHandler('load-todos', this.handleLoadTodos.bind(this));
        this.registerHandler('save-notes', this.handleSaveNotes.bind(this));
        this.registerHandler('load-notes', this.handleLoadNotes.bind(this));

        // ??????
        this.registerHandler('get-theme', this.handleGetTheme.bind(this));
        this.registerHandler('set-theme', this.handleSetTheme.bind(this));

        // ???????
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
     * 广播消息到所有渲染进�?
     */
    public broadcast(channel: string, data?: any): void {
        this.emit('broadcast', { channel, data });
    }

    // === 应用相关处理程序 ===
    private async handleGetAppVersion(): Promise<string> {
        const { app } = require('electron');
        return app.getVersion();
    }

    private async handleGetConfig(): Promise<any> {
        this.emit('get-config');
        return new Promise((resolve) => {
            this.once('config-response', resolve);
        });
    }

    private async handleSetConfig(event: IpcMainInvokeEvent, config: Partial<AppConfig>): Promise<void> {
        this.emit('set-config', config);
    }

    private async handleShowNotification(event: IpcMainInvokeEvent, { title, body, icon }: { title: string; body: string; icon?: string }): Promise<void> {
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

    private async handleToggleAlwaysOnTop(): Promise<boolean> {
        return new Promise((resolve) => {
            this.emit('window-toggle-always-on-top');
            this.once('always-on-top-toggled', resolve);
        });
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

    // === 剪切板相关处理程�?===
    private async handleReadClipboard(): Promise<string> {
        return new Promise((resolve) => {
            this.emit('clipboard-read');
            this.once('clipboard-read-response', resolve);
        });
    }

    private async handleWriteClipboard(event: IpcMainInvokeEvent, text: string): Promise<void> {
        this.emit('clipboard-write', text);
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

    // === 数据持久化处理程�?===
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

    // === 自启动相关处理程�?===
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
   * 移除所服�?
   */  public removeAllHandlers(): void {
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
     * 销毁服�?
     */
    public destroy(): void {
        this.removeAllHandlers();
        this.removeAllListeners();
        logger.info('IPCService destroyed');
    }
}
