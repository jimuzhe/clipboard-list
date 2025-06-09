import { clipboard, nativeImage, BrowserWindow, globalShortcut } from 'electron';
import { EventEmitter } from 'events';
import { ClipboardItem, ClipboardItemType } from '../types/clipboard';
import { logger } from '../utils/Logger';

/**
 * 高级原生剪切板管理器 - 使用多种Windows原生机制
 * 结合全局快捷键、窗口事件、系统事件等，无需高频轮询
 */
export class AdvancedClipboardManager extends EventEmitter {
    private isMonitoring: boolean = false;
    private lastContent: string = '';
    private clipboardHistory: ClipboardItem[] = [];
    private maxHistorySize: number = 100;
    private ignoreNextChange: boolean = false;

    // 多种监听机制
    private globalShortcutRegistered: boolean = false;
    private windowFocusWatcher?: NodeJS.Timeout;
    private systemActivityWatcher?: NodeJS.Timeout;
    private emergencyPoller?: NodeJS.Timeout;
    private mainWindow?: BrowserWindow;

    // 性能优化
    private lastCheckTime: number = 0;
    private minCheckInterval: number = 100; // 最小检查间隔
    private isCheckingClipboard: boolean = false;

    constructor(mainWindow?: BrowserWindow) {
        super();
        this.mainWindow = mainWindow;
        this.initializeClipboard();
        this.setupAdvancedListening();
    }

    /**
     * 初始化剪切板
     */
    private initializeClipboard(): void {
        try {
            this.lastContent = clipboard.readText() || '';
            this.lastCheckTime = Date.now();
            logger.info('Advanced clipboard manager initialized');
        } catch (error) {
            logger.error('Failed to initialize clipboard:', error);
        }
    }

