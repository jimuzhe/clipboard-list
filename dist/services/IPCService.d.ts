import { WebContents } from 'electron';
import { EventEmitter } from 'events';
/**
 * IPC服务 - 负责主进程和渲染进程之间的安全通信
 */
export declare class IPCService extends EventEmitter {
    private handlers;
    constructor();
    /**
     * 设置IPC处理程序
     */
    private setupHandlers;
    /**
     * 设置兼容性别名
     */
    private setupCompatibilityAliases;
    /**
     * 注册IPC处理程序
     */
    private registerHandler;
    /**
     * 发送消息到渲染进程
     */
    sendToRenderer(webContents: WebContents, channel: string, data?: any): void;
    /**
     * 广播消息到所有渲染进程
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
    private handleGetDefaultNotesFolder;
    private handleOpenFolderDialog;
    private handleListMarkdownFiles;
    private handleReadFile;
    private handleWriteFile;
    private handleDeleteFile;
    private handleOpenExternal;
    /**
     * 处理打开开发者工具请求
     */
    private handleOpenDevTools;
    /**
     * 处理关闭开发者工具请求
     */
    private handleCloseDevTools;
    /**
     * 处理切换开发者工具请求
     */
    private handleToggleDevTools;
    /**
     * 移除处理程序
     */
    removeHandler(channel: string): void;
    /**
     * 移除所有处理程序
     */
    removeAllHandlers(): void;
    /**
     * 获取已注册的处理程序列表
     */
    getRegisteredHandlers(): string[];
    /**
     * 销毁服务
     */
    destroy(): void;
}
//# sourceMappingURL=IPCService.d.ts.map