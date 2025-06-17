/**
 * 快捷键UI管理器
 * 负责快捷键设置界面的交互和逻辑
 */
class ShortcutUIManager {
    constructor(shortcutManager = null) {
        this.shortcutManager = shortcutManager || window.app ?.shortcutManager;
        this.shortcuts = new Map();
        this.isRecording = false;
        this.currentRecordingInput = null;
        this.suggestions = [];
        this.originalShortcuts = new Map();
        this.isRegistering = false; // 防止重复注册的标志

        // 确保DOM已准备就绪后再初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.init();
            });
        } else {
            this.init();
        }
    }

    /**
     * 初始化方法
     */
    init() {
        console.log('ShortcutUIManager initializing...');
        this.initializeElements();
        this.setupEventListeners();
        this.loadShortcuts();
    }
    /**
     * 初始化DOM元素引用
     */
    initializeElements() {
        console.log('🔍 Initializing DOM elements...');

        this.elements = {
            toggleWindowInput: document.getElementById('toggle-window-shortcut'),
            recordBtn: document.getElementById('record-shortcut-btn'),
            resetBtn: document.getElementById('reset-shortcut-btn'),
            suggestionsContainer: document.getElementById('shortcut-suggestions'),
            suggestionsList: document.getElementById('suggestions-list')
        };

        console.log('🔍 Found elements:', {
            toggleWindowInput: !!this.elements.toggleWindowInput,
            recordBtn: !!this.elements.recordBtn,
            resetBtn: !!this.elements.resetBtn,
            suggestionsContainer: !!this.elements.suggestionsContainer,
            suggestionsList: !!this.elements.suggestionsList
        });
        // 检查每个元素
        Object.entries(this.elements).forEach(([key, element]) => {
            if (element) {
                console.log(`✅ ${key} found:`, element);
            } else {
                console.error(`❌ ${key} not found`);
            }
        });

        // 添加测试点击事件
        if (this.elements.toggleWindowInput) {
            console.log('🧪 添加测试点击事件到快捷键输入框');
            setTimeout(() => {
                console.log('🧪 执行测试点击');
                const testEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true
                });
                this.elements.toggleWindowInput.dispatchEvent(testEvent);
            }, 2000);
        }
    }
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        console.log('Setting up ShortcutUIManager event listeners...');
        console.log('Elements found:', this.elements); // 快捷键输入框点击事件
        if (this.elements.toggleWindowInput) {
            console.log('✅ Adding click listener to toggle window input');
            this.elements.toggleWindowInput.addEventListener('click', (e) => {
                console.log('🖱️ Toggle window input clicked', e);
                this.startRecording(this.elements.toggleWindowInput, 'toggleWindow');
            });

            // 也添加焦点事件
            this.elements.toggleWindowInput.addEventListener('focus', (e) => {
                console.log('🎯 Toggle window input focused', e);
                this.startRecording(this.elements.toggleWindowInput, 'toggleWindow');
            });
        } else {
            console.error('❌ Toggle window input element not found');
        }

        // 录制按钮点击事件
        if (this.elements.recordBtn) {
            console.log('Adding click listener to record button');
            this.elements.recordBtn.addEventListener('click', () => {
                console.log('Record button clicked');
                this.toggleRecording();
            });
        } else {
            console.error('Record button element not found');
        }

        // 重置按钮点击事件
        if (this.elements.resetBtn) {
            console.log('Adding click listener to reset button');
            this.elements.resetBtn.addEventListener('click', () => {
                console.log('Reset button clicked');
                this.resetToDefault();
            });
        } else {
            console.error('Reset button element not found');
        }

        // 全局键盘事件监听
        document.addEventListener('keydown', (e) => {
            if (this.isRecording) {
                this.handleKeyDown(e);
            }
        });

        // 失去焦点时停止录制
        document.addEventListener('click', (e) => {
            if (this.isRecording && !this.isShortcutRelatedElement(e.target)) {
                this.stopRecording();
            }
        });

        // 监听来自主进程的快捷键事件
        this.setupMainProcessListeners();
    }
    /**
     * 设置主进程事件监听
     */
    setupMainProcessListeners() {
        console.log('Setting up main process listeners...');

        if (!window.electronAPI) {
            console.error('electronAPI is not available');
            return;
        }

        // 检查所有需要的API方法是否存在
        const requiredMethods = [
            'onShortcutsResponse',
            'onShortcutUpdated',
            'onShortcutSuggestionsResponse',
            'onShortcutValidationResponse',
            'onShortcutFormattedResponse',
            'getAllShortcuts',
            'getShortcutSuggestions',
            'updateShortcut',
            'validateShortcut'
        ];

        const missingMethods = requiredMethods.filter(method => !window.electronAPI[method]);
        if (missingMethods.length > 0) {
            console.error('Missing electronAPI methods:', missingMethods);
            return;
        }

        // 监听快捷键响应
        window.electronAPI.onShortcutsResponse((shortcuts) => {
            console.log('Received shortcuts response:', shortcuts);
            this.shortcuts.clear();
            Object.entries(shortcuts).forEach(([action, shortcut]) => {
                this.shortcuts.set(action, shortcut);
            });
            this.updateUI();
        });

        // 监听快捷键更新响应
        window.electronAPI.onShortcutUpdated((data) => {
            console.log('Received shortcut updated:', data);
            const {
                action,
                shortcut,
                success
            } = data;
            if (success) {
                this.shortcuts.set(action, shortcut);
                this.showUpdateSuccess(action, shortcut);
            } else {
                this.showUpdateError(action, shortcut);
            }
            this.updateUI();
        });

        // 监听快捷键建议响应
        window.electronAPI.onShortcutSuggestionsResponse((suggestions) => {
            console.log('Received shortcut suggestions:', suggestions);
            this.suggestions = suggestions;
            this.updateSuggestions();
        });

        // 监听快捷键验证响应
        window.electronAPI.onShortcutValidationResponse((data) => {
            console.log('Received validation response:', data);
            const {
                shortcut,
                isValid
            } = data;
            this.handleValidationResult(shortcut, isValid);
        });

        // 监听快捷键格式化响应
        window.electronAPI.onShortcutFormattedResponse((data) => {
            const {
                shortcut,
                formatted
            } = data;
            this.updateFormattedDisplay(shortcut, formatted);
        });
    }

    /**
     * 从主进程加载快捷键配置
     */
    async loadShortcuts() {
        try {
            console.log('🔄 开始加载快捷键设置...');
            console.log('shortcutManager 实例:', this.shortcutManager);

            // 如果有快捷键管理器，使用它来加载快捷键
            if (this.shortcutManager) {
                console.log('📥 使用 ShortcutManager 加载快捷键');
                const shortcuts = this.shortcutManager.getShortcuts();
                console.log('🔑 获取到的快捷键:', shortcuts);

                this.shortcuts.clear();
                Object.entries(shortcuts).forEach(([action, shortcut]) => {
                    this.shortcuts.set(action, shortcut);
                    console.log(`🔑 设置快捷键: ${action} = ${shortcut}`);
                });
                console.log('📊 快捷键Map状态:', this.shortcuts);
                this.updateUI();

                // 只在初始加载时注册全局快捷键
                this.registerGlobalShortcuts();

                console.log('✅ 从本地存储加载快捷键设置完成');
                return;
            }

            console.log('⚠️ 没有 shortcutManager，使用原来的电子API方法');
            // 兜底：使用原来的电子API方法
            await window.electronAPI.getAllShortcuts();
            await window.electronAPI.getShortcutSuggestions();
        } catch (error) {
            console.error('❌ 加载快捷键失败:', error);
        }
    }

    /**
     * 开始录制快捷键
     */
    startRecording(inputElement, action) {
        console.log('🎯 startRecording called with:', {
            inputElement,
            action
        });
        console.log('🎯 Current isRecording state:', this.isRecording);

        if (this.isRecording) {
            console.log('🛑 Already recording, stopping current recording');
            this.stopRecording();
        }

        this.isRecording = true;
        this.currentRecordingInput = inputElement;
        this.currentAction = action;

        // 更新UI状态
        inputElement.classList.add('recording');
        inputElement.value = '按下键盘组合键...';
        inputElement.readOnly = true;

        if (this.elements.recordBtn) {
            this.elements.recordBtn.textContent = '停止';
            this.elements.recordBtn.classList.add('recording');
        }

        console.log(`✅ 开始录制快捷键: ${action}`);
    }

    /**
     * 停止录制快捷键
     */
    stopRecording() {
        if (!this.isRecording) return;

        this.isRecording = false;

        if (this.currentRecordingInput) {
            this.currentRecordingInput.classList.remove('recording');
            this.currentRecordingInput.readOnly = false;

            // 恢复原始值
            const currentShortcut = this.shortcuts.get(this.currentAction);
            if (currentShortcut) {
                this.currentRecordingInput.value = this.formatShortcutDisplay(currentShortcut);
            }
        }

        if (this.elements.recordBtn) {
            this.elements.recordBtn.textContent = '录制';
            this.elements.recordBtn.classList.remove('recording');
        }

        this.currentRecordingInput = null;
        this.currentAction = null;

        console.log('停止录制快捷键');
    }

    /**
     * 切换录制状态
     */
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            // 如果有输入框，开始录制
            if (this.elements.toggleWindowInput) {
                this.startRecording(this.elements.toggleWindowInput, 'toggleWindow');
            }
        }
    }

    /**
     * 处理键盘按下事件
     */
    handleKeyDown(e) {
        if (!this.isRecording || !this.currentRecordingInput) return;

        e.preventDefault();
        e.stopPropagation();

        // 忽略单独的修饰键
        if (['Control', 'Alt', 'Shift', 'Meta', 'Command'].includes(e.key)) {
            return;
        }

        // 构建快捷键字符串
        const parts = [];

        if (e.ctrlKey || e.metaKey) {
            parts.push('CommandOrControl');
        }
        if (e.altKey) {
            parts.push('Alt');
        }
        if (e.shiftKey) {
            parts.push('Shift');
        }

        // 添加主键
        let mainKey = e.key;

        // 处理特殊键
        const keyMapping = {
            ' ': 'Space',
            'Escape': 'Escape',
            'Enter': 'Return',
            'Backspace': 'Backspace',
            'Delete': 'Delete',
            'Tab': 'Tab',
            'ArrowUp': 'Up',
            'ArrowDown': 'Down',
            'ArrowLeft': 'Left',
            'ArrowRight': 'Right'
        };

        if (keyMapping[mainKey]) {
            mainKey = keyMapping[mainKey];
        } else if (e.code.startsWith('F') && e.code.length <= 4) {
            // F1-F12 键
            mainKey = e.code;
        } else if (mainKey.length === 1) {
            // 单个字符，转换为大写
            mainKey = mainKey.toUpperCase();
        }

        parts.push(mainKey);

        // 至少需要一个修饰符（除了功能键）
        if (parts.length < 2 && !mainKey.startsWith('F')) {
            this.currentRecordingInput.value = '请使用修饰键组合 (Ctrl/Alt/Shift + 键)';
            return;
        }

        const shortcut = parts.join('+');

        // 显示新的快捷键
        this.currentRecordingInput.value = this.formatShortcutDisplay(shortcut);

        // 验证快捷键
        this.validateAndApplyShortcut(shortcut);
    }
    /**
     * 验证并应用快捷键
     */
    async validateAndApplyShortcut(shortcut) {
        try {
            console.log('🔍 开始验证快捷键:', shortcut);

            if (!this.shortcutManager) {
                console.error('❌ ShortcutManager 未初始化');
                this.showError('快捷键管理器未就绪');
                return;
            }

            // 使用本地验证而不是调用electronAPI
            const isValid = this.shortcutManager.validateShortcut(shortcut);
            console.log('🔍 快捷键验证结果:', isValid);

            if (isValid) {
                this.handleValidationResult(shortcut, true);
            } else {
                this.showError('无效的快捷键格式');
                this.handleValidationResult(shortcut, false);
            }
        } catch (error) {
            console.error('❌ 快捷键验证失败:', error);
            this.showError('快捷键验证失败: ' + error.message);
        }
    }

    /**
     * 处理验证结果
     */
    handleValidationResult(shortcut, isValid) {
        if (!this.currentRecordingInput) return;

        if (isValid) {
            this.currentRecordingInput.classList.remove('invalid');
            this.currentRecordingInput.classList.add('valid');

            // 延迟应用快捷键
            setTimeout(() => {
                this.applyShortcut(this.currentAction, shortcut);
                this.stopRecording();
            }, 500);
        } else {
            this.currentRecordingInput.classList.remove('valid');
            this.currentRecordingInput.classList.add('invalid');
            this.showError('该快捷键已被占用，请选择其他组合');

            // 3秒后恢复
            setTimeout(() => {
                if (this.currentRecordingInput) {
                    this.currentRecordingInput.classList.remove('invalid');
                }
            }, 3000);
        }
    }
    /**
     * 应用新的快捷键
     */
    async applyShortcut(action, shortcut) {
        try {
            console.log(`🔄 应用快捷键: ${action} -> ${shortcut}`);

            // 如果有快捷键管理器，使用它来保存快捷键
            if (this.shortcutManager) {
                const result = await this.shortcutManager.updateShortcut(action, shortcut);
                if (result.success) {
                    this.shortcuts.set(action, shortcut);
                    this.updateUI();
                    this.showMessage(`快捷键更新成功: ${this.formatShortcutDisplay(shortcut)}`, 'success');
                    console.log(`✅ 快捷键已保存到本地: ${action} = ${shortcut}`);

                    // 延迟注册全局快捷键，避免循环
                    setTimeout(() => {
                        if (action === 'toggleWindow') {
                            this.registerGlobalShortcuts();
                        }
                    }, 500);
                } else {
                    this.showError(`快捷键更新失败: ${result.error}`);
                    console.error(`❌ 快捷键更新失败: ${result.error}`);
                }
                return;
            }

            // 兜底：使用原来的电子API方法
            await window.electronAPI.updateShortcut(action, shortcut);
        } catch (error) {
            console.error('❌ 快捷键更新异常:', error);
            this.showError('快捷键更新失败: ' + error.message);
        }
    }

    /**
     * 重置为默认值
     */
    async resetToDefault() {
        try {
            console.log('🔄 重置快捷键为默认值');

            if (this.shortcutManager) {
                await this.shortcutManager.resetToDefaults();
                // 重新加载快捷键
                const shortcuts = this.shortcutManager.getShortcuts();
                this.shortcuts.clear();
                Object.entries(shortcuts).forEach(([action, shortcut]) => {
                    this.shortcuts.set(action, shortcut);
                });
                this.updateUI();
                this.showMessage('快捷键已重置为默认值', 'success');
                console.log('✅ 快捷键已重置为默认值');
                return;
            }

            // 兜底：使用原来的电子API方法
            const defaultShortcut = 'CommandOrControl+Shift+V';
            await window.electronAPI.updateShortcut('toggleWindow', defaultShortcut);
        } catch (error) {
            console.error('Failed to reset shortcut:', error);
            this.showError('重置快捷键失败');
        }
    }

    /**
     * 更新UI显示
     */
    updateUI() {
        console.log('🎨 更新UI，当前快捷键Map:', this.shortcuts);
        console.log('🎨 UI元素:', this.elements);

        // 更新切换窗口快捷键显示
        const toggleShortcut = this.shortcuts.get('toggleWindow');
        console.log('🔑 toggleWindow快捷键:', toggleShortcut);

        if (toggleShortcut && this.elements.toggleWindowInput) {
            const formattedShortcut = this.formatShortcutDisplay(toggleShortcut);
            console.log('🎨 格式化后的快捷键:', formattedShortcut);

            // 强制更新输入框值
            this.elements.toggleWindowInput.value = formattedShortcut;

            // 确保值确实被设置了
            setTimeout(() => {
                if (this.elements.toggleWindowInput.value !== formattedShortcut) {
                    console.log('⚠️ 输入框值被重置，重新设置');
                    this.elements.toggleWindowInput.value = formattedShortcut;
                }
                console.log('✅ 最终输入框值:', this.elements.toggleWindowInput.value);
            }, 100);

            console.log('✅ 已更新输入框值');
        } else {
            console.log('⚠️ 没有找到toggleWindow快捷键或输入框元素');
            console.log('- toggleShortcut:', toggleShortcut);
            console.log('- toggleWindowInput元素:', this.elements.toggleWindowInput);
        }

        console.log('✅ UI更新完成');
    }

    /**
     * 更新建议列表
     */
    updateSuggestions() {
        if (!this.elements.suggestionsList) return;

        this.elements.suggestionsList.innerHTML = '';

        this.suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = this.formatShortcutDisplay(suggestion);
            item.title = `点击使用 ${suggestion}`;

            item.addEventListener('click', () => {
                this.applySuggestion(suggestion);
            });

            this.elements.suggestionsList.appendChild(item);
        });
    }

    /**
     * 应用建议的快捷键
     */
    applySuggestion(shortcut) {
        if (this.elements.toggleWindowInput) {
            this.elements.toggleWindowInput.value = this.formatShortcutDisplay(shortcut);
            this.validateAndApplyShortcut(shortcut);
        }
    }

    /**
     * 格式化快捷键显示
     */
    formatShortcutDisplay(shortcut) {
        if (!shortcut) return '';

        return shortcut
            .replace('CommandOrControl', this.getPlatformCtrlKey())
            .replace('Command', 'Cmd')
            .replace('Control', 'Ctrl')
            .replace('Alt', 'Alt')
            .replace('Shift', 'Shift')
            .replace(/\+/g, ' + ');
    }

    /**
     * 获取平台对应的Ctrl键名称
     */
    getPlatformCtrlKey() {
        return navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl';
    }

    /**
     * 检查元素是否与快捷键相关
     */
    isShortcutRelatedElement(element) {
        return element.closest('.shortcut-input-group') ||
            element.closest('.shortcut-suggestions');
    }

    /**
     * 显示更新成功消息
     */
    showUpdateSuccess(action, shortcut) {
        this.showMessage(`快捷键更新成功: ${this.formatShortcutDisplay(shortcut)}`, 'success');
    }

    /**
     * 显示更新错误消息
     */
    showUpdateError(action, shortcut) {
        this.showError(`快捷键更新失败: ${this.formatShortcutDisplay(shortcut)}`);
    }

    /**
     * 显示错误消息
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * 显示消息
     */
    showMessage(message, type = 'info') {
        // 创建消息提示
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // 添加到页面
        document.body.appendChild(toast);

        // 动画显示
        setTimeout(() => toast.classList.add('show'), 100);

        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 更新格式化显示
     */
    updateFormattedDisplay(shortcut, formatted) {
        // 这里可以用于更新特定的格式化显示
        console.log(`Formatted shortcut: ${shortcut} -> ${formatted}`);
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.stopRecording();
        // 移除事件监听器
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('click', this.stopRecording);
    }
    /**
     * 向主进程注册全局快捷键
     */
    registerGlobalShortcuts() {
        // 防止重复注册
        if (this.isRegistering) {
            console.log('⚠️ 正在注册中，跳过重复注册');
            return;
        }

        this.isRegistering = true;
        console.log('🌐 开始注册全局快捷键...');

        try {
            // 注册切换窗口快捷键
            const toggleShortcut = this.shortcuts.get('toggleWindow');
            if (toggleShortcut && window.electronAPI && window.electronAPI.updateShortcut) {
                console.log('🌐 注册切换窗口快捷键:', toggleShortcut);
                window.electronAPI.updateShortcut('toggleWindow', toggleShortcut);
            } else {
                console.log('⚠️ 无法注册全局快捷键，缺少toggleShortcut或electronAPI');
            }
        } catch (error) {
            console.error('❌ 注册全局快捷键失败:', error);
        } finally {
            // 延迟重置标志，防止短时间内重复调用
            setTimeout(() => {
                this.isRegistering = false;
            }, 1000);
        }
    }
}

// 导出给其他模块使用
window.ShortcutUIManager = ShortcutUIManager;