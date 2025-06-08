"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedClipboardManager = void 0;
const electron_1 = require("electron");
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
/**
 * 高级原生剪切板管理器 - 使用多种Windows原生机制
 * 结合全局快捷键、窗口事件、系统事件等，无需高频轮询
 */
class AdvancedClipboardManager extends events_1.EventEmitter {
    constructor(mainWindow) {
        super();
        this.isMonitoring = false;
        this.lastContent = '';
        this.clipboardHistory = [];
        this.maxHistorySize = 100;
        this.ignoreNextChange = false;
        // 多种监听机制
        this.globalShortcutRegistered = false;
        // 性能优化
        this.lastCheckTime = 0;
        this.minCheckInterval = 100; // 最小检查间隔
        this.isCheckingClipboard = false;
        this.mainWindow = mainWindow;
        this.initializeClipboard();
        this.setupAdvancedListening();
    }
    /**
     * 初始化剪切板
     */
    initializeClipboard() {
        try {
            this.lastContent = electron_1.clipboard.readText() || '';
            this.lastCheckTime = Date.now();
            Logger_1.logger.info('Advanced clipboard manager initialized');
        }
        catch (error) {
            Logger_1.logger.error('Failed to initialize clipboard:', error);
        }
    }
    /**
     * 设置高级监听机制
     */
    setupAdvancedListening() {
        // 1. 注册全局快捷键监听
        this.registerGlobalShortcuts();
        // 2. 设置窗口事件监听
        this.setupWindowEventListening();
        // 3. 设置系统活动监听
        this.setupSystemActivityListening();
    }
    /**
     * 注册全局快捷键
     */
    registerGlobalShortcuts() {
        try {
            // 监听 Ctrl+C
            const ctrlCRegistered = electron_1.globalShortcut.register('CommandOrControl+C', () => {
                this.onClipboardAction('copy');
            });
            // 监听 Ctrl+X
            const ctrlXRegistered = electron_1.globalShortcut.register('CommandOrControl+X', () => {
                this.onClipboardAction('cut');
            });
            // 监听 Ctrl+V (了解用户粘贴行为)
            const ctrlVRegistered = electron_1.globalShortcut.register('CommandOrControl+V', () => {
                this.onClipboardAction('paste');
            });
            this.globalShortcutRegistered = ctrlCRegistered && ctrlXRegistered && ctrlVRegistered;
            if (this.globalShortcutRegistered) {
                Logger_1.logger.info('✅ Global shortcuts registered successfully');
            }
            else {
                Logger_1.logger.warn('⚠️ Some global shortcuts failed to register');
            }
        }
        catch (error) {
            Logger_1.logger.error('❌ Failed to register global shortcuts:', error);
        }
    }
    /**
     * 设置窗口事件监听
     */
    setupWindowEventListening() {
        if (this.mainWindow) {
            // 窗口获得焦点时检查
            this.mainWindow.on('focus', () => {
                this.scheduleClipboardCheck('window-focus');
            });
            // 窗口失去焦点时也检查（用户可能切换到其他应用进行复制）
            this.mainWindow.on('blur', () => {
                this.scheduleClipboardCheck('window-blur');
            });
            // 监听键盘事件
            this.mainWindow.webContents.on('before-input-event', (event, input) => {
                if (this.isClipboardShortcut(input)) {
                    this.scheduleClipboardCheck(`keyboard-${input.key}`);
                }
            });
        }
    }
    /**
     * 设置系统活动监听
     */
    setupSystemActivityListening() {
        // 窗口焦点变化监听器
        this.windowFocusWatcher = setInterval(() => {
            if (this.mainWindow && this.mainWindow.isFocused()) {
                // 窗口有焦点时，检查剪切板
                this.scheduleClipboardCheck('focus-watcher');
            }
        }, 3000); // 3秒检查一次
        // 系统活动监听器
        this.systemActivityWatcher = setInterval(() => {
            // 基于系统活动的智能检查
            this.scheduleClipboardCheck('activity-watcher');
        }, 5000); // 5秒检查一次
    }
    /**
     * 检测是否为剪切板相关快捷键
     */
    isClipboardShortcut(input) {
        const isCtrl = input.control && !input.alt && !input.shift;
        return isCtrl && ['c', 'x', 'v'].includes(input.key.toLowerCase());
    }
    /**
     * 剪切板操作回调
     */
    onClipboardAction(action) {
        Logger_1.logger.debug(`🎯 Clipboard action detected: ${action}`);
        // 延迟检查，确保剪切板操作完成
        setTimeout(() => {
            this.scheduleClipboardCheck(`global-${action}`);
        }, action === 'paste' ? 0 : 100); // 粘贴不需要延迟，复制/剪切需要小延迟
    }
    /**
     * 调度剪切板检查（防抖）
     */
    scheduleClipboardCheck(source) {
        const now = Date.now();
        // 防抖：如果距离上次检查时间太短，则跳过
        if (now - this.lastCheckTime < this.minCheckInterval) {
            return;
        }
        // 如果正在检查，则跳过
        if (this.isCheckingClipboard) {
            return;
        }
        this.lastCheckTime = now;
        this.checkClipboardChanges(source);
    }
    /**
     * 开始监控剪切板变化
     */
    startMonitoring() {
        if (this.isMonitoring) {
            Logger_1.logger.warn('Advanced clipboard monitoring is already active');
            return;
        }
        this.isMonitoring = true;
        // 启动应急轮询（频率很低，作为备用机制）
        this.emergencyPoller = setInterval(() => {
            this.scheduleClipboardCheck('emergency-poll');
        }, 10000); // 10秒一次的应急检查
        Logger_1.logger.info('🚀 Advanced clipboard monitoring started');
        Logger_1.logger.info('📋 Using: Global shortcuts + Window events + System activity monitoring');
    }
    /**
     * 停止监控剪切板变化
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }
        this.isMonitoring = false;
        // 清除所有定时器
        if (this.windowFocusWatcher) {
            clearInterval(this.windowFocusWatcher);
            this.windowFocusWatcher = undefined;
        }
        if (this.systemActivityWatcher) {
            clearInterval(this.systemActivityWatcher);
            this.systemActivityWatcher = undefined;
        }
        if (this.emergencyPoller) {
            clearInterval(this.emergencyPoller);
            this.emergencyPoller = undefined;
        }
        // 注销全局快捷键
        if (this.globalShortcutRegistered) {
            electron_1.globalShortcut.unregisterAll();
            this.globalShortcutRegistered = false;
        }
        Logger_1.logger.info('⏹️ Advanced clipboard monitoring stopped');
    }
    /**
     * 检查剪切板变化
     */
    checkClipboardChanges(source = 'unknown') {
        if (!this.isMonitoring || this.isCheckingClipboard)
            return;
        this.isCheckingClipboard = true;
        try {
            const currentContent = electron_1.clipboard.readText();
            // 检查是否有内容且与上次不同
            if (currentContent && currentContent !== this.lastContent) {
                // 如果设置了忽略标志，则跳过这次变化
                if (this.ignoreNextChange) {
                    this.ignoreNextChange = false;
                    this.lastContent = currentContent;
                    Logger_1.logger.debug(`🔄 Ignoring clipboard change from ${source} (programmatic write)`);
                    return;
                }
                this.lastContent = currentContent;
                const clipboardItem = this.createClipboardItem(currentContent);
                this.addToHistory(clipboardItem);
                this.emit('clipboard-changed', clipboardItem);
                Logger_1.logger.info(`✨ Clipboard change detected from ${source}`, {
                    type: clipboardItem.type,
                    size: clipboardItem.size,
                    preview: clipboardItem.preview
                });
            }
        }
        catch (error) {
            Logger_1.logger.error(`❌ Error checking clipboard changes from ${source}:`, error);
        }
        finally {
            this.isCheckingClipboard = false;
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
        // URL 检测 (更精确的正则)
        if (this.isUrl(content)) {
            return 'url';
        }
        // 邮箱检测
        if (this.isEmail(content)) {
            return 'email';
        }
        // 代码检测 (增强版)
        if (this.isCode(content)) {
            return 'code';
        }
        // 文件路径检测
        if (this.isFilePath(content)) {
            return 'file';
        }
        // JSON 检测
        if (this.isJson(content)) {
            return 'code';
        }
        // 默认为文本
        return 'text';
    }
    /**
     * URL 检测 (增强版)
     */
    isUrl(text) {
        const urlPatterns = [
            /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
            /^ftp:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
            /^www\.[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
        ];
        return urlPatterns.some(pattern => pattern.test(text.trim()));
    }
    /**
     * 邮箱检测
     */
    isEmail(text) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(text.trim());
    }
    /**
     * JSON 检测
     */
    isJson(text) {
        try {
            JSON.parse(text.trim());
            return text.trim().startsWith('{') || text.trim().startsWith('[');
        }
        catch {
            return false;
        }
    }
    /**
     * 代码检测 (增强版)
     */
    isCode(text) {
        const codePatterns = [
            // JavaScript/TypeScript
            /function\s+\w+\s*\(/,
            /const\s+\w+\s*=/,
            /let\s+\w+\s*=/,
            /var\s+\w+\s*=/,
            /class\s+\w+/,
            /import\s+.+from/,
            /export\s+(default\s+)?/,
            /=>\s*[{\w]/,
            /console\.log\(/,
            // Python
            /def\s+\w+\(/,
            /class\s+\w+\(/,
            /if\s+__name__\s*==\s*['"']__main__['"']/,
            /import\s+\w+/,
            /from\s+\w+\s+import/,
            /print\(/,
            // Java/C#
            /public\s+(class|static|void)/,
            /private\s+(class|static|void)/,
            /System\.out\.println/,
            /Console\.WriteLine/,
            // C/C++
            /#include\s*</,
            /int\s+main\s*\(/,
            /printf\s*\(/,
            /std::/,
            // HTML/XML
            /<\w+[^>]*>/,
            /<\/\w+>/,
            /<!DOCTYPE/,
            // CSS
            /\.[a-zA-Z-]+\s*{/,
            /#[a-zA-Z-]+\s*{/,
            /[a-zA-Z-]+:\s*[^;]+;/,
            // SQL
            /SELECT\s+.+FROM/i,
            /INSERT\s+INTO/i,
            /UPDATE\s+.+SET/i,
            /DELETE\s+FROM/i,
            /CREATE\s+(TABLE|DATABASE)/i,
            // 通用代码特征
            /{[\s\S]*}/,
            /if\s*\(.+\)/,
            /for\s*\(.+\)/,
            /while\s*\(.+\)/,
            /\$\w+/, // 变量
            /[a-zA-Z_]\w*\s*\(/ // 函数调用
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
     * 检测代码语言 (增强版)
     */
    detectCodeLanguage(code) {
        // JavaScript/TypeScript
        if (/function\s+\w+|const\s+\w+|let\s+\w+|=>\s*|console\.log/.test(code)) {
            if (/interface\s+\w+|type\s+\w+|:\s*\w+\[/.test(code)) {
                return 'typescript';
            }
            return 'javascript';
        }
        // Python
        if (/def\s+\w+|import\s+\w+|print\(|if\s+__name__/.test(code)) {
            return 'python';
        }
        // Java
        if (/public\s+class|System\.out\.println|public\s+static\s+void/.test(code)) {
            return 'java';
        }
        // C#
        if (/Console\.WriteLine|using\s+System|namespace\s+\w+/.test(code)) {
            return 'csharp';
        }
        // C/C++
        if (/#include|int\s+main|printf\(|std::/.test(code)) {
            return code.includes('std::') ? 'cpp' : 'c';
        }
        // HTML
        if (/<html|<div|<span|<!DOCTYPE/.test(code)) {
            return 'html';
        }
        // CSS
        if (/\.[a-zA-Z-]+\s*{|#[a-zA-Z-]+\s*{/.test(code)) {
            return 'css';
        }
        // SQL
        if (/SELECT|INSERT|UPDATE|DELETE|CREATE/i.test(code)) {
            return 'sql';
        }
        // JSON
        if (this.isJson(code)) {
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
        Logger_1.logger.debug('Added item to advanced clipboard history', { type: item.type, size: item.size });
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
    }
    /**
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
            }, 1500); // 1.5秒后重置
            Logger_1.logger.debug('Written to advanced clipboard', { length: text.length });
        }
        catch (error) {
            Logger_1.logger.error('Failed to write to clipboard:', error);
            // 如果写入失败，重置忽略标志
            this.ignoreNextChange = false;
        }
    }
    // ... 其他方法与原版相同
    getHistory() {
        return [...this.clipboardHistory];
    }
    clearHistory() {
        this.clipboardHistory = [];
        Logger_1.logger.info('Advanced clipboard history cleared');
    }
    togglePin(id) {
        const item = this.clipboardHistory.find(h => h.id === id);
        if (item) {
            item.isPinned = !item.isPinned;
            Logger_1.logger.debug('Toggled pin status', { id, isPinned: item.isPinned });
            return item.isPinned;
        }
        return false;
    }
    removeItem(id) {
        const initialLength = this.clipboardHistory.length;
        this.clipboardHistory = this.clipboardHistory.filter(h => h.id !== id);
        const removed = this.clipboardHistory.length < initialLength;
        if (removed) {
            Logger_1.logger.debug('Removed clipboard item', { id });
        }
        return removed;
    }
    setMaxHistorySize(size) {
        this.maxHistorySize = size;
        if (this.clipboardHistory.length > size) {
            this.clipboardHistory = this.clipboardHistory.slice(0, size);
        }
    }
    forceCheck() {
        this.scheduleClipboardCheck('force-check');
    }
    isMonitoringActive() {
        return this.isMonitoring;
    }
    destroy() {
        this.stopMonitoring();
        this.clipboardHistory = [];
        this.removeAllListeners();
        Logger_1.logger.info('Advanced ClipboardManager destroyed');
    }
}
exports.AdvancedClipboardManager = AdvancedClipboardManager;
//# sourceMappingURL=ClipboardManager_advanced.js.map