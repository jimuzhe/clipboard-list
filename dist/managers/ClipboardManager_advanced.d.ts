import { BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import { ClipboardItem } from '../types/clipboard';
/**
 * 高级原生剪切板管理器 - 使用多种Windows原生机制
 * 结合全局快捷键、窗口事件、系统事件等，无需高频轮询
 */
export declare class AdvancedClipboardManager extends EventEmitter {
    private isMonitoring;
    private lastContent;
    private clipboardHistory;
    private maxHistorySize;
    private ignoreNextChange;
    private globalShortcutRegistered;
    private windowFocusWatcher?;
    private systemActivityWatcher?;
    private emergencyPoller?;
    private mainWindow?;
    private lastCheckTime;
    private minCheckInterval;
    private isCheckingClipboard;
    constructor(mainWindow?: BrowserWindow);
    /**
     * 初始化剪切板
     */
    private initializeClipboard;
    /**
     * 设置高级监听机制
     */
    private setupAdvancedListening;
    /**
     * 注册全局快捷键
     */
    private registerGlobalShortcuts;
    /**
     * 设置窗口事件监听
     */
    private setupWindowEventListening;
    /**
     * 设置系统活动监听
     */
    private setupSystemActivityListening;
    /**
     * 检测是否为剪切板相关快捷键
     */
    private isClipboardShortcut;
    /**
     * 剪切板操作回调
     */
    private onClipboardAction;
    /**
     * 调度剪切板检查（防抖）
     */
    private scheduleClipboardCheck;
    /**
     * 开始监控剪切板变化
     */
    startMonitoring(): void;
    /**
     * 停止监控剪切板变化
     */
    stopMonitoring(): void;
    /**
     * 检查剪切板变化
     */
    private checkClipboardChanges;
    /**
     * 创建剪切板条目
     */
    private createClipboardItem;
    /**
     * 检测内容类型
     */
    private detectContentType;
    /**
     * URL 检测 (增强版)
     */
    private isUrl;
    /**
     * 邮箱检测
     */
    private isEmail;
    /**
     * JSON 检测
     */
    private isJson;
    /**
     * 代码检测 (增强版)
     */
    private isCode;
    /**
     * 文件路径检测
     */
    private isFilePath;
    /**
     * 检测代码语言 (增强版)
     */
    private detectCodeLanguage;
    /**
     * 添加到历史记录
     */
    private addToHistory;
    /**
     * 生成唯一ID
     */
    private generateId;
    /**
     * 读取剪切板内容
     */
    readFromClipboard(): string;
    /**
     * 写入剪切板
     */
    writeToClipboard(text: string): void;
    getHistory(): ClipboardItem[];
    clearHistory(): void;
    togglePin(id: string): boolean;
    removeItem(id: string): boolean;
    setMaxHistorySize(size: number): void;
    forceCheck(): void;
    isMonitoringActive(): boolean;
    destroy(): void;
}
//# sourceMappingURL=ClipboardManager_advanced.d.ts.map