import { WebContents } from 'electron';
import { EventEmitter } from 'events';
/**
 * IPCćĺĄ - č´č´Łä¸ťčżç¨ĺć¸˛ćčżç¨äšé´çĺŽĺ¨éäżĄ
 */
export declare class IPCService extends EventEmitter {
    private handlers;
    constructor();
    /**
     * čŽžç˝ŽIPCĺ¤çç¨ĺş
     */
    private setupHandlers;
    /**
     * ???????????
     * ??????????API??????????????
     */
    private setupCompatibilityAliases;
    /**
     * ćł¨ĺIPCĺ¤çç¨ĺş
     */
    private registerHandler;
    /**
     * ĺéćśćŻĺ°ć¸˛ćčżç¨
     */
    sendToRenderer(webContents: WebContents, channel: string, data?: any): void;
    /**
     * ĺšżć­ćśćŻĺ°ććć¸˛ćčżç¨?
     */
    broadcast(channel: string, data?: any): void;
    private handleGetAppVersion;
    private handleGetConfig;
    private handleSetConfig;
    private handleShowNotification;
    private handleMinimizeWindow;
    private handleCloseWindow;
    private handleShowWindow;
    private handleHideWindow;
    private handleSetWindowSize;
    private handleGetWindowBounds;
    private handleSetTriggerZoneWidth;
    private handleGetTriggerZoneWidth;
    private handleSetEdgeTriggerEnabled;
    private handleGetEdgeTriggerEnabled;
    private handleReadClipboard;
    private handleWriteClipboard;
    private handleWriteImageClipboard;
    private handleGetClipboardHistory;
    private handleClearClipboardHistory;
    private handleToggleClipboardPin;
    private handleRemoveClipboardItem;
    private handleSaveData;
    private handleLoadData;
    private handleSaveTodos;
    private handleLoadTodos;
    private handleSaveNotes;
    private handleLoadNotes;
    private handleGetTheme;
    private handleSetTheme;
    private handleGetAutoStartStatus;
    private handleToggleAutoStart;
    private handleEnableAutoStart;
    private handleDisableAutoStart;
    private handleOpenFolderDialog;
    private handleListMarkdownFiles;
    private handleReadFile;
    private handleWriteFile;
    private handleDeleteFile;
    private handleOpenExternal;
    /**
     * ç§ťé¤ĺ¤çç¨ĺş
     */
    removeHandler(channel: string): void;
    /**
     * ç§ťé¤ććĺ?
     */ removeAllHandlers(): void;
    /**
     * čˇĺĺˇ˛ćł¨ĺçĺ¤çç¨ĺşĺčĄ¨
     */
    getRegisteredHandlers(): string[];
    /**
     * éćŻćĺ?
     */
    destroy(): void;
}
//# sourceMappingURL=IPCService.d.ts.map