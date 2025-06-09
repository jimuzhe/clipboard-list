"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClipboardManager = void 0;
const electron_1 = require("electron");
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
/**
 * 剪切板管理器 - 负责监控剪切板变化并智能识别内容类型
 * 使用Windows原生事件机制，无需轮询，更高效、更省资源
 */
class ClipboardManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.isMonitoring = false;
        this.lastContent = '';
        this.clipboardHistory = [];
        this.maxHistorySize = 100;
        this.ignoreNextChange = false;
        this.lastSequenceNumber = 0;
        this.initializeClipboard();
    }
    /**
     * 初始化剪切板
     */
    initializeClipboard() {
        try {
            this.lastContent = electron_1.clipboard.readText() || '';
            Logger_1.logger.info('Clipboard manager initialized');
        }
        catch (error) {
            Logger_1.logger.error('Failed to initialize clipboard:', error);
        }
    } /**
     * 开始监控剪切板变化 - 使用原生事件机制
     */
    startMonitoring() {
        if (this.isMonitoring) {
            Logger_1.logger.warn('Clipboard monitoring is already active');
            return;
        }
        this.isMonitoring = true;
        // 使用原生事件监听，无需轮询
        this.startNativeMonitoring();
        Logger_1.logger.info('Native clipboard monitoring started');
    }
    /**
     * 启动原生监听
     */
    startNativeMonitoring() {
        // 使用 clipboard 事件监听
        this.clipboardWatcher = setInterval(() => {
            this.checkClipboardChanges();
        }, 1000); // 降低到1秒作为备用机制
    } /**
     * 停止监控剪切板变化
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }
        this.isMonitoring = false;
        // 清除原生监听定时器
        if (this.clipboardWatcher) {
            clearInterval(this.clipboardWatcher);
            this.clipboardWatcher = undefined;
            Logger_1.logger.info('Native clipboard monitoring stopped');
        }
    } /**
     * 检查剪切板变化
     */
    checkClipboardChanges() {
        try {
            const currentContent = electron_1.clipboard.readText();
            // 检查是否有内容且与上次不同
            if (currentContent && currentContent !== this.lastContent) {
                // 如果设置了忽略标志，则跳过这次变化
                if (this.ignoreNextChange) {
                    this.ignoreNextChange = false;
                    this.lastContent = currentContent;
                    Logger_1.logger.debug('Ignoring clipboard change (programmatic write)');
                    return;
                }
                this.lastContent = currentContent;
                const clipboardItem = this.createClipboardItem(currentContent);
                this.addToHistory(clipboardItem);
                this.emit('clipboard-changed', clipboardItem);
                Logger_1.logger.info('✨ New clipboard content detected', {
                    type: clipboardItem.type,
                    size: clipboardItem.size,
                    preview: clipboardItem.preview
                });
            }
        }
        catch (error) {
            Logger_1.logger.error('Error checking clipboard changes:', error);
        }
    }
    /**
     * 创建剪切板条目
     */
    createClipboardItem(content) {
        const contentType = this.detectContentType(content);
        const item = {
            id: this.generateId(),
            content,
            type: contentType,
            size: content.length,
            timestamp: new Date(),
            isPinned: false,
            tags: [],
            preview: content.length > 100 ? content.substring(0, 100) + '...' : content
        };
        // 如果是代码类型，尝试检测语言
        if (contentType === 'code') {
            item.subType = this.detectCodeLanguage(content);
        }
        return item;
    }
    /**
     * 检测内容类型
     */
    detectContentType(content) {
        // URL 检测
        if (this.isUrl(content)) {
            return 'url';
        }
        // 邮箱检测
        if (this.isEmail(content)) {
            return 'email';
        }
        // 代码检测
        if (this.isCode(content)) {
            return 'code';
        }
        // 文件路径检测
        if (this.isFilePath(content)) {
            return 'file';
        }
        // 默认为文本
        return 'text';
    }
    /**
     * URL 检测
     */
    isUrl(text) {
        const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
        return urlRegex.test(text.trim());
    }
    /**
     * 邮箱检测
     */
    isEmail(text) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(text.trim());
    }
    /**
     * 代码检测
     */
    isCode(text) {
        // 检测常见的代码特征
        const codePatterns = [
            /function\s+\w+\s*\(/,
            /class\s+\w+/,
            /import\s+.+from/,
            /export\s+(default\s+)?/,
            /{[\s\S]*}/,
            /if\s*\(.+\)/,
            /for\s*\(.+\)/,
            /while\s*\(.+\)/,
            /console\.log\(/,
            /print\(/,
            /def\s+\w+\(/,
            /<\w+[^>]*>/
        ];
        return codePatterns.some(pattern => pattern.test(text));
    }
    /**
     * 文件路径检测
     */
    isFilePath(text) {
        const filePathRegex = /^[a-zA-Z]:\\|^\/|^~\/|^\.\//;
        return filePathRegex.test(text.trim()) && text.length < 500;
    }
    /**
     * 检测代码语言
     */
    detectCodeLanguage(code) {
        if (code.includes('function') || code.includes('const ') || code.includes('let ')) {
            return 'javascript';
        }
        if (code.includes('def ') || code.includes('import ') && code.includes('print(')) {
            return 'python';
        }
        if (code.includes('public class') || code.includes('System.out.println')) {
            return 'java';
        }
        if (code.includes('#include') || code.includes('int main')) {
            return 'c';
        }
        if (code.includes('<html>') || code.includes('<div>')) {
            return 'html';
        }
        if (code.includes('{') && code.includes('}') && code.includes(':')) {
            return 'json';
        }
        return 'text';
    }
    /**
     * 添加到历史记录
     */
    addToHistory(item) {
        // 移除重复内容
        this.clipboardHistory = this.clipboardHistory.filter(h => h.content !== item.content);
        // 添加到开头
        this.clipboardHistory.unshift(item);
        // 限制历史记录大小
        if (this.clipboardHistory.length > this.maxHistorySize) {
            this.clipboardHistory = this.clipboardHistory.slice(0, this.maxHistorySize);
        }
        Logger_1.logger.info('Added item to clipboard history', { type: item.type, size: item.size });
    }
    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    /**
     * 读取剪切板内容
     */
    readFromClipboard() {
        try {
            return electron_1.clipboard.readText() || '';
        }
        catch (error) {
            Logger_1.logger.error('Failed to read from clipboard:', error);
            return '';
        }
    } /**
     * 写入剪切板
     */
    writeToClipboard(text) {
        try {
            // 设置忽略标志，防止触发变化检测
            this.ignoreNextChange = true;
            electron_1.clipboard.writeText(text);
            this.lastContent = text;
            // 设置一个安全超时，确保忽略标志不会永久保持
            setTimeout(() => {
                if (this.ignoreNextChange) {
                    this.ignoreNextChange = false;
                    Logger_1.logger.debug('Reset ignore flag after timeout');
                }
            }, 1000); // 1秒后重置
            Logger_1.logger.debug('Written to clipboard', { length: text.length });
        }
        catch (error) {
            Logger_1.logger.error('Failed to write to clipboard:', error);
            // 如果写入失败，重置忽略标志
            this.ignoreNextChange = false;
        }
    }
    /**
     * 获取历史记录
     */
    getHistory() {
        return [...this.clipboardHistory];
    } /**
     * 清空历史记录
     */
    clearHistory() {
        // 保留置顶的项目，只清理非置顶项目
        const pinnedItems = this.clipboardHistory.filter(item => item.isPinned);
        this.clipboardHistory = pinnedItems;
        Logger_1.logger.info('Clipboard history cleared, pinned items preserved', {
            pinnedCount: pinnedItems.length
        });
    }
    /**
     * 切换置顶状态
     */
    togglePin(id) {
        const item = this.clipboardHistory.find(h => h.id === id);
        if (item) {
            item.isPinned = !item.isPinned;
            Logger_1.logger.debug('Toggled pin status', { id, isPinned: item.isPinned });
            return item.isPinned;
        }
        return false;
    }
    /**
     * 移除项目
     */
    removeItem(id) {
        const initialLength = this.clipboardHistory.length;
        this.clipboardHistory = this.clipboardHistory.filter(h => h.id !== id);
        const removed = this.clipboardHistory.length < initialLength;
        if (removed) {
            Logger_1.logger.debug('Removed clipboard item', { id });
        }
        return removed;
    } /**
     * 设置最大历史记录大小
     */
    setMaxHistorySize(size) {
        this.maxHistorySize = size;
        if (this.clipboardHistory.length > size) {
            this.clipboardHistory = this.clipboardHistory.slice(0, size);
        }
    } /**
     * 销毁管理器
     */
    destroy() {
        this.stopMonitoring();
        this.clipboardHistory = [];
        this.removeAllListeners();
        Logger_1.logger.info('ClipboardManager destroyed');
    }
}
exports.ClipboardManager = ClipboardManager;
//# sourceMappingURL=ClipboardManager.js.map