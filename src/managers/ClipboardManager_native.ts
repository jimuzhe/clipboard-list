import { clipboard, nativeImage, BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import { ClipboardItem, ClipboardItemType } from '../types/clipboard';
import { logger } from '../utils/Logger';

/**
 * 原生剪切板管理器 - 使用Windows原生事件机制
 * 无需轮询，监听系统剪切板变化事件，高效省资源
 */
export class ClipboardManagerNative extends EventEmitter {
    private isMonitoring: boolean = false;
    private lastContent: string = '';
    private clipboardHistory: ClipboardItem[] = [];
    private maxHistorySize: number = 100;
    private ignoreNextChange: boolean = false;

    // Windows原生监听相关
    private clipboardWatcher?: NodeJS.Timeout;
    private lastClipboardTime: number = 0;
    private mainWindow?: BrowserWindow;

    constructor(mainWindow?: BrowserWindow) {
        super();
        this.mainWindow = mainWindow;
        this.initializeClipboard();
        this.setupNativeListening();
    }

    /**
     * 初始化剪切板
     */
    private initializeClipboard(): void {
        try {
            this.lastContent = clipboard.readText() || '';
            this.lastClipboardTime = Date.now();
            logger.info('Native clipboard manager initialized');
        } catch (error) {
            logger.error('Failed to initialize clipboard:', error);
        }
    }

    /**
     * 设置原生监听机制
     */
    private setupNativeListening(): void {
        if (this.mainWindow) {
            // 监听窗口焦点变化来检测剪切板变化
            this.mainWindow.on('focus', () => {
                // 窗口获得焦点时检查剪切板
                this.checkClipboardOnFocus();
            });            // 监听系统快捷键
            this.mainWindow.webContents.on('before-input-event', (event, input) => {
                if (this.isCtrlC(input)) {
                    // Ctrl+C - 复制操作，延迟检查
                    setTimeout(() => {
                        this.checkClipboardChanges();
                    }, 100);
                } else if (this.isCtrlX(input)) {
                    // Ctrl+X - 剪切操作，需要更长的延迟和多次检查
                    this.handleCutOperation();
                } else if (this.isCtrlV(input)) {
                    // Ctrl+V - 粘贴操作，检查是否有新内容
                    setTimeout(() => {
                        this.checkClipboardChanges();
                    }, 50);
                }
            });
        }
    }

    /**
     * 检测Ctrl+C组合键
     */
    private isCtrlC(input: any): boolean {
        return input.control && input.key === 'c' && !input.alt && !input.shift;
    }

    /**
     * 检测Ctrl+X组合键
     */
    private isCtrlX(input: any): boolean {
        return input.control && input.key === 'x' && !input.alt && !input.shift;
    }

    /**
     * 检测Ctrl+V组合键
     */
    private isCtrlV(input: any): boolean {
        return input.control && input.key === 'v' && !input.alt && !input.shift;
    }

    /**
     * 窗口获得焦点时检查剪切板
     */
    private checkClipboardOnFocus(): void {
        if (!this.isMonitoring) return;

        // 延迟检查，避免频繁检测
        setTimeout(() => {
            this.checkClipboardChanges();
        }, 100);
    }

    /**
     * 开始监控剪切板变化
     */
    public startMonitoring(): void {
        if (this.isMonitoring) {
            logger.warn('Clipboard monitoring is already active');
            return;
        }

        this.isMonitoring = true;

        // 使用基于事件的监听，辅以轻量级定时检查
        this.startEventBasedMonitoring();

        logger.info('Native clipboard monitoring started (event-based)');
    }

    /**
     * 启动基于事件的监控
     */
    private startEventBasedMonitoring(): void {
        // 主要依赖事件监听，辅以低频率的定时检查作为备份
        this.clipboardWatcher = setInterval(() => {
            this.checkClipboardChanges();
        }, 2000); // 2秒检查一次作为备份机制
    }

    /**
     * 停止监控剪切板变化
     */
    public stopMonitoring(): void {
        if (!this.isMonitoring) {
            return;
        }

        this.isMonitoring = false;

        // 清除定时器
        if (this.clipboardWatcher) {
            clearInterval(this.clipboardWatcher);
            this.clipboardWatcher = undefined;
        }

        logger.info('Native clipboard monitoring stopped');
    }    /**
     * 检查剪切板变化
     */
    private checkClipboardChanges(): void {
        if (!this.isMonitoring) return;

        try {
            // 首先检查是否有图片
            const image = clipboard.readImage();
            if (!image.isEmpty()) {
                this.handleImageClipboard(image);
                return;
            }

            // 如果没有图片，检查文本内容
            const currentContent = clipboard.readText();
            const currentTime = Date.now();

            // 检查是否有内容且与上次不同
            if (currentContent && currentContent !== this.lastContent) {
                // 如果设置了忽略标志，则跳过这次变化
                if (this.ignoreNextChange) {
                    this.ignoreNextChange = false;
                    this.lastContent = currentContent;
                    this.lastClipboardTime = currentTime;
                    logger.debug('Ignoring clipboard change (programmatic write)');
                    return;
                }

                this.lastContent = currentContent;
                this.lastClipboardTime = currentTime;

                const clipboardItem = this.createClipboardItem(currentContent);

                this.addToHistory(clipboardItem);
                this.emit('clipboard-changed', clipboardItem);

                logger.info('✨ Native clipboard change detected', {
                    type: clipboardItem.type,
                    size: clipboardItem.size,
                    preview: clipboardItem.preview
                });
            }
        } catch (error) {
            logger.error('Error checking clipboard changes:', error);
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
    private isUrl(text: string): boolean {
        const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
        return urlRegex.test(text.trim());
    }

    /**
     * 邮箱检测
     */
    private isEmail(text: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(text.trim());
    }

    /**
     * 代码检测
     */
    private isCode(text: string): boolean {
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
            /<\w+[^>]*>/,
            /\$\w+/,
            /SELECT\s+.+FROM/i,
            /INSERT\s+INTO/i,
            /UPDATE\s+.+SET/i,
            /DELETE\s+FROM/i
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
     * 检测代码语言
     */
    private detectCodeLanguage(code: string): string {
        if (code.includes('function') || code.includes('const ') || code.includes('let ') || code.includes('=>')) {
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
        if (code.includes('<html>') || code.includes('<div>') || code.includes('<script>')) {
            return 'html';
        }
        if (code.includes('{') && code.includes('}') && code.includes(':') && !code.includes('function')) {
            return 'json';
        }
        if (code.includes('SELECT') || code.includes('INSERT') || code.includes('UPDATE')) {
            return 'sql';
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

        logger.info('Added item to native clipboard history', { type: item.type, size: item.size });
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
            this.lastClipboardTime = Date.now();

            // 设置一个安全超时，确保忽略标志不会永久保持
            setTimeout(() => {
                if (this.ignoreNextChange) {
                    this.ignoreNextChange = false;
                    logger.debug('Reset ignore flag after timeout');
                }
            }, 1000); // 1秒后重置

            logger.debug('Written to native clipboard', { length: text.length });
        } catch (error) {
            logger.error('Failed to write to clipboard:', error);
            // 如果写入失败，重置忽略标志
            this.ignoreNextChange = false;
        }
    }

    /**
     * 获取历史记录
     */
    public getHistory(): ClipboardItem[] {
        return [...this.clipboardHistory];
    }    /**
     * 清空历史记录
     */
    public clearHistory(): void {
        // 保留置顶的项目，只清理非置顶项目
        const pinnedItems = this.clipboardHistory.filter(item => item.isPinned);
        this.clipboardHistory = pinnedItems;
        logger.info('Native clipboard history cleared, pinned items preserved', {
            pinnedCount: pinnedItems.length
        });
    }

    /**
     * 切换置顶状态
     */
    public togglePin(id: string): boolean {
        const item = this.clipboardHistory.find(h => h.id === id);
        if (item) {
            item.isPinned = !item.isPinned;
            logger.debug('Toggled pin status', { id, isPinned: item.isPinned });
            return item.isPinned;
        }
        return false;
    }

    /**
     * 移除项目
     */
    public removeItem(id: string): boolean {
        const initialLength = this.clipboardHistory.length;
        this.clipboardHistory = this.clipboardHistory.filter(h => h.id !== id);
        const removed = this.clipboardHistory.length < initialLength;

        if (removed) {
            logger.debug('Removed clipboard item', { id });
        }

        return removed;
    }

    /**
     * 设置最大历史记录大小
     */
    public setMaxHistorySize(size: number): void {
        this.maxHistorySize = size;
        if (this.clipboardHistory.length > size) {
            this.clipboardHistory = this.clipboardHistory.slice(0, size);
        }
    }

    /**
     * 手动触发剪切板检查
     */
    public forceCheck(): void {
        this.checkClipboardChanges();
    }

    /**
     * 获取监控状态
     */
    public isMonitoringActive(): boolean {
        return this.isMonitoring;
    }

    /**
     * 销毁管理器
     */
    public destroy(): void {
        this.stopMonitoring();

        this.clipboardHistory = [];
        this.removeAllListeners();
        logger.info('Native ClipboardManager destroyed');
    }

    /**
     * 处理剪切操作 (Ctrl+X)
     * 剪切操作可能有延迟，需要多次检查
     */
    private handleCutOperation(): void {
        // 第一次检查 - 100ms后
        setTimeout(() => {
            this.checkClipboardChanges();
        }, 100);

        // 第二次检查 - 300ms后
        setTimeout(() => {
            this.checkClipboardChanges();
        }, 300);

        // 第三次检查 - 600ms后（某些应用程序可能需要更长时间）
        setTimeout(() => {
            this.checkClipboardChanges();
        }, 600);

        // 最后一次检查 - 1秒后
        setTimeout(() => {
            this.checkClipboardChanges();
        }, 1000);
    }

    /**
     * 处理图片剪切板内容
     */
    private handleImageClipboard(image: Electron.NativeImage): void {
        try {
            // 将图片转换为base64 data URL
            const buffer = image.toPNG();
            const base64 = buffer.toString('base64');
            const dataUrl = `data:image/png;base64,${base64}`;

            // 检查图片大小（限制在5MB以内）
            const imageSizeKB = Math.round(buffer.length / 1024);
            if (imageSizeKB > 5120) { // 5MB
                logger.warn('Image too large, skipping', { sizeKB: imageSizeKB });
                return;
            }

            // 创建图片的唯一标识符
            const imageHash = this.generateImageHash(buffer);

            // 检查是否已经存在相同的图片
            const existingItem = this.clipboardHistory.find(item =>
                item.type === 'image' && item.content === imageHash
            );

            if (existingItem) {
                logger.debug('Image already exists in history');
                return;
            }

            const clipboardItem: ClipboardItem = {
                id: this.generateId(),
                content: imageHash, // 使用hash作为内容标识
                type: 'image',
                size: buffer.length,
                timestamp: new Date(),
                isPinned: false,
                tags: [],
                preview: `图片 (${imageSizeKB} KB)`,
                imageData: dataUrl,
                imageSize: { width: image.getSize().width, height: image.getSize().height }
            };

            this.addToHistory(clipboardItem);
            this.emit('clipboard-changed', clipboardItem);

            logger.info('✨ Native clipboard image detected', {
                type: 'image',
                size: imageSizeKB + ' KB',
                dimensions: `${image.getSize().width}x${image.getSize().height}`
            });

        } catch (error) {
            logger.error('Error handling image clipboard:', error);
        }
    }

    /**
     * 生成图片的哈希标识符
     */
    private generateImageHash(buffer: Buffer): string {
        // 简单的哈希生成，基于buffer内容
        let hash = 0;
        for (let i = 0; i < buffer.length; i += 100) { // 每100字节取样一次以提升性能
            hash = ((hash << 5) - hash + buffer[i]) & 0xffffffff;
        }
        return `img_${Math.abs(hash).toString(36)}_${buffer.length}`;
    }
}
