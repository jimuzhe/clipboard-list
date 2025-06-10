import { ipcMain, IpcMainInvokeEvent, WebContents, dialog, shell } from 'electron';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../utils/Logger';
import { ClipboardItem } from '../types/clipboard';
import { TodoItem } from '../types/todo';
import { Note } from '../types/notes';
import { AppConfig } from '../types';

/**
 * IPCćĺĄ - č´č´Łä¸ťčżç¨ĺć¸˛ćčżç¨äšé´çĺŽĺ¨éäżĄ
 */
export class IPCService extends EventEmitter {
    private handlers: Map<string, Function> = new Map();

    constructor() {
        super();
        this.setupHandlers();
    }

    /**
     * čŽžç˝ŽIPCĺ¤çç¨ĺş
     */
    private setupHandlers(): void {
        // ĺşç¨ç¸ĺł
        this.registerHandler('app:get-version', this.handleGetAppVersion.bind(this));
        this.registerHandler('app:get-config', this.handleGetConfig.bind(this));
        this.registerHandler('app:set-config', this.handleSetConfig.bind(this));
        this.registerHandler('app:show-notification', this.handleShowNotification.bind(this));

        // çŞĺŁć§ĺś
        this.registerHandler('window:minimize', this.handleMinimizeWindow.bind(this));
        this.registerHandler('window:close', this.handleCloseWindow.bind(this));
        this.registerHandler('window:show', this.handleShowWindow.bind(this));
        this.registerHandler('window:hide', this.handleHideWindow.bind(this)); this.registerHandler('window:set-size', this.handleSetWindowSize.bind(this));
        this.registerHandler('window:get-bounds', this.handleGetWindowBounds.bind(this));

        // 边缘触发功能
        this.registerHandler('window:set-trigger-zone-width', this.handleSetTriggerZoneWidth.bind(this));
        this.registerHandler('window:get-trigger-zone-width', this.handleGetTriggerZoneWidth.bind(this));
        this.registerHandler('window:set-edge-trigger-enabled', this.handleSetEdgeTriggerEnabled.bind(this));
        this.registerHandler('window:get-edge-trigger-enabled', this.handleGetEdgeTriggerEnabled.bind(this));

        // ĺŞĺćżç¸ĺ?
        this.registerHandler('clipboard:read', this.handleReadClipboard.bind(this));
        this.registerHandler('clipboard:write', this.handleWriteClipboard.bind(this));
        this.registerHandler('clipboard:get-history', this.handleGetClipboardHistory.bind(this));
        this.registerHandler('clipboard:clear-history', this.handleClearClipboardHistory.bind(this));
        this.registerHandler('clipboard:toggle-pin', this.handleToggleClipboardPin.bind(this));
        this.registerHandler('clipboard:remove-item', this.handleRemoveClipboardItem.bind(this));

        // ć°ćŽćäšĺ?
        this.registerHandler('data:save', this.handleSaveData.bind(this));
        this.registerHandler('data:load', this.handleLoadData.bind(this));
        this.registerHandler('data:save-todos', this.handleSaveTodos.bind(this));
        this.registerHandler('data:load-todos', this.handleLoadTodos.bind(this));
        this.registerHandler('data:save-notes', this.handleSaveNotes.bind(this));
        this.registerHandler('data:load-notes', this.handleLoadNotes.bind(this));

        // ä¸ťé˘ç¸ĺł
        this.registerHandler('theme:get', this.handleGetTheme.bind(this));
        this.registerHandler('theme:set', this.handleSetTheme.bind(this));

        // čŞĺŻĺ¨ç¸ĺ?
        this.registerHandler('auto-start:get-status', this.handleGetAutoStartStatus.bind(this));
        this.registerHandler('auto-start:toggle', this.handleToggleAutoStart.bind(this));
        this.registerHandler('auto-start:enable', this.handleEnableAutoStart.bind(this));
        this.registerHandler('auto-start:disable', this.handleDisableAutoStart.bind(this));

        // 文件和文件夹操作
        this.registerHandler('open-folder-dialog', this.handleOpenFolderDialog.bind(this));
        this.registerHandler('list-markdown-files', this.handleListMarkdownFiles.bind(this));
        this.registerHandler('read-file', this.handleReadFile.bind(this));
        this.registerHandler('write-file', this.handleWriteFile.bind(this));
        this.registerHandler('delete-file', this.handleDeleteFile.bind(this));
        this.registerHandler('open-external', this.handleOpenExternal.bind(this));

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
        this.registerHandler('show-notification', this.handleShowNotification.bind(this));        // 窗口相关
        this.registerHandler('minimize-window', this.handleMinimizeWindow.bind(this));
        this.registerHandler('close-window', this.handleCloseWindow.bind(this));
        this.registerHandler('show-window', this.handleShowWindow.bind(this));
        this.registerHandler('hide-window', this.handleHideWindow.bind(this)); this.registerHandler('set-window-size', this.handleSetWindowSize.bind(this));
        this.registerHandler('get-window-bounds', this.handleGetWindowBounds.bind(this));        // ???????
        this.registerHandler('read-clipboard', this.handleReadClipboard.bind(this));
        this.registerHandler('write-clipboard', this.handleWriteClipboard.bind(this));
        this.registerHandler('write-image-clipboard', this.handleWriteImageClipboard.bind(this));
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
     * ćł¨ĺIPCĺ¤çç¨ĺş
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
     * ĺéćśćŻĺ°ć¸˛ćčżç¨
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
     * ĺšżć­ćśćŻĺ°ććć¸˛ćčżç¨?
     */
    public broadcast(channel: string, data?: any): void {
        this.emit('broadcast', { channel, data });
    }

    // === ĺşç¨ç¸ĺłĺ¤çç¨ĺş ===
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

    // === çŞĺŁć§ĺśĺ¤çç¨ĺş ===
    private async handleMinimizeWindow(): Promise<void> {
        this.emit('window-minimize');
    }

    private async handleCloseWindow(): Promise<void> {
        this.emit('window-close');
    }

    private async handleShowWindow(): Promise<void> {
        this.emit('window-show');
    } private async handleHideWindow(): Promise<void> {
        this.emit('window-hide');
    }

    private async handleSetWindowSize(event: IpcMainInvokeEvent, { width, height }: { width: number; height: number }): Promise<void> {
        this.emit('window-set-size', { width, height });
    } private async handleGetWindowBounds(): Promise<any> {
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
    }

    private async handleGetEdgeTriggerEnabled(): Promise<boolean> {
        return new Promise((resolve) => {
            this.emit('window-get-edge-trigger-enabled');
            this.once('edge-trigger-enabled-response', resolve);
        });
    }

    // === ĺŞĺćżç¸ĺłĺ¤çç¨ĺş?===
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

    // === ć°ćŽćäšĺĺ¤çç¨ĺş?===
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

    // === ä¸ťé˘ç¸ĺłĺ¤çç¨ĺş ===
    private async handleGetTheme(): Promise<string> {
        return new Promise((resolve) => {
            this.emit('theme-get');
            this.once('theme-response', resolve);
        });
    }

    private async handleSetTheme(event: IpcMainInvokeEvent, theme: string): Promise<void> {
        this.emit('theme-set', theme);
    }

    // === čŞĺŻĺ¨ç¸ĺłĺ¤çç¨ĺş?===
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
    private async handleOpenFolderDialog(event: IpcMainInvokeEvent, options?: any): Promise<any> {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openDirectory'],
                title: options?.title || '选择文件夹',
                ...options
            });
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

