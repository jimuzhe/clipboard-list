import { BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import { ClipboardItem } from '../types/clipboard';
/**
 * 原生剪切板管理器 - 使用Windows原生事件机制
 * 无需轮询，监听系统剪切板变化事件，高效省资源
 */
export declare class ClipboardManagerNative extends EventEmitter {
    private isMonitoring;
    private lastContent;
    private lastImageHash;
    private clipboardHistory;
    private maxHistorySize;
    private ignoreNextChange;
    private clipboardWatcher?;
    private lastClipboardTime;
    private mainWindow?;
    constructor(mainWindow?: BrowserWindow);
    /**
     * 初始化剪切板
     */
    private initializeClipboard;
    /**
     * 设置原生监听机制
     */
    private setupNativeListening;
    /**
     * 检测Ctrl+C组合键
     */
    private isCtrlC;
    /**
     * 检测Ctrl+X组合键
     */
    private isCtrlX;
    /**
     * 检测Ctrl+V组合键
     */
    private isCtrlV;
    /**
     * 窗口获得焦点时检查剪切板
     */
    private checkClipboardOnFocus;
    /**
     * 开始监控剪切板变化
     */
    startMonitoring(): void;
    /**
     * 启动基于事件的监控
     */
    private startEventBasedMonitoring;
    /**
     * 停止监控剪切板变化
     */
    stopMonitoring(): void; /**
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
     * URL 检测
     */
    private isUrl;
    /**
     * 邮箱检测
     */
    private isEmail;
    /**
     * 代码检测
     */
    private isCode;
    /**
     * 文件路径检测
     */
    private isFilePath;
    /**
     * 检测代码语言
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
    /**
     * 获取历史记录
     */
    getHistory(): ClipboardItem[]; /**
     * 清空历史记录
     */
    clearHistory(): void;
    /**
     * 切换置顶状态
     */
    togglePin(id: string): boolean;
    /**
     * 移除项目
     */
    removeItem(id: string): boolean;
    /**
     * 设置最大历史记录大小
     */
    setMaxHistorySize(size: number): void;
    /**
     * 手动触发剪切板检查
     */
    forceCheck(): void;
    /**
     * 获取监控状态
     */
    isMonitoringActive(): boolean;
    /**
     * 销毁管理器
     */
    destroy(): void;
    /**
     * 处理剪切操作 (Ctrl+X)
     * 剪切操作可能有延迟，需要多次检查
     */
    private handleCutOperation;
    /**
     * 处理图片剪切板内容
     */
    private handleImageClipboard;
    /**
     * 生成图片的哈希标识符
     */
    private generateImageHash;
}
//# sourceMappingURL=ClipboardManager_native.d.ts.map