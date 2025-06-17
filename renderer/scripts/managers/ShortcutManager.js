/**
 * 快捷键管理器 - 负责快捷键的持久化存储和管理
 */
class ShortcutManager {
    constructor(appState) {
        this.appState = appState;
        this.shortcuts = new Map();
        this.init();
    }

    /**
     * 初始化快捷键管理器
     */
    async init() {
        console.log('🔧 初始化快捷键管理器...');
        this.loadShortcuts();
        this.setupMainProcessCommunication();
    }

    /**
     * 从AppState加载快捷键设置
     */
    loadShortcuts() {
        console.log('📂 从AppState加载快捷键设置...');

        if (this.appState.settings.shortcuts) {
            this.shortcuts.clear();
            Object.entries(this.appState.settings.shortcuts).forEach(([action, shortcut]) => {
                this.shortcuts.set(action, shortcut);
            });
            console.log('✅ 快捷键设置加载完成:', this.shortcuts);
        } else {
            console.log('⚠️ 未找到快捷键设置，使用默认值');
            this.setDefaultShortcuts();
        }
    }

    /**
     * 设置默认快捷键
     */
    setDefaultShortcuts() {
        const defaultShortcuts = {
            toggleWindow: 'Ctrl+Shift+Space',
            newClipboard: 'Ctrl+Alt+C',
            newTodo: 'Ctrl+Alt+T',
            newNote: 'Ctrl+Alt+N',
            switchToClipboard: 'Ctrl+1',
            switchToTodo: 'Ctrl+2',
            switchToNotes: 'Ctrl+3',
            switchToCommunity: 'Ctrl+4'
        };

        this.shortcuts.clear();
        Object.entries(defaultShortcuts).forEach(([action, shortcut]) => {
            this.shortcuts.set(action, shortcut);
        });

        // 保存到AppState
        this.appState.settings.shortcuts = defaultShortcuts;
        this.appState.saveData();
    }

    /**
     * 获取快捷键
     */
    getShortcut(action) {
        return this.shortcuts.get(action);
    }

    /**
     * 获取所有快捷键 (别名方法)
     */
    getShortcuts() {
        return this.getAllShortcuts();
    }

    /**
     * 获取所有快捷键
     */
    getAllShortcuts() {
        const result = {};
        this.shortcuts.forEach((shortcut, action) => {
            result[action] = shortcut;
        });
        return result;
    }