    private async handleWriteFile(event: IpcMainInvokeEvent, filePath: string, content: string): Promise<void> {
        try {
            await fs.writeFile(filePath, content, 'utf-8');
            logger.info(`File written: ${filePath}`);
        } catch (error) {
            logger.error('Write file error:', error);
            throw error;
        }
    }

    private async handleDeleteFile(event: IpcMainInvokeEvent, filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
            logger.info(`File deleted: ${filePath}`);
        } catch (error) {
            logger.error('Delete file error:', error);
            throw error;
        }
    }

    private async handleOpenExternal(event: IpcMainInvokeEvent, url: string): Promise<void> {
        try {
            await shell.openExternal(url);
            logger.info(`Opened external URL: ${url}`);
        } catch (error) {
            logger.error('Open external URL error:', error);
            throw error;
        }
    }

    /**
     * ç§ťé¤ĺ¤çç¨ĺş
     */
    public removeHandler(channel: string): void {
        if (this.handlers.has(channel)) {
            ipcMain.removeHandler(channel);
            this.handlers.delete(channel);
            logger.debug(`Removed IPC handler: ${channel}`);
        }
    }

  /**
   * ç§ťé¤ććĺ?
   */  public removeAllHandlers(): void {
        Array.from(this.handlers.keys()).forEach(channel => {
            ipcMain.removeHandler(channel);
        });
        this.handlers.clear();
        logger.info('All IPC handlers removed');
    }

    /**
     * čˇĺĺˇ˛ćł¨ĺçĺ¤çç¨ĺşĺčĄ¨
     */
    public getRegisteredHandlers(): string[] {
        return Array.from(this.handlers.keys());
    }

    /**
     * éćŻćĺ?
     */
    public destroy(): void {
        this.removeAllHandlers();
        this.removeAllListeners();
        logger.info('IPCService destroyed');
    }
}
