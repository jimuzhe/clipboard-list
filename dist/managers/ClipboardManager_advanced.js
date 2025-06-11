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
        this.lastImageHash = ''; // 添加图片内容跟踪
        this.clipboardHistory = [];
        this.maxHistorySize = 100;
        this.ignoreNextChange = false;
        // 多种监听机制
        this.globalShortcutRegistered = false;
        this.lastCheckTime = 0;
        this.minCheckInterval = 50; // 最小检查间隔，减少到50ms提高响应性
        this.isCheckingClipboard = false;
        this.mainWindow = mainWindow;
        this.initializeClipboard();
        this.setupAdvancedListening();
    } /**
     * 初始化剪切板
     */
    initializeClipboard() {
        try {
            this.lastContent = electron_1.clipboard.readText() || '';
            // 初始化时也检查图片
            const image = electron_1.clipboard.readImage();
            if (!image.isEmpty()) {
                const buffer = image.toPNG();
                this.lastImageHash = this.generateImageHash(buffer);
            }
            this.lastCheckTime = Date.now();
            Logger_1.logger.info('Advanced clipboard manager initialized');
        }
        catch (error) {
            Logger_1.logger.error('Failed to initialize clipboard:', error);
        }
    } /**
     * 设置高级监听机制
     */
    setupAdvancedListening() {
        // 1. 延迟注册全局快捷键监听（等待app ready）
        this.delayedRegisterGlobalShortcuts();
        // 2. 设置窗口事件监听
        this.setupWindowEventListening();
        // 3. 设置系统活动监听
        this.setupSystemActivityListening();
    }
    /**
     * 延迟注册全局快捷键
     */
    delayedRegisterGlobalShortcuts() {
        // 检查app是否已经ready
        const { app } = require('electron');
        if (app.isReady()) {
            this.registerGlobalShortcuts();
        }
        else {
            // 等待app ready事件
            app.whenReady().then(() => {
                this.registerGlobalShortcuts();
            }).catch((error) => {
                Logger_1.logger.error('❌ Failed to wait for app ready:', error);
            });
        }
    } /**
     * 注册全局快捷键
     * 注意：不再注册Ctrl+C/X/V这些系统级快捷键，避免冲突
     */
    registerGlobalShortcuts() {
        try {
            // 不再注册系统级的剪切板快捷键（Ctrl+C, Ctrl+X, Ctrl+V）
            // 这些快捷键会干扰系统正常的剪切板操作
            // 只使用其他监听机制来检测剪切板变化
            this.globalShortcutRegistered = true;
            Logger_1.logger.info('✅ Clipboard monitoring initialized (no global shortcuts override)');
            Logger_1.logger.info('💡 Using window events and system monitoring instead');
        }
        catch (error) {
            Logger_1.logger.error('❌ Failed to setup clipboard monitoring:', error);
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
    } /**
     * 设置系统活动监听
     */
    setupSystemActivityListening() {
        // 窗口焦点变化监听器
        this.windowFocusWatcher = setInterval(() => {
            // 不管窗口是否有焦点都检查剪切板变化
            this.scheduleClipboardCheck('focus-watcher');
        }, 1000); // 1秒检查一次，更频繁地捕获剪切板变化
        // 系统活动监听器
        this.systemActivityWatcher = setInterval(() => {
            // 基于系统活动的智能检查
            this.scheduleClipboardCheck('activity-watcher');
        }, 2000); // 2秒检查一次
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
        // 启动应急轮询（更频繁的备用机制）
        this.emergencyPoller = setInterval(() => {
            this.scheduleClipboardCheck('emergency-poll');
        }, 3000); // 3秒一次的应急检查，确保不会错过剪切板变化
        Logger_1.logger.info('🚀 Advanced clipboard monitoring started');
        Logger_1.logger.info('📋 Using: Window events + System activity monitoring + Emergency polling');
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
        } // 不再需要注销全局快捷键，因为我们没有注册系统级快捷键
        // 避免调用 globalShortcut.unregisterAll() 来防止意外注销其他快捷键
        if (this.globalShortcutRegistered) {
            this.globalShortcutRegistered = false;
        }
        Logger_1.logger.info('⏹️ Advanced clipboard monitoring stopped');
    } /**
     * 检查剪切板变化
     */
    checkClipboardChanges(source = 'unknown') {
        if (!this.isMonitoring || this.isCheckingClipboard)
            return;
        this.isCheckingClipboard = true;
        try {
            // 首先检查是否有图片
            const image = electron_1.clipboard.readImage();
            if (!image.isEmpty()) {
                this.handleImageClipboard(image, source);
                return;
            }
            // 如果没有图片，检查文本内容
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
        // 保留置顶的项目，只清理非置顶项目
        const pinnedItems = this.clipboardHistory.filter(item => item.isPinned);
        this.clipboardHistory = pinnedItems;
        Logger_1.logger.info('Advanced clipboard history cleared, pinned items preserved', {
            pinnedCount: pinnedItems.length
        });
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
    /**
     * 处理图片剪切板内容
     */
    handleImageClipboard(image, source = 'unknown') {
        try {
            // 将图片转换为base64 data URL
            const buffer = image.toPNG();
            const base64 = buffer.toString('base64');
            const dataUrl = `data:image/png;base64,${base64}`;
            // 检查图片大小（限制在5MB以内）
            const imageSizeKB = Math.round(buffer.length / 1024);
            if (imageSizeKB > 5120) { // 5MB
                Logger_1.logger.warn('Image too large, skipping', { sizeKB: imageSizeKB });
                return;
            }
            // 创建图片的唯一标识符
            const imageHash = this.generateImageHash(buffer);
            // 检查是否已经存在相同的图片
            const existingItem = this.clipboardHistory.find(item => item.type === 'image' && item.content === imageHash);
            if (existingItem) {
                Logger_1.logger.debug('Image already exists in history');
                return;
            }
            const clipboardItem = {
                id: this.generateId(),
                content: imageHash, // 使用hash作为内容标识
                type: 'image',
                size: buffer.length,
                timestamp: new Date(),
                isPinned: false,
                tags: [],
                preview: `图片 (${imageSizeKB} KB)`,
                // 将实际的图片数据存储在扩展属性中
                imageData: dataUrl,
                imageSize: { width: image.getSize().width, height: image.getSize().height }
            };
            this.addToHistory(clipboardItem);
            this.emit('clipboard-changed', clipboardItem);
            Logger_1.logger.info(`✨ Advanced clipboard image detected from ${source}`, {
                type: 'image',
                size: imageSizeKB + ' KB',
                dimensions: `${image.getSize().width}x${image.getSize().height}`
            });
        }
        catch (error) {
            Logger_1.logger.error('Error handling image clipboard:', error);
        }
    }
    /**
     * 生成图片的哈希标识符
     */
    generateImageHash(buffer) {
        // 简单的哈希生成，基于buffer内容
        let hash = 0;
        for (let i = 0; i < buffer.length; i += 100) { // 每100字节取样一次以提升性能
            hash = ((hash << 5) - hash + buffer[i]) & 0xffffffff;
        }
        return `img_${Math.abs(hash).toString(36)}_${buffer.length}`;
    }
}
exports.AdvancedClipboardManager = AdvancedClipboardManager;
//# sourceMappingURL=ClipboardManager_advanced.js.map