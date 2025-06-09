import { EventEmitter } from 'events';
import { ClipboardItem } from '../types/clipboard';
/**
 * 剪切板管理器 - 负责监控剪切板变化并智能识别内容类型
 * 使用Windows原生事件机制，无需轮询，更高效、更省资源
 */
export declare class ClipboardManager extends EventEmitter {
    private isMonitoring;
    private lastContent;
    private clipboardHistory;
    private maxHistorySize;
    private ignoreNextChange;
    private clipboardWatcher?;
    private lastSequenceNumber;
    constructor();
    /**
     * 初始化剪切板
     */
    private initializeClipboard; /**
     * 开始监控剪切板变化 - 使用原生事件机制
     */
    startMonitoring(): void;
    /**
     * 启动原生监听
     */
    private startNativeMonitoring; /**
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
    readFromClipboard(): string; /**
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
    removeItem(id: string): boolean; /**
     * 设置最大历史记录大小
     */
    setMaxHistorySize(size: number): void; /**
     * 销毁管理器
     */
    destroy(): void;
}
//# sourceMappingURL=ClipboardManager.d.ts.map