    /**
     * 设置高级监听机制
     */
    private setupAdvancedListening(): void {
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
    private registerGlobalShortcuts(): void {
        try {
            // 监听 Ctrl+C
            const ctrlCRegistered = globalShortcut.register('CommandOrControl+C', () => {
                this.onClipboardAction('copy');
            });

            // 监听 Ctrl+X
            const ctrlXRegistered = globalShortcut.register('CommandOrControl+X', () => {
                this.onClipboardAction('cut');
            });

            // 监听 Ctrl+V (了解用户粘贴行为)
            const ctrlVRegistered = globalShortcut.register('CommandOrControl+V', () => {
                this.onClipboardAction('paste');
            });

            this.globalShortcutRegistered = ctrlCRegistered && ctrlXRegistered && ctrlVRegistered;

            if (this.globalShortcutRegistered) {
                logger.info('✅ Global shortcuts registered successfully');
            } else {
                logger.warn('⚠️ Some global shortcuts failed to register');
            }
        } catch (error) {
            logger.error('❌ Failed to register global shortcuts:', error);
        }
    }

    /**
     * 设置窗口事件监听
     */
    private setupWindowEventListening(): void {
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
    private setupSystemActivityListening(): void {
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
    private isClipboardShortcut(input: any): boolean {
        const isCtrl = input.control && !input.alt && !input.shift;
        return isCtrl && ['c', 'x', 'v'].includes(input.key.toLowerCase());
    }

    /**
     * 剪切板操作回调
     */
    private onClipboardAction(action: 'copy' | 'cut' | 'paste'): void {
        logger.debug(`🎯 Clipboard action detected: ${action}`);

        // 延迟检查，确保剪切板操作完成
        setTimeout(() => {
            this.scheduleClipboardCheck(`global-${action}`);
        }, action === 'paste' ? 0 : 100); // 粘贴不需要延迟，复制/剪切需要小延迟
    }

    /**
     * 调度剪切板检查（防抖）
     */
    private scheduleClipboardCheck(source: string): void {
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
    public startMonitoring(): void {
        if (this.isMonitoring) {
            logger.warn('Advanced clipboard monitoring is already active');
            return;
        }

        this.isMonitoring = true;

        // 启动应急轮询（频率很低，作为备用机制）
        this.emergencyPoller = setInterval(() => {
            this.scheduleClipboardCheck('emergency-poll');
        }, 10000); // 10秒一次的应急检查

        logger.info('🚀 Advanced clipboard monitoring started');
        logger.info('📋 Using: Global shortcuts + Window events + System activity monitoring');
    }

    /**
     * 停止监控剪切板变化
     */
    public stopMonitoring(): void {
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
            globalShortcut.unregisterAll();
            this.globalShortcutRegistered = false;
        }

        logger.info('⏹️ Advanced clipboard monitoring stopped');
    }

    /**
     * 检查剪切板变化
     */
    private checkClipboardChanges(source: string = 'unknown'): void {
        if (!this.isMonitoring || this.isCheckingClipboard) return;

        this.isCheckingClipboard = true;

        try {
            const currentContent = clipboard.readText();

            // 检查是否有内容且与上次不同
            if (currentContent && currentContent !== this.lastContent) {
                // 如果设置了忽略标志，则跳过这次变化
                if (this.ignoreNextChange) {
                    this.ignoreNextChange = false;
                    this.lastContent = currentContent;
                    logger.debug(`🔄 Ignoring clipboard change from ${source} (programmatic write)`);
                    return;
                }

                this.lastContent = currentContent;

                const clipboardItem = this.createClipboardItem(currentContent);

                this.addToHistory(clipboardItem);
                this.emit('clipboard-changed', clipboardItem);

                logger.info(`✨ Clipboard change detected from ${source}`, {
                    type: clipboardItem.type,
                    size: clipboardItem.size,
                    preview: clipboardItem.preview
                });
            }
        } catch (error) {
            logger.error(`❌ Error checking clipboard changes from ${source}:`, error);
        } finally {
            this.isCheckingClipboard = false;
        }
    }

    /**
     * 创建剪切板条目
     */
    private createClipboardItem(content: string): ClipboardItem {
        const contentType = this.detectContentType(content);

        const item: ClipboardItem = {
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
    private detectContentType(content: string): ClipboardItemType {
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
    private isUrl(text: string): boolean {
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
    private isEmail(text: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(text.trim());
    }

    /**
     * JSON 检测
     */
    private isJson(text: string): boolean {
        try {
            JSON.parse(text.trim());
            return text.trim().startsWith('{') || text.trim().startsWith('[');
        } catch {
            return false;
        }
    }

    /**
     * 代码检测 (增强版)
     */
    private isCode(text: string): boolean {
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
            /[a-zA-Z_]\w*\s*\(/  // 函数调用
        ];

        return codePatterns.some(pattern => pattern.test(text));
    }

    /**
     * 文件路径检测
     */
    private isFilePath(text: string): boolean {
        const filePathRegex = /^[a-zA-Z]:\\|^\/|^~\/|^\.\//;
        return filePathRegex.test(text.trim()) && text.length < 500;
    }

    /**
     * 检测代码语言 (增强版)
     */
    private detectCodeLanguage(code: string): string {
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
    private addToHistory(item: ClipboardItem): void {
        // 移除重复内容
        this.clipboardHistory = this.clipboardHistory.filter(h => h.content !== item.content);

        // 添加到开头
        this.clipboardHistory.unshift(item);

        // 限制历史记录大小
        if (this.clipboardHistory.length > this.maxHistorySize) {
            this.clipboardHistory = this.clipboardHistory.slice(0, this.maxHistorySize);
        }

        logger.debug('Added item to advanced clipboard history', { type: item.type, size: item.size });
    }

    /**
     * 生成唯一ID
     */
    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 读取剪切板内容
     */
    public readFromClipboard(): string {
        try {
            return clipboard.readText() || '';
        } catch (error) {
            logger.error('Failed to read from clipboard:', error);
            return '';
        }
    }

    /**
     * 写入剪切板
     */
    public writeToClipboard(text: string): void {
        try {
            // 设置忽略标志，防止触发变化检测
            this.ignoreNextChange = true;
            clipboard.writeText(text);
            this.lastContent = text;

            // 设置一个安全超时，确保忽略标志不会永久保持
            setTimeout(() => {
                if (this.ignoreNextChange) {
                    this.ignoreNextChange = false;
                    logger.debug('Reset ignore flag after timeout');
                }
            }, 1500); // 1.5秒后重置

            logger.debug('Written to advanced clipboard', { length: text.length });
        } catch (error) {
            logger.error('Failed to write to clipboard:', error);
            // 如果写入失败，重置忽略标志
            this.ignoreNextChange = false;
        }
    }

    // ... 其他方法与原版相同
    public getHistory(): ClipboardItem[] {
        return [...this.clipboardHistory];
    } public clearHistory(): void {
        // 保留置顶的项目，只清理非置顶项目
        const pinnedItems = this.clipboardHistory.filter(item => item.isPinned);
        this.clipboardHistory = pinnedItems;
        logger.info('Advanced clipboard history cleared, pinned items preserved', {
            pinnedCount: pinnedItems.length
        });
    }

    public togglePin(id: string): boolean {
        const item = this.clipboardHistory.find(h => h.id === id);
        if (item) {
            item.isPinned = !item.isPinned;
            logger.debug('Toggled pin status', { id, isPinned: item.isPinned });
            return item.isPinned;
        }
        return false;
    }

    public removeItem(id: string): boolean {
        const initialLength = this.clipboardHistory.length;
        this.clipboardHistory = this.clipboardHistory.filter(h => h.id !== id);
        const removed = this.clipboardHistory.length < initialLength;

        if (removed) {
            logger.debug('Removed clipboard item', { id });
        }

        return removed;
    }

    public setMaxHistorySize(size: number): void {
        this.maxHistorySize = size;
        if (this.clipboardHistory.length > size) {
            this.clipboardHistory = this.clipboardHistory.slice(0, size);
        }
    }

    public forceCheck(): void {
        this.scheduleClipboardCheck('force-check');
    }

    public isMonitoringActive(): boolean {
        return this.isMonitoring;
    }

    public destroy(): void {
        this.stopMonitoring();

        this.clipboardHistory = [];
        this.removeAllListeners();
        logger.info('Advanced ClipboardManager destroyed');
    }
}