    /**
     * 更新快捷键
     */
    async updateShortcut(action, shortcut) {
        console.log(`🔄 更新快捷键: ${action} -> ${shortcut}`);

        try {
            // 验证快捷键格式
            if (!this.validateShortcut(shortcut)) {
                throw new Error('无效的快捷键格式');
            }

            // 检查快捷键冲突
            const conflict = this.checkShortcutConflict(action, shortcut);
            if (conflict) {
                throw new Error(`快捷键冲突: ${conflict}`);
            }

            // 更新本地存储
            this.shortcuts.set(action, shortcut);
            this.appState.settings.shortcuts[action] = shortcut;
            await this.appState.saveData();

            // 通知主进程更新全局快捷键
            if (window.electronAPI && window.electronAPI.updateShortcut) {
                await window.electronAPI.updateShortcut(action, shortcut);
            }

            console.log('✅ 快捷键更新成功');
            return {
                success: true
            };
        } catch (error) {
            console.error('❌ 快捷键更新失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 重置快捷键到默认值
     */
    async resetShortcuts() {
        console.log('🔄 重置快捷键到默认值...');

        this.setDefaultShortcuts();

        // 通知主进程重置全局快捷键
        if (window.electronAPI && window.electronAPI.resetShortcuts) {
            await window.electronAPI.resetShortcuts();
        }

        console.log('✅ 快捷键已重置到默认值');
        return this.getAllShortcuts();
    }

    /**
     * 验证快捷键格式
     */
    validateShortcut(shortcut) {
        console.log('🔍 验证快捷键格式:', shortcut);

        if (!shortcut || typeof shortcut !== 'string') {
            console.log('❌ 快捷键不是有效字符串');
            return false;
        }

        // 空字符串也算有效（表示删除快捷键）
        if (shortcut.trim() === '') {
            console.log('✅ 空快捷键有效（删除快捷键）');
            return true;
        }

        // 基本格式验证 - 分割为parts
        const parts = shortcut.split('+').map(part => part.trim());
        console.log('🔍 快捷键部分:', parts);

        if (parts.length < 1) {
            console.log('❌ 快捷键部分太少');
            return false;
        }

        // 如果只有一个部分，检查是否是功能键
        if (parts.length === 1) {
            const singleKey = parts[0];
            // 功能键 F1-F12 可以单独使用
            if (/^F([1-9]|1[0-2])$/.test(singleKey)) {
                console.log('✅ 功能键快捷键有效');
                return true;
            }
            console.log('❌ 单个非功能键无效');
            return false;
        }

        // 检查修饰键
        const modifiers = ['Ctrl', 'Alt', 'Shift', 'Meta', 'Command', 'CommandOrControl', 'Control'];
        const mainKey = parts[parts.length - 1];
        const modifierKeys = parts.slice(0, -1);

        // 检查是否有至少一个有效的修饰键
        const hasValidModifier = modifierKeys.some(key => modifiers.includes(key));
        if (!hasValidModifier) {
            console.log('❌ 没有有效的修饰键');
            return false;
        }

        // 主键不能为空
        if (!mainKey || mainKey.length === 0) {
            console.log('❌ 主键为空');
            return false;
        }

        console.log('✅ 快捷键格式有效');
        return true;
    }

    /**
     * 检查快捷键冲突
     */
    checkShortcutConflict(currentAction, shortcut) {
        for (const [action, existingShortcut] of this.shortcuts) {
            if (action !== currentAction && existingShortcut === shortcut) {
                return action;
            }
        }
        return null;
    }

    /**
     * 设置与主进程的通信
     */
    setupMainProcessCommunication() {
        if (!window.electronAPI) {
            console.warn('⚠️ electronAPI不可用，无法与主进程通信');
            return;
        }

        // 监听主进程的快捷键事件
        if (window.electronAPI.onShortcutTriggered) {
            window.electronAPI.onShortcutTriggered((action) => {
                console.log('🎯 快捷键触发:', action);
                this.handleShortcutAction(action);
            });
        }

        // 发送当前快捷键设置到主进程
        if (window.electronAPI.syncShortcuts) {
            window.electronAPI.syncShortcuts(this.getAllShortcuts());
        }
    }

    /**
     * 处理快捷键动作
     */
    handleShortcutAction(action) {
        if (!window.app) {
            console.warn('⚠️ App实例不可用');
            return;
        }

        switch (action) {
            case 'toggleWindow':
                // 切换窗口显示/隐藏
                if (window.electronAPI && window.electronAPI.toggleWindow) {
                    window.electronAPI.toggleWindow();
                }
                break;
            case 'newClipboard':
                // 新建剪切板项（触发剪切板监控）
                window.app.switchTab('clipboard');
                break;
            case 'newTodo':
                // 新建待办事项
                window.app.switchTab('todo');
                if (window.app.todoManager && window.app.todoManager.addTodo) {
                    window.app.todoManager.addTodo();
                }
                break;
            case 'newNote':
                // 新建笔记
                window.app.switchTab('notes');
                if (window.app.notesManager && window.app.notesManager.createNote) {
                    window.app.notesManager.createNote();
                }
                break;
            case 'switchToClipboard':
                window.app.switchTab('clipboard');
                break;
            case 'switchToTodo':
                window.app.switchTab('todo');
                break;
            case 'switchToNotes':
                window.app.switchTab('notes');
                break;
            case 'switchToCommunity':
                window.app.switchTab('community');
                break;
            default:
                console.warn('⚠️ 未知的快捷键动作:', action);
        }
    }

    /**
     * 获取快捷键的友好显示名称
     */
    getShortcutDisplayName(action) {
        const displayNames = {
            toggleWindow: '显示/隐藏窗口',
            newClipboard: '新建剪切板项',
            newTodo: '新建待办事项',
            newNote: '新建笔记',
            switchToClipboard: '切换到剪切板',
            switchToTodo: '切换到待办',
            switchToNotes: '切换到笔记',
            switchToCommunity: '切换到社区'
        };
        return displayNames[action] || action;
    }

    /**
     * 获取快捷键建议
     */
    getShortcutSuggestions(action) {
        const suggestions = {
            toggleWindow: [
                'Ctrl+Shift+Space',
                'Ctrl+Alt+Space',
                'Alt+Space',
                'Ctrl+`',
                'Alt+`'
            ],
            newClipboard: [
                'Ctrl+Alt+C',
                'Ctrl+Shift+C',
                'Alt+C',
                'Ctrl+Alt+V'
            ],
            newTodo: [
                'Ctrl+Alt+T',
                'Ctrl+Shift+T',
                'Alt+T',
                'Ctrl+Alt+N'
            ],
            newNote: [
                'Ctrl+Alt+N',
                'Ctrl+Shift+N',
                'Alt+N',
                'Ctrl+Alt+M'
            ],
            switchToClipboard: [
                'Ctrl+1',
                'Alt+1',
                'Ctrl+Shift+1'
            ],
            switchToTodo: [
                'Ctrl+2',
                'Alt+2',
                'Ctrl+Shift+2'
            ],
            switchToNotes: [
                'Ctrl+3',
                'Alt+3',
                'Ctrl+Shift+3'
            ],
            switchToCommunity: [
                'Ctrl+4',
                'Alt+4',
                'Ctrl+Shift+4'
            ]
        };

        return suggestions[action] || [];
    }
}

// 将类暴露到全局
window.ShortcutManager = ShortcutManager;