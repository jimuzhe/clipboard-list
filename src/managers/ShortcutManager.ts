import { globalShortcut } from 'electron';
import { EventEmitter } from 'events';
import { logger } from '../utils/Logger';

/**
 * 快捷键管理器
 * 负责全局快捷键的注册、注销和管理
 */
export class ShortcutManager extends EventEmitter {
    private registeredShortcuts: Map<string, string> = new Map(); // key: action, value: shortcut
    private shortcutCallbacks: Map<string, () => void> = new Map(); // key: action, value: callback

    constructor() {
        super();
        logger.info('ShortcutManager initialized');
    }

    /**
     * 注册快捷键
     * @param action 动作名称
     * @param shortcut 快捷键组合 (如: 'CommandOrControl+Shift+V')
     * @param callback 回调函数
     */
    register(action: string, shortcut: string, callback: () => void): boolean {
        try {
            // 如果已经注册了相同动作的快捷键，先注销
            if (this.registeredShortcuts.has(action)) {
                this.unregister(action);
            }

            // 验证快捷键格式
            if (!this.isValidShortcut(shortcut)) {
                logger.error(`Invalid shortcut format: ${shortcut}`);
                return false;
            }

            // 检查快捷键是否已被占用
            if (globalShortcut.isRegistered(shortcut)) {
                logger.warn(`Shortcut ${shortcut} is already registered`);
                return false;
            }

            // 注册全局快捷键
            const success = globalShortcut.register(shortcut, callback);

            if (success) {
                this.registeredShortcuts.set(action, shortcut);
                this.shortcutCallbacks.set(action, callback);
                logger.info(`Shortcut registered: ${action} -> ${shortcut}`);
                this.emit('shortcut-registered', { action, shortcut });
                return true;
            } else {
                logger.error(`Failed to register shortcut: ${shortcut}`);
                return false;
            }
        } catch (error) {
            logger.error(`Error registering shortcut ${shortcut}:`, error);
            return false;
        }
    }

    /**
     * 注销快捷键
     * @param action 动作名称
     */
    unregister(action: string): boolean {
        try {
            const shortcut = this.registeredShortcuts.get(action);
            if (!shortcut) {
                logger.warn(`No shortcut registered for action: ${action}`);
                return false;
            }

            globalShortcut.unregister(shortcut);
            this.registeredShortcuts.delete(action);
            this.shortcutCallbacks.delete(action);

            logger.info(`Shortcut unregistered: ${action} -> ${shortcut}`);
            this.emit('shortcut-unregistered', { action, shortcut });
            return true;
        } catch (error) {
            logger.error(`Error unregistering shortcut for action ${action}:`, error);
            return false;
        }
    }

    /**
     * 更新快捷键
     * @param action 动作名称
     * @param newShortcut 新的快捷键组合
     */
    updateShortcut(action: string, newShortcut: string): boolean {
        const callback = this.shortcutCallbacks.get(action);
        if (!callback) {
            logger.error(`No callback found for action: ${action}`);
            return false;
        }

        // 先注销旧的快捷键
        this.unregister(action);

        // 注册新的快捷键
        return this.register(action, newShortcut, callback);
    }

    /**
     * 获取指定动作的快捷键
     * @param action 动作名称
     * @returns 快捷键字符串或undefined
     */
    getShortcut(action: string): string | undefined {
        return this.registeredShortcuts.get(action);
    }

    /**
     * 获取所有已注册的快捷键
     * @returns 快捷键映射表
     */
    getAllShortcuts(): Map<string, string> {
        return new Map(this.registeredShortcuts);
    }

    /**
     * 检查快捷键是否已被注册
     * @param shortcut 快捷键组合
     * @returns 是否已注册
     */
    isRegistered(shortcut: string): boolean {
        return globalShortcut.isRegistered(shortcut);
    }

    /**
     * 验证快捷键格式是否有效
     * @param shortcut 快捷键组合
     * @returns 是否有效
     */
    private isValidShortcut(shortcut: string): boolean {
        // 基本格式验证
        if (!shortcut || typeof shortcut !== 'string') {
            return false;
        }

        // 检查是否包含有效的修饰符
        const validModifiers = [
            'CommandOrControl', 'Command', 'Control', 'Ctrl',
            'Alt', 'Option', 'AltGr', 'Shift', 'Super', 'Meta'
        ];

        const parts = shortcut.split('+');
        if (parts.length < 2) {
            return false; // 至少需要一个修饰符和一个键
        }

        // 检查修饰符
        const modifiers = parts.slice(0, -1);
        const hasValidModifier = modifiers.some(mod =>
            validModifiers.includes(mod)
        );

        if (!hasValidModifier) {
            return false;
        }

        // 检查主键（最后一个部分）
        const mainKey = parts[parts.length - 1];
        if (!mainKey || mainKey.length === 0) {
            return false;
        }

        return true;
    }

    /**
     * 获取常用的快捷键组合建议
     * @returns 快捷键建议列表
     */
    getShortcutSuggestions(): string[] {
        return [
            'CommandOrControl+Shift+V',
            'CommandOrControl+Alt+V',
            'CommandOrControl+Shift+C',
            'CommandOrControl+Alt+C',
            'CommandOrControl+Shift+X',
            'CommandOrControl+Alt+X',
            'CommandOrControl+Shift+Z',
            'CommandOrControl+Alt+Z',
            'F1',
            'F2',
            'F3',
            'F4',
            'F5',
            'F6',
            'F7',
            'F8',
            'F9',
            'F10',
            'F11',
            'F12'
        ];
    }

    /**
     * 格式化快捷键显示文本
     * @param shortcut 快捷键组合
     * @returns 格式化后的显示文本
     */
    formatShortcutDisplay(shortcut: string): string {
        if (!shortcut) return '';

        return shortcut
            .replace('CommandOrControl', process.platform === 'darwin' ? 'Cmd' : 'Ctrl')
            .replace('Command', 'Cmd')
            .replace('Control', 'Ctrl')
            .replace('Alt', 'Alt')
            .replace('Shift', 'Shift')
            .replace('+', ' + ');
    }

    /**
     * 注销所有快捷键
     */
    unregisterAll(): void {
        try {
            const actions = Array.from(this.registeredShortcuts.keys());
            actions.forEach(action => this.unregister(action));

            logger.info('All shortcuts unregistered');
            this.emit('all-shortcuts-unregistered');
        } catch (error) {
            logger.error('Error unregistering all shortcuts:', error);
        }
    }

    /**
     * 清理资源
     */
    destroy(): void {
        this.unregisterAll();
        this.removeAllListeners();
        logger.info('ShortcutManager destroyed');
    }
}
