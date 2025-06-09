"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCService = void 0;
const electron_1 = require("electron");
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
/**
 * IPCćĺĄ - č´č´Łä¸ťčżç¨ĺć¸˛ćčżç¨äšé´çĺŽĺ¨éäżĄ
 */
class IPCService extends events_1.EventEmitter {
    constructor() {
        super();
        this.handlers = new Map();
        this.setupHandlers();
    }
    /**
     * čŽžç˝ŽIPCĺ¤çç¨ĺş
     */
    setupHandlers() {
        // ĺşç¨ç¸ĺł
        this.registerHandler('app:get-version', this.handleGetAppVersion.bind(this));
        this.registerHandler('app:get-config', this.handleGetConfig.bind(this));
        this.registerHandler('app:set-config', this.handleSetConfig.bind(this));
        this.registerHandler('app:show-notification', this.handleShowNotification.bind(this));
        // çŞĺŁć§ĺś
        this.registerHandler('window:minimize', this.handleMinimizeWindow.bind(this));
        this.registerHandler('window:close', this.handleCloseWindow.bind(this));
        this.registerHandler('window:show', this.handleShowWindow.bind(this));
        this.registerHandler('window:hide', this.handleHideWindow.bind(this));
        this.registerHandler('window:toggle-always-on-top', this.handleToggleAlwaysOnTop.bind(this));
        this.registerHandler('window:set-size', this.handleSetWindowSize.bind(this));
        this.registerHandler('window:get-bounds', this.handleGetWindowBounds.bind(this));
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
        // ??????????? - ??????????API??
        this.setupCompatibilityAliases();
        Logger_1.logger.info('IPC handlers registered');
    }
    /**
     * ???????????
     * ??????????API??????????????
     */
    setupCompatibilityAliases() {
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
        Logger_1.logger.info('IPC compatibility aliases registered');
    }
    /**
     * ćł¨ĺIPCĺ¤çç¨ĺş
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
     * ĺéćśćŻĺ°ć¸˛ćčżç¨
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
     * ĺšżć­ćśćŻĺ°ććć¸˛ćčżç¨?
     */
    broadcast(channel, data) {
        this.emit('broadcast', { channel, data });
    }
    // === ĺşç¨ç¸ĺłĺ¤çç¨ĺş ===
    async handleGetAppVersion() {
        const { app } = require('electron');
        return app.getVersion();
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
    // === çŞĺŁć§ĺśĺ¤çç¨ĺş ===
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
    async handleToggleAlwaysOnTop() {
        return new Promise((resolve) => {
            this.emit('window-toggle-always-on-top');
            this.once('always-on-top-toggled', resolve);
        });
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
    // === ĺŞĺćżç¸ĺłĺ¤çç¨ĺş?===
    async handleReadClipboard() {
        return new Promise((resolve) => {
            this.emit('clipboard-read');
            this.once('clipboard-read-response', resolve);
        });
    }
    async handleWriteClipboard(event, text) {
        this.emit('clipboard-write', text);
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
    // === ć°ćŽćäšĺĺ¤çç¨ĺş?===
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
    // === ä¸ťé˘ç¸ĺłĺ¤çç¨ĺş ===
    async handleGetTheme() {
        return new Promise((resolve) => {
            this.emit('theme-get');
            this.once('theme-response', resolve);
        });
    }
    async handleSetTheme(event, theme) {
        this.emit('theme-set', theme);
    }
    // === čŞĺŻĺ¨ç¸ĺłĺ¤çç¨ĺş?===
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
    /**
     * ç§ťé¤ĺ¤çç¨ĺş
     */
    removeHandler(channel) {
        if (this.handlers.has(channel)) {
            electron_1.ipcMain.removeHandler(channel);
            this.handlers.delete(channel);
            Logger_1.logger.debug(`Removed IPC handler: ${channel}`);
        }
    }
    /**
     * ç§ťé¤ććĺ?
     */ removeAllHandlers() {
        Array.from(this.handlers.keys()).forEach(channel => {
            electron_1.ipcMain.removeHandler(channel);
        });
        this.handlers.clear();
        Logger_1.logger.info('All IPC handlers removed');
    }
    /**
     * čˇĺĺˇ˛ćł¨ĺçĺ¤çç¨ĺşĺčĄ¨
     */
    getRegisteredHandlers() {
        return Array.from(this.handlers.keys());
    }
    /**
     * éćŻćĺ?
     */
    destroy() {
        this.removeAllHandlers();
        this.removeAllListeners();
        Logger_1.logger.info('IPCService destroyed');
    }
}
exports.IPCService = IPCService;
//# sourceMappingURL=IPCService.js.map