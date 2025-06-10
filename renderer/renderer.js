// 应用状态管理
class AppState {
    constructor() {
        this.clipboardItems = [];
        this.todoItems = [];
        this.notes = [];
        this.currentNote = null;
        this.settings = {
            theme: 'light',
            glassEffect: true,
            autoStart: true,
            clipboardMonitor: true,
            maxClipboardItems: 100,
            communityUrl: 'http://8.130.41.186:3000/',
            online: {
                currentUrl: 'http://8.130.41.186:3000/',
                showPresetButtons: true,
                presetWebsites: [{
                        id: 'default',
                        name: '移记社区',
                        url: 'http://8.130.41.186:3000/',
                        icon: '🏠',
                        description: '默认社区页面'
                    }, {
                        id: 'yuanbao',
                        name: '元宝',
                        url: 'https://yuanbao.tencent.com/chat/',
                        icon: '🐙',
                        description: 'ai'
                    }, {
                        id: 'doubao',
                        name: '豆包',
                        url: 'https://www.doubao.com/chat/',
                        icon: '📚',
                        description: 'ai'
                    }, {
                        id: 'baidu',
                        name: '百度',
                        url: 'https://www.baidu.com/',
                        icon: '📖',
                        description: '搜索'
                    }, {
                        id: 'chatgpt',
                        name: 'ChatGPT',
                        url: 'https://chat.openai.com',
                        icon: '🤖',
                        description: 'ai'
                    }
                ]
            }
        };
        this.pomodoroTimer = {
            workDuration: 25,
            breakDuration: 5,
            longBreakDuration: 15,
            sessionsUntilLongBreak: 4,
            currentTime: 25 * 60,
            isRunning: false,
            isWork: true,
            autoStartBreaks: false,
            soundNotifications: true
        };
    }
    async loadData() {
        try {
            const data = await window.electronAPI.loadData();
            if (data) {
                this.clipboardItems = data.clipboardItems || [];
                this.todoItems = data.todoItems || [];
                this.notes = data.notes || [];
                this.settings = {
                    ...this.settings,
                    ...data.settings
                };
                this.pomodoroTimer = {
                    ...this.pomodoroTimer,
                    ...data.pomodoroTimer
                };
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    }

    async saveData() {
        try {
            await window.electronAPI.saveData({
                clipboardItems: this.clipboardItems,
                todoItems: this.todoItems,
                notes: this.notes,
                settings: this.settings,
                pomodoroTimer: this.pomodoroTimer
            });
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }
}

// 剪切板管理器
class ClipboardManager {
    constructor(appState) {
        this.appState = appState;
        this.lastClipboardContent = '';
        this.init();
    }
    init() {
        // 监听剪切板变化事件
        if (window.electronAPI.onClipboardChange) {
            window.electronAPI.onClipboardChange((clipboardItem) => {
                this.handleClipboardChange(clipboardItem);
            });
        }

        // 注意：移除了定期检查剪切板的轮询，现在只依赖 Ctrl+C 事件监听
        // 注意：checkClipboard 方法已移除，现在只使用基于事件的剪切板监控
    }

    handleClipboardChange(clipboardItem) {
        // 如果传入的是字符串（旧格式兼容）
        if (typeof clipboardItem === 'string') {
            const content = clipboardItem;
            if (!content || content === this.lastClipboardContent) return;

            this.lastClipboardContent = content;

            // 检测内容类型
            const type = this.detectContentType(content);

            // 创建剪切板项目
            const item = {
                id: Date.now(),
                content,
                type,
                timestamp: new Date(),
                pinned: false
            };

            // 添加到剪切板历史
            this.appState.clipboardItems.unshift(item);
        } else {
            // 如果传入的是完整的 ClipboardItem 对象（新格式）
            if (!clipboardItem || !clipboardItem.content) return;

            // 检查是否与上次内容相同
            if (clipboardItem.content === this.lastClipboardContent) return;

            this.lastClipboardContent = clipboardItem.content; // 转换为渲染进程的格式
            const item = {
                id: clipboardItem.id || Date.now(),
                content: clipboardItem.content,
                type: clipboardItem.type || 'text',
                timestamp: clipboardItem.timestamp ? new Date(clipboardItem.timestamp) : new Date(),
                pinned: clipboardItem.isPinned || false,
                // 添加图片相关属性
                imageData: clipboardItem.imageData,
                imageSize: clipboardItem.imageSize,
                size: clipboardItem.size
            };

            // 添加到剪切板历史
            this.appState.clipboardItems.unshift(item);
        }

        // 限制历史数量
        if (this.appState.clipboardItems.length > this.appState.settings.maxClipboardItems) {
            this.appState.clipboardItems = this.appState.clipboardItems.slice(0, this.appState.settings.maxClipboardItems);
        }

        // 更新UI
        this.renderClipboardList();

        // 保存数据
        this.appState.saveData();
    }

    detectContentType(content) {
        // 检测代码片段
        if (this.isCode(content)) {
            return 'code';
        }

        // 检测URL
        if (this.isURL(content)) {
            return 'url';
        }

        // 检测邮箱
        if (this.isEmail(content)) {
            return 'email';
        }

        // 检测图片路径
        if (this.isImagePath(content)) {
            return 'image';
        }

        return 'text';
    }

    isCode(content) {
        const codePatterns = [
            /function\s+\w+\s*\(/,
            /class\s+\w+\s*{/,
            /import\s+.*from/,
            /const\s+\w+\s*=/,
            /let\s+\w+\s*=/,
            /var\s+\w+\s*=/,
            /<\w+.*>/,
            /\{\s*".*":\s*".*"\s*\}/,
            /SELECT\s+.*FROM/i,
            /INSERT\s+INTO/i,
            /UPDATE\s+.*SET/i
        ];

        return codePatterns.some(pattern => pattern.test(content));
    }

    isURL(content) {
        try {
            new URL(content);
            return true;
        } catch {
            return /^(https?:\/\/|www\.)/i.test(content);
        }
    }

    isEmail(content) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content);
    }

    isImagePath(content) {
        return /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(content);
    }
    renderClipboardList() {
        const container = document.getElementById('clipboard-list');
        if (!container) return;

        container.innerHTML = '';

        // 分离置顶和非置顶项目
        const pinnedItems = this.appState.clipboardItems.filter(item => item.pinned);
        const unpinnedItems = this.appState.clipboardItems.filter(item => !item.pinned);

        // 先显示置顶项目，然后显示普通项目
        const sortedItems = [...pinnedItems, ...unpinnedItems];

        sortedItems.forEach(item => {
            const element = this.createClipboardItemElement(item);
            container.appendChild(element);
        });

        // 添加置顶分隔线（如果有置顶项目）
        if (pinnedItems.length > 0 && unpinnedItems.length > 0) {
            this.addPinnedSeparator(container, pinnedItems.length);
        }
    }
    createClipboardItemElement(item) {
        const div = document.createElement('div');
        div.className = `clipboard-item ${item.pinned ? 'pinned' : ''}`;
        div.dataset.id = item.id;

        const typeIcon = this.getTypeIcon(item.type);
        const timeAgo = this.formatTimeAgo(item.timestamp); // 根据类型显示不同的内容
        let contentHtml = '';
        if (item.type === 'image' && item.imageData) {
            // 图片显示
            const {
                width,
                height
            } = item.imageSize || {
                width: 0,
                height: 0
            };
            contentHtml = `
                <div class="clipboard-image-container">
                    <img src="${item.imageData}" 
                         alt="剪切板图片" 
                         class="clipboard-image"
                         title="尺寸: ${width}x${height}"
                         data-image-preview="true">
                    <div class="image-info">
                        <span class="image-size">${Math.round((item.size || 0) / 1024)} KB</span>
                        <span class="image-dimensions">${width}x${height}</span>
                    </div>
                </div>
            `;
        } else {
            // 文本内容显示
            contentHtml = `<div class="clipboard-item-content" data-full-content="${this.escapeHtml(item.content)}">${this.escapeHtml(item.content)}</div>`;
        }

        div.innerHTML = `
      <div class="clipboard-item-header">
        <span class="clipboard-item-type">${typeIcon} ${item.type.toUpperCase()}</span>
        <div class="clipboard-item-actions">
          <button class="control-btn pin-btn ${item.pinned ? 'pinned' : ''}" title="${item.pinned ? '取消置顶' : '置顶'}">
            ${item.pinned ? '📌' : '📍'}
          </button>
          <button class="control-btn copy-btn" title="复制">📋</button>
          <button class="control-btn edit-btn" title="编辑">✏️</button>
          <button class="control-btn delete-btn" title="删除">🗑️</button>
        </div>
      </div>
      ${contentHtml}
      <div class="clipboard-item-time">${timeAgo}${item.pinned ? ' • 已置顶' : ''}</div>
    `;

        // 添加事件监听器
        this.addClipboardItemEventListeners(div, item);

        return div;
    }
    addClipboardItemEventListeners(element, item) {
        // 图片预览点击事件
        const imagePreview = element.querySelector('[data-image-preview="true"]');
        if (imagePreview && item.imageData) {
            imagePreview.addEventListener('click', (e) => {
                e.stopPropagation();
                window.app.showImagePreview(item.imageData);
            });
            // 添加鼠标悬停样式
            imagePreview.style.cursor = 'pointer';
        }

        // 点击复制
        element.addEventListener('click', (e) => {
            if (!e.target.classList.contains('control-btn') && !e.target.hasAttribute('data-image-preview')) {
                this.copyToClipboard(item.content, item);
            }
        });

        // 置顶按钮
        element.querySelector('.pin-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePin(item.id);
        });

        // 复制按钮
        element.querySelector('.copy-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.copyToClipboard(item.content, item);
        });

        // 编辑按钮
        element.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.editClipboardItem(item.id);
        });

        // 删除按钮
        element.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteClipboardItem(item.id);
        });
    }
    async copyToClipboard(content, item = null) {
        try {
            // 如果是图片类型，需要特殊处理
            if (item && item.type === 'image' && item.imageData) {
                // 对于图片，我们需要通过Electron API来处理
                await window.electronAPI.writeImageToClipboard(item.imageData);
                this.showNotification('复制成功', '图片已复制到剪切板');
            } else {
                // 文本内容直接复制
                await window.electronAPI.writeToClipboard(content);
                this.showNotification('复制成功', '内容已复制到剪切板');
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showNotification('复制失败', '无法复制到剪切板');
        }
    }
    togglePin(itemId) {
        const item = this.appState.clipboardItems.find(item => item.id === itemId);
        if (item) {
            item.pinned = !item.pinned;

            // 添加动画效果
            const element = document.querySelector(`[data-id="${itemId}"]`);
            if (element) {
                element.classList.add('pin-animation');
                setTimeout(() => {
                    element.classList.remove('pin-animation');
                }, 300);
            }

            this.appState.saveData();
            this.renderClipboardList();

            // 显示通知
            const message = item.pinned ? '已置顶' : '取消置顶';
            this.showNotification(message, `剪切板项目${message}`);
        }
    }
    editClipboardItem(itemId) {
        const item = this.appState.clipboardItems.find(item => item.id === itemId);
        if (item) {
            this.showEditModal(item);
        }
    }

    showEditModal(item) { // 创建编辑模态框
        const modal = document.createElement('div');
        modal.className = 'modal active edit-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">
                        <span class="modal-icon">✏️</span>
                        <h3>编辑剪切板内容</h3>
                    </div>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="edit-content-type" class="form-label">
                            <span class="label-icon">🏷️</span>
                            内容类型
                        </label>
                        <select id="edit-content-type" class="form-select">
                            <option value="text" ${item.type === 'text' ? 'selected' : ''}>📄 文本</option>
                            <option value="code" ${item.type === 'code' ? 'selected' : ''}>💻 代码</option>
                            <option value="url" ${item.type === 'url' ? 'selected' : ''}>🔗 链接</option>
                            <option value="email" ${item.type === 'email' ? 'selected' : ''}>📧 邮箱</option>
                            <option value="image" ${item.type === 'image' ? 'selected' : ''}>🖼️ 图片</option>
                        </select>
                    </div>                    <div class="form-group">
                        <label for="edit-content" class="form-label">
                            <span class="label-icon">📝</span>
                            内容 <span class="required">*</span>
                        </label>
                        <textarea id="edit-content" class="form-textarea" rows="6" 
                                  placeholder="输入内容..." required>${this.escapeHtml(item.content)}</textarea>
                        <div class="char-counter">
                            <span id="edit-content-counter">0</span> 字符
                        </div>
                    </div>
                    <div class="form-group checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="edit-pinned" class="form-checkbox" ${item.pinned ? 'checked' : ''}>
                            <span class="checkbox-custom"></span>
                            <span class="checkbox-text">
                                <span class="feature-icon">📌</span>
                                置顶显示
                            </span>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-edit">取消</button>
                    <button class="btn btn-primary" id="save-edit">💾 保存</button>                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 设置字符计数器
        const contentTextarea = modal.querySelector('#edit-content');
        const contentCounter = modal.querySelector('#edit-content-counter');

        // 初始化计数器
        contentCounter.textContent = contentTextarea.value.length; // 内容字符计数
        contentTextarea.addEventListener('input', () => {
            contentCounter.textContent = contentTextarea.value.length;
            // 移除字数限制，只显示当前字符数
            contentCounter.style.color = 'var(--text-secondary)';
        });

        // 添加事件监听
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#cancel-edit').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#save-edit').addEventListener('click', () => {
            const newContent = modal.querySelector('#edit-content').value;
            const newType = modal.querySelector('#edit-content-type').value;
            const newPinned = modal.querySelector('#edit-pinned').checked;

            if (newContent.trim()) {
                item.content = newContent.trim();
                item.type = newType;
                item.pinned = newPinned;
                item.timestamp = new Date(); // 更新时间戳

                this.appState.saveData();
                this.renderClipboardList();
                this.showNotification('保存成功', '剪切板内容已更新');
            }

            document.body.removeChild(modal);
        });

        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // 自动聚焦到内容文本框
        setTimeout(() => {
            modal.querySelector('#edit-content').focus();
        }, 100);
    }

    addPinnedSeparator(container, pinnedCount) {
        const separatorIndex = pinnedCount;
        const separator = document.createElement('div');
        separator.className = 'pinned-separator';
        separator.innerHTML = `
            <div class="separator-line"></div>
            <div class="separator-text">其他项目</div>
            <div class="separator-line"></div>
        `;

        // 在置顶项目后插入分隔线
        const items = container.children;
        if (items[separatorIndex]) {
            container.insertBefore(separator, items[separatorIndex]);
        }
    }
    deleteClipboardItem(itemId) {
        const item = this.appState.clipboardItems.find(item => item.id === itemId);
        if (!item) return;

        // 获取内容预览
        const preview = item.content.length > 50 ?
            item.content.substring(0, 50) + '...' :
            item.content;

        // 使用统一的删除确认对话框
        window.app.showDeleteConfirmDialog({
            title: '删除剪切板项目',
            itemName: preview,
            itemType: '剪切板项目',
            onConfirm: () => {
                this.appState.clipboardItems = this.appState.clipboardItems.filter(item => item.id !== itemId);
                this.appState.saveData();
                this.renderClipboardList();
                this.showNotification('删除成功', '剪切板项目已删除');
            }
        });
    }
    clearClipboard() {
        // 保留置顶的项目，只清理非置顶项目
        const pinnedItems = this.appState.clipboardItems.filter(item => item.pinned);
        const totalItems = this.appState.clipboardItems.length;

        if (pinnedItems.length === totalItems) {
            this.showNotification('提示', '所有项目都已置顶，无需清理');
            return;
        }

        if (confirm('确定要清空非置顶的剪切板历史吗？置顶项目将会保留。')) {
            this.appState.clipboardItems = pinnedItems;
            this.appState.saveData();
            this.renderClipboardList();

            // 显示操作结果通知
            const clearedCount = totalItems - pinnedItems.length;
            this.showNotification('清理完成', `已清理 ${clearedCount} 个非置顶项目，保留 ${pinnedItems.length} 个置顶项目`);
        }
    }

    getTypeIcon(type) {
        const icons = {
            code: '💻',
            url: '🌐',
            email: '📧',
            image: '🖼️',
            text: '📄'
        };
        return icons[type] || '📄';
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}天前`;
        if (hours > 0) return `${hours}小时前`;
        if (minutes > 0) return `${minutes}分钟前`;
        return '刚刚';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(title, body) {
        if (window.electronAPI.showNotification) {
            window.electronAPI.showNotification(title, body);
        }
    }
}

// 待办清单管理器
class TodoManager {
    constructor(appState) {
        this.appState = appState;
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.renderTodoList();
        this.setupEventListeners();
    }
    setupEventListeners() {
        // 添加待办按钮
        document.getElementById('add-todo').addEventListener('click', () => {
            this.showAddTodoModal();
        });

        // 筛选器
        document.getElementById('todo-filter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.renderTodoList();
        });
    }
    showAddTodoModal() {
        // 显示美化的添加待办事项模态框
        const modal = document.getElementById('add-todo-modal');
        if (!modal) return;

        // 重置表单
        this.resetAddTodoForm();

        // 显示模态框
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);

        // 设置事件监听器
        this.setupAddTodoModalEvents(modal);

        // 自动聚焦到标题输入框
        setTimeout(() => {
            document.getElementById('todo-title').focus();
        }, 300);
    }

    resetAddTodoForm() {
        // 重置所有表单字段
        document.getElementById('todo-title').value = '';
        document.getElementById('todo-description').value = '';
        document.getElementById('todo-priority').value = 'medium';
        document.getElementById('todo-category').value = '';
        document.getElementById('todo-deadline').value = '';
        document.getElementById('todo-reminder').checked = false;
        document.getElementById('todo-pomodoro').checked = false;

        // 重置字符计数器
        this.updateCharCounter();

        // 重置验证状态
        this.clearValidationMessages();
    }

    setupAddTodoModalEvents(modal) {
        // 移除之前的事件监听器，避免重复绑定
        const existingHandlers = modal._eventHandlers || {};

        // 关闭按钮
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn && !existingHandlers.close) {
            const closeHandler = () => this.hideAddTodoModal();
            closeBtn.addEventListener('click', closeHandler);
            existingHandlers.close = closeHandler;
        }

        // 取消按钮
        const cancelBtn = document.getElementById('cancel-todo');
        if (cancelBtn && !existingHandlers.cancel) {
            const cancelHandler = () => this.hideAddTodoModal();
            cancelBtn.addEventListener('click', cancelHandler);
            existingHandlers.cancel = cancelHandler;
        }

        // 表单提交
        const form = document.getElementById('add-todo-form');
        if (form && !existingHandlers.submit) {
            const submitHandler = (e) => {
                e.preventDefault();
                this.handleAddTodoSubmit();
            };
            form.addEventListener('submit', submitHandler);
            existingHandlers.submit = submitHandler;
        }

        // 保存按钮（备用）
        const saveBtn = document.getElementById('save-todo');
        if (saveBtn && !existingHandlers.save) {
            const saveHandler = (e) => {
                e.preventDefault();
                this.handleAddTodoSubmit();
            };
            saveBtn.addEventListener('click', saveHandler);
            existingHandlers.save = saveHandler;
        }

        // 实时验证和字符计数
        const titleInput = document.getElementById('todo-title');
        if (titleInput && !existingHandlers.titleInput) {
            const titleHandler = () => this.validateTitle();
            titleInput.addEventListener('input', titleHandler);
            titleInput.addEventListener('blur', titleHandler);
            existingHandlers.titleInput = titleHandler;
        }

        const descTextarea = document.getElementById('todo-description');
        if (descTextarea && !existingHandlers.descInput) {
            const descHandler = () => this.updateCharCounter();
            descTextarea.addEventListener('input', descHandler);
            existingHandlers.descInput = descHandler;
        }

        // 点击模态框背景关闭
        if (!existingHandlers.backdrop) {
            const backdropHandler = (e) => {
                if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
                    this.hideAddTodoModal();
                }
            };
            modal.addEventListener('click', backdropHandler);
            existingHandlers.backdrop = backdropHandler;
        }

        // ESC 键关闭
        if (!existingHandlers.keydown) {
            const keydownHandler = (e) => {
                if (e.key === 'Escape') {
                    this.hideAddTodoModal();
                }
            };
            document.addEventListener('keydown', keydownHandler);
            existingHandlers.keydown = keydownHandler;
        }

        // 保存事件处理器引用
        modal._eventHandlers = existingHandlers;
    }

    hideAddTodoModal() {
        const modal = document.getElementById('add-todo-modal');
        if (!modal) return;

        modal.classList.remove('active');

        setTimeout(() => {
            modal.style.display = 'none';

            // 清理事件监听器
            if (modal._eventHandlers && modal._eventHandlers.keydown) {
                document.removeEventListener('keydown', modal._eventHandlers.keydown);
                delete modal._eventHandlers.keydown;
            }
        }, 300);
    }

    validateTitle() {
        const titleInput = document.getElementById('todo-title');
        const feedback = document.getElementById('title-feedback');
        const title = titleInput.value.trim();

        if (!title) {
            this.showFieldError(titleInput, feedback, '请输入待办事项标题');
            return false;
        } else if (title.length > 100) {
            this.showFieldError(titleInput, feedback, '标题长度不能超过100个字符');
            return false;
        } else {
            this.showFieldSuccess(titleInput, feedback, '');
            return true;
        }
    }

    updateCharCounter() {
        const textarea = document.getElementById('todo-description');
        const counter = document.getElementById('desc-counter');
        const currentLength = textarea.value.length;

        if (counter) {
            counter.textContent = currentLength;

            // 根据字符数量改变颜色
            if (currentLength > 450) {
                counter.style.color = 'var(--danger-color)';
            } else if (currentLength > 400) {
                counter.style.color = 'var(--warning-color)';
            } else {
                counter.style.color = 'var(--text-secondary)';
            }
        }
    }

    showFieldError(input, feedback, message) {
        input.classList.remove('field-success');
        input.classList.add('field-error');
        if (feedback) {
            feedback.textContent = message;
            feedback.className = 'input-feedback error';
        }
    }

    showFieldSuccess(input, feedback, message) {
        input.classList.remove('field-error');
        input.classList.add('field-success');
        if (feedback) {
            feedback.textContent = message;
            feedback.className = 'input-feedback success';
        }
    }

    clearValidationMessages() {
        const inputs = document.querySelectorAll('#add-todo-modal .form-input, #add-todo-modal .form-textarea');
        const feedbacks = document.querySelectorAll('#add-todo-modal .input-feedback');

        inputs.forEach(input => {
            input.classList.remove('field-error', 'field-success');
        });

        feedbacks.forEach(feedback => {
            feedback.textContent = '';
            feedback.className = 'input-feedback';
        });
    }

    handleAddTodoSubmit() {
        // 验证表单
        const isValid = this.validateAddTodoForm();
        if (!isValid) return;

        // 收集表单数据
        const formData = this.collectAddTodoFormData();

        // 创建待办事项
        const todo = {
            id: Date.now(),
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            category: formData.category,
            dueDate: formData.deadline ? new Date(formData.deadline) : null,
            hasReminder: formData.reminder,
            hasPomodoroTimer: formData.pomodoro,
            completed: false,
            createdAt: new Date(),
            completedAt: null,
            updatedAt: new Date()
        };

        // 保存到状态
        this.appState.todoItems.unshift(todo);
        this.appState.saveData();

        // 更新UI
        this.renderTodoList();
        this.hideAddTodoModal();

        // 显示成功通知
        this.showNotification('创建成功', `待办事项"${todo.title}"已创建`);
    }

    validateAddTodoForm() {
        const titleValid = this.validateTitle();

        // 可以添加更多验证规则
        const descTextarea = document.getElementById('todo-description');
        if (descTextarea.value.length > 500) {
            this.showFieldError(descTextarea, null, '描述长度不能超过500个字符');
            return false;
        }

        return titleValid;
    }

    collectAddTodoFormData() {
        return {
            title: document.getElementById('todo-title').value.trim(),
            description: document.getElementById('todo-description').value.trim(),
            priority: document.getElementById('todo-priority').value,
            category: document.getElementById('todo-category').value,
            deadline: document.getElementById('todo-deadline').value,
            reminder: document.getElementById('todo-reminder').checked,
            pomodoro: document.getElementById('todo-pomodoro').checked
        };
    }

    renderTodoList() {
        const container = document.getElementById('todo-list');
        if (!container) return;

        const filteredTodos = this.filterTodos();
        container.innerHTML = '';

        filteredTodos.forEach(todo => {
            const element = this.createTodoElement(todo);
            container.appendChild(element);
        });
    }

    filterTodos() {
        let filtered = [...this.appState.todoItems];

        switch (this.currentFilter) {
            case 'pending':
                filtered = filtered.filter(todo => !todo.completed);
                break;
            case 'completed':
                filtered = filtered.filter(todo => todo.completed);
                break;
            case 'high':
                filtered = filtered.filter(todo => todo.priority === 'high');
                break;
        }

        return filtered;
    }

    createTodoElement(todo) {
        const div = document.createElement('div');
        div.className = `todo-item ${todo.completed ? 'completed' : ''} ${todo.priority}-priority`;
        div.dataset.id = todo.id;
        div.draggable = true;

        div.innerHTML = `
      <div class="todo-item-header">
        <div class="todo-item-title">
          <input type="checkbox" ${todo.completed ? 'checked' : ''} class="todo-checkbox">
          <span>${this.escapeHtml(todo.title)}</span>
        </div>
        <div class="todo-item-actions">
          <button class="control-btn pomodoro-btn" title="番茄时钟">🍅</button>
          <button class="control-btn edit-btn" title="编辑">✏️</button>
          <button class="control-btn delete-btn" title="删除">🗑️</button>
        </div>
      </div>
      ${todo.description ? `<div class="todo-item-description">${this.escapeHtml(todo.description)}</div>` : ''}
      <div class="todo-item-meta">
        <span class="priority-badge priority-${todo.priority}">${this.getPriorityText(todo.priority)}</span>
        <span class="todo-item-time">${this.formatDate(todo.createdAt)}</span>
      </div>
    `;

        this.addTodoEventListeners(div, todo);
        return div;
    }

    addTodoEventListeners(element, todo) {
        // 复选框状态变化
        element.querySelector('.todo-checkbox').addEventListener('change', (e) => {
            this.toggleTodoComplete(todo.id, e.target.checked);
        });

        // 编辑按钮
        element.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.editTodo(todo.id);
        });

        // 删除按钮
        element.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTodo(todo.id);
        });

        // 番茄时钟按钮
        element.querySelector('.pomodoro-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.startPomodoro(todo);
        });

        // 拖拽事件
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', todo.id);
        });

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
            this.reorderTodos(draggedId, todo.id);
        });
    }

    toggleTodoComplete(todoId, completed) {
        const todo = this.appState.todoItems.find(item => item.id === todoId);
        if (todo) {
            todo.completed = completed;
            todo.completedAt = completed ? new Date() : null;
            this.appState.saveData();
            this.renderTodoList();
        }
    }
    editTodo(todoId) {
        const todo = this.appState.todoItems.find(item => item.id === todoId);
        if (todo) {
            this.showEditTodoModal(todo);
        }
    }
    showEditTodoModal(todo) {
        // 创建编辑模态框
        const modal = document.createElement('div');
        modal.className = 'modal active add-todo-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">
                        <span class="modal-icon">✏️</span>
                        <h3>编辑待办事项</h3>
                    </div>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="todo-form">
                        <div class="form-group">
                            <label for="edit-todo-title" class="form-label">
                                <span class="label-icon">📝</span>
                                标题 <span class="required">*</span>
                            </label>
                            <input type="text" id="edit-todo-title" class="form-input" 
                                   value="${this.escapeHtml(todo.title)}" placeholder="请输入待办事项标题..." required>
                            <div class="char-counter">
                                <span id="edit-title-counter">0</span>/50
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-todo-description" class="form-label">
                                <span class="label-icon">📄</span>
                                描述
                            </label>
                            <textarea id="edit-todo-description" class="form-textarea" 
                                      placeholder="添加描述信息..." rows="4">${this.escapeHtml(todo.description || '')}</textarea>
                            <div class="char-counter">
                                <span id="edit-description-counter">0</span>/200
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit-todo-priority" class="form-label">
                                    <span class="label-icon">⭐</span>
                                    优先级
                                </label>
                                <select id="edit-todo-priority" class="form-select">
                                    <option value="low" ${todo.priority === 'low' ? 'selected' : ''}>🍃 低优先级</option>
                                    <option value="medium" ${todo.priority === 'medium' ? 'selected' : ''}>⚡ 中优先级</option>
                                    <option value="high" ${todo.priority === 'high' ? 'selected' : ''}>🔥 高优先级</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-todo-deadline" class="form-label">
                                <span class="label-icon">📅</span>
                                截止日期
                            </label>
                            <input type="datetime-local" id="edit-todo-deadline" class="form-input" 
                                   value="${todo.dueDate ? new Date(todo.dueDate).toISOString().slice(0, 16) : ''}">
                            <div class="input-help">选择待办事项的截止时间（可选）</div>
                        </div>
                        
                        <div class="form-group">
                            <div class="feature-item">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="edit-todo-completed" class="form-checkbox" ${todo.completed ? 'checked' : ''}>
                                    <span class="checkbox-custom"></span>
                                    <span class="checkbox-text">
                                        <span class="feature-icon">✅</span>
                                        标记为已完成
                                    </span>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-edit-todo">取消</button>
                    <button class="btn btn-danger" id="delete-edit-todo" title="删除此待办事项">🗑️ 删除</button>
                    <button class="btn btn-primary" id="save-edit-todo">💾 保存修改</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // 设置字符计数器
        const titleInput = modal.querySelector('#edit-todo-title');
        const titleCounter = modal.querySelector('#edit-title-counter');
        const descriptionTextarea = modal.querySelector('#edit-todo-description');
        const descriptionCounter = modal.querySelector('#edit-description-counter');

        // 初始化计数器
        titleCounter.textContent = titleInput.value.length;
        descriptionCounter.textContent = descriptionTextarea.value.length;

        // 标题字符计数
        titleInput.addEventListener('input', () => {
            titleCounter.textContent = titleInput.value.length;
            if (titleInput.value.length > 50) {
                titleCounter.style.color = 'var(--danger-color)';
            } else {
                titleCounter.style.color = 'var(--text-secondary)';
            }
        });

        // 描述字符计数
        descriptionTextarea.addEventListener('input', () => {
            descriptionCounter.textContent = descriptionTextarea.value.length;
            if (descriptionTextarea.value.length > 200) {
                descriptionCounter.style.color = 'var(--danger-color)';
            } else {
                descriptionCounter.style.color = 'var(--text-secondary)';
            }
        });

        // 添加事件监听
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('#cancel-edit-todo').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        modal.querySelector('#delete-edit-todo').addEventListener('click', () => {
            // 使用统一的删除确认对话框
            window.app.showDeleteConfirmDialog({
                title: '删除待办事项',
                itemName: todo.title,
                itemType: '待办事项',
                onConfirm: () => {
                    this.deleteTodo(todo.id);
                    document.body.removeChild(modal);
                }
            });
        });
        modal.querySelector('#save-edit-todo').addEventListener('click', () => {
            const newTitle = modal.querySelector('#edit-todo-title').value.trim();
            const newDescription = modal.querySelector('#edit-todo-description').value.trim();
            const newPriority = modal.querySelector('#edit-todo-priority').value;
            const newDueDate = modal.querySelector('#edit-todo-deadline').value;
            const newCompleted = modal.querySelector('#edit-todo-completed').checked;

            if (newTitle) {
                todo.title = newTitle;
                todo.description = newDescription;
                todo.priority = newPriority;
                todo.dueDate = newDueDate ? new Date(newDueDate) : null;
                todo.completed = newCompleted;
                todo.completedAt = newCompleted ? new Date() : null;
                todo.updatedAt = new Date();

                this.appState.saveData();
                this.renderTodoList();
                document.body.removeChild(modal);
                this.showNotification('更新成功', '待办事项已保存');
            } else {
                alert('标题不能为空');
            }
        });

        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // 自动聚焦到标题输入框
        setTimeout(() => {
            modal.querySelector('#edit-todo-title').focus();
            modal.querySelector('#edit-todo-title').select();
        }, 100);
    }
    deleteTodo(todoId) {
        const todo = this.appState.todoItems.find(item => item.id === todoId);
        if (!todo) return;

        // 使用统一的删除确认对话框
        window.app.showDeleteConfirmDialog({
            title: '删除待办事项',
            itemName: todo.title,
            itemType: '待办事项',
            onConfirm: () => {
                this.appState.todoItems = this.appState.todoItems.filter(item => item.id !== todoId);
                this.appState.saveData();
                this.renderTodoList();
                this.showNotification('删除成功', '待办事项已删除');
            }
        });
    }

    reorderTodos(draggedId, targetId) {
        const draggedIndex = this.appState.todoItems.findIndex(item => item.id === draggedId);
        const targetIndex = this.appState.todoItems.findIndex(item => item.id === targetId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            const [draggedItem] = this.appState.todoItems.splice(draggedIndex, 1);
            this.appState.todoItems.splice(targetIndex, 0, draggedItem);
            this.appState.saveData();
            this.renderTodoList();
        }
    }
    startPomodoro(todo) {
        // 打开番茄时钟模态框
        const modal = document.getElementById('pomodoro-modal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);

            // 设置当前任务
            const title = modal.querySelector('.modal-header h3');
            if (title) {
                title.textContent = `🍅 ${todo.title}`;
            }

            // 重置到初始状态
            window.app.pomodoroManager.reset();
        }
    }
    getPriorityText(priority) {
        const texts = {
            low: '低',
            medium: '中',
            high: '高'
        };
        return texts[priority] || '中';
    }

    formatDate(date) {
        return new Date(date).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(title, body) {
        if (window.electronAPI && window.electronAPI.showNotification) {
            window.electronAPI.showNotification(title, body);
        }
    }
}

// 番茄时钟管理器
class PomodoroManager {
    constructor(appState) {
        this.appState = appState;
        this.timer = null;
        this.sessionCount = 0;
        this.totalFocusTime = 0;
        this.totalBreakTime = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
        this.updateButtons();
        this.updateStatus();
        this.updateStats();
        this.updateProgressDots();
        this.loadSettings();
    }

    setupEventListeners() {
        // 主要控制按钮
        document.getElementById('pomodoro-start').addEventListener('click', () => {
            this.start();
        });

        document.getElementById('pomodoro-pause').addEventListener('click', () => {
            this.pause();
        });

        document.getElementById('pomodoro-reset').addEventListener('click', () => {
            this.reset();
        });

        // 模态框关闭
        const closeBtn = document.querySelector('#pomodoro-modal .modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeModal();
            });
        } // 高级设置切换
        const advancedToggle = document.getElementById('advanced-toggle');
        if (advancedToggle) {
            advancedToggle.addEventListener('change', (e) => {
                this.toggleAdvancedSettings(e.target.checked);
            });
        }

        // 点击模态框背景关闭
        const modal = document.getElementById('pomodoro-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        } // 输入按钮事件
        this.setupInputButtons();
    }

    setupInputButtons() {
        // 为所有输入按钮添加事件监听
        document.querySelectorAll('.input-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.target;
                const input = document.getElementById(target);
                const isPlus = btn.classList.contains('plus');
                const isMinus = btn.classList.contains('minus');

                if (input) {
                    let value = parseInt(input.value);
                    const min = parseInt(input.min) || 1;
                    const max = parseInt(input.max) || 60;

                    if (isPlus && value < max) {
                        input.value = value + 1;
                    } else if (isMinus && value > min) {
                        input.value = value - 1;
                    }

                    // 触发change事件
                    input.dispatchEvent(new Event('change'));
                }
            });
        });
    }
    start() {
        this.appState.pomodoroTimer.isRunning = true;
        this.timer = setInterval(() => {
            this.tick();
        }, 1000);
        this.updateButtons();
        this.updateStatus();
        this.updateModalState();
    }

    pause() {
        this.appState.pomodoroTimer.isRunning = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.updateButtons();
        this.updateStatus();
        this.updateModalState();
    }

    reset() {
        this.pause();
        const timer = this.appState.pomodoroTimer;
        timer.currentTime = timer.isWork ? timer.workDuration * 60 : timer.breakDuration * 60;
        this.updateDisplay();
        this.updateButtons();
        this.updateStatus();
        this.updateModalState();
    }

    tick() {
        this.appState.pomodoroTimer.currentTime--;
        this.updateDisplay();

        if (this.appState.pomodoroTimer.currentTime <= 0) {
            this.complete();
        }
    }

    complete() {
        this.pause();
        const timer = this.appState.pomodoroTimer;

        if (timer.isWork) {
            // 工作时间完成
            this.sessionCount++;
            this.totalFocusTime += timer.workDuration;
            this.showNotification('工作完成！', '是时候休息一下了 ☕');

            // 判断是否需要长休息
            const needLongBreak = this.sessionCount % (timer.sessionsUntilLongBreak || 4) === 0;
            const breakDuration = needLongBreak ?
                (timer.longBreakDuration || 15) : timer.breakDuration;

            timer.isWork = false;
            timer.currentTime = breakDuration * 60;

            // 更新会话类型显示
            this.updateSessionType(needLongBreak ? 'long-break' : 'break');

        } else {
            // 休息时间完成
            this.totalBreakTime += timer.breakDuration;
            this.showNotification('休息结束！', '开始新的工作周期 🔥');
            timer.isWork = true;
            timer.currentTime = timer.workDuration * 60;
            this.updateSessionType('work');
        }

        this.updateDisplay();
        this.updateButtons();
        this.updateStats();
        this.updateProgressDots();

        // 播放提示音
        if (timer.soundNotifications !== false) {
            this.playNotificationSound();
        }

        // 自动开始下一阶段
        if (timer.autoStartBreaks && !timer.isWork) {
            setTimeout(() => this.start(), 2000);
        }
    }

    updateSessionType(type) {
        const sessionTypeEl = document.getElementById('session-type');
        if (sessionTypeEl) {
            switch (type) {
                case 'work':
                    sessionTypeEl.textContent = '工作时间';
                    break;
                case 'break':
                    sessionTypeEl.textContent = '短休息';
                    break;
                case 'long-break':
                    sessionTypeEl.textContent = '长休息';
                    break;
                default:
                    sessionTypeEl.textContent = '工作时间';
            }
        }
    }

    updateProgressDots() {
        const dots = document.querySelectorAll('.progress-dots .dot');
        const currentSession = this.sessionCount % 4;

        dots.forEach((dot, index) => {
            if (index < currentSession) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    updateStats() {
        // 更新完成轮次
        const completedEl = document.getElementById('completed-sessions');
        if (completedEl) {
            completedEl.textContent = this.sessionCount;
        }

        // 更新专注时长 (转换为小时:分钟格式)
        const focusTimeEl = document.getElementById('focus-time');
        if (focusTimeEl) {
            const hours = Math.floor(this.totalFocusTime / 60);
            const minutes = this.totalFocusTime % 60;
            focusTimeEl.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        }

        // 更新休息时长
        const breakTimeEl = document.getElementById('break-time');
        if (breakTimeEl) {
            const hours = Math.floor(this.totalBreakTime / 60);
            const minutes = this.totalBreakTime % 60;
            breakTimeEl.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        }
    }

    toggleAdvancedSettings(show) {
        const advancedSettings = document.querySelector('.settings-advanced');
        if (advancedSettings) {
            if (show) {
                advancedSettings.style.display = 'block';
                setTimeout(() => advancedSettings.style.opacity = '1', 10);
            } else {
                advancedSettings.style.opacity = '0';
                setTimeout(() => advancedSettings.style.display = 'none', 300);
            }
        }
    }

    loadSettings() {
        // 加载设置到界面
        const timer = this.appState.pomodoroTimer;

        document.getElementById('work-duration').value = timer.workDuration || 25;
        document.getElementById('break-duration').value = timer.breakDuration || 5;

        const longBreakDuration = document.getElementById('long-break-duration');
        if (longBreakDuration) {
            longBreakDuration.value = timer.longBreakDuration || 15;
        }

        const sessionsUntilLongBreak = document.getElementById('sessions-until-long-break');
        if (sessionsUntilLongBreak) {
            sessionsUntilLongBreak.value = timer.sessionsUntilLongBreak || 4;
        }

        const autoStartBreaks = document.getElementById('auto-start-breaks');
        if (autoStartBreaks) {
            autoStartBreaks.checked = timer.autoStartBreaks || false;
        }

        const soundNotifications = document.getElementById('sound-notifications');
        if (soundNotifications) {
            soundNotifications.checked = timer.soundNotifications !== false;
        }
    }

    saveSettings() {
        // 保存设置到appState
        this.appState.saveData();
    }

    updateModalState() {
        const modal = document.getElementById('pomodoro-modal');
        const timer = this.appState.pomodoroTimer;

        // 移除所有状态类
        modal.classList.remove('running', 'break', 'long-break');

        if (timer.isRunning) {
            modal.classList.add('running');
            if (!timer.isWork) {
                modal.classList.add('break');
            }
        }
    }

    playNotificationSound() {
        // 简单的声音提示，使用Web Audio API创建提示音
        try {
            const audioContext = new(window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('无法播放提示音:', error);
        }
    }
    updateDisplay() {
        const time = this.appState.pomodoroTimer.currentTime;
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        document.getElementById('pomodoro-time').textContent = display;

        // 更新进度环
        this.updateProgress();

        // 更新状态显示
        this.updateStatus();
    }

    updateProgress() {
        const timer = this.appState.pomodoroTimer;
        const totalTime = timer.isWork ? timer.workDuration * 60 : timer.breakDuration * 60;
        const progress = ((totalTime - timer.currentTime) / totalTime) * 100;

        const progressRing = document.querySelector('.progress-ring-fill');
        if (progressRing) {
            const circumference = 628.32; // 2 * π * 100 (半径为100)
            const offset = circumference - (progress / 100) * circumference;
            progressRing.style.strokeDashoffset = offset;
        }
    }

    updateStatus() {
        const timer = this.appState.pomodoroTimer;
        const statusElement = document.getElementById('pomodoro-status');

        if (statusElement) {
            if (timer.isRunning) {
                if (timer.isWork) {
                    statusElement.textContent = '🔥 专注工作中...';
                } else {
                    statusElement.textContent = '☕ 休息时间...';
                }
            } else {
                if (timer.isWork) {
                    statusElement.textContent = '准备开始工作时间';
                } else {
                    statusElement.textContent = '准备开始休息时间';
                }
            }
        }

        // 更新会话类型显示
        const sessionTypeEl = document.getElementById('session-type');
        if (sessionTypeEl && !timer.isRunning) {
            sessionTypeEl.textContent = timer.isWork ? '工作时间' : '休息时间';
        }
    }

    updateButtons() {
        const startBtn = document.getElementById('pomodoro-start');
        const pauseBtn = document.getElementById('pomodoro-pause');

        if (this.appState.pomodoroTimer.isRunning) {
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'inline-flex';
        } else {
            startBtn.style.display = 'inline-flex';
            pauseBtn.style.display = 'none';
        }
    }
    closeModal() {
        const modal = document.getElementById('pomodoro-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                // 重置模态框标题
                const title = modal.querySelector('.modal-header h3');
                if (title) {
                    title.textContent = '🍅 番茄专注计时器';
                }
            }, 300);
        }
    }

    showNotification(title, body) {
        if (window.electronAPI && window.electronAPI.showNotification) {
            window.electronAPI.showNotification(title, body);
        } else {
            // 浏览器环境下的fallback
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, {
                    body
                });
            }
        }
    }
}

// 笔记管理器
class NotesManager {
    constructor(appState) {
        this.appState = appState;
        this.currentMode = 'edit';
        this.workspacePath = null; // 当前工作文件夹路径
        this.workspaceFiles = []; // 工作文件夹中的文件列表
        this.currentFilePath = null; // 当前编辑的文件路径
        this.init();
    }

    init() {
        this.renderFilesList();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 新建笔记
        document.getElementById('new-note').addEventListener('click', () => {
            this.createNewNote();
        });

        // 打开工作文件夹
        document.getElementById('open-workspace-folder').addEventListener('click', () => {
            this.openWorkspaceFolder();
        });

        // 关闭工作文件夹
        const closeWorkspaceBtn = document.getElementById('close-workspace');
        if (closeWorkspaceBtn) {
            closeWorkspaceBtn.addEventListener('click', () => {
                this.closeWorkspace();
            });
        }

        // 预览按钮切换
        document.getElementById('toggle-preview').addEventListener('click', () => {
            this.togglePreview();
        });

        // 编辑器内容变化 - 自动保存
        let autoSaveTimeout = null;
        document.getElementById('markdown-editor').addEventListener('input', () => {
            // 显示保存状态
            this.showSaveStatus('正在保存...');

            // 如果当前是预览模式，更新预览
            if (this.currentMode === 'preview') {
                this.updatePreview();
            }

            // 防抖：用户停止输入500ms后才保存
            if (autoSaveTimeout) {
                clearTimeout(autoSaveTimeout);
            }

            autoSaveTimeout = setTimeout(() => {
                this.autoSaveCurrentNote();
            }, 500);
        });

        // 侧边栏切换
        document.getElementById('toggle-sidebar').addEventListener('click', () => {
            this.toggleSidebar();
        });
    } // 打开工作文件夹
    async openWorkspaceFolder() {
        try {
            const response = await window.electronAPI.openFolderDialog({
                title: '选择Markdown工作文件夹'
            });

            // 检查IPC调用是否成功
            if (!response.success) {
                throw new Error(response.error || '打开文件夹对话框失败');
            }

            const result = response.data;
            if (result.canceled || result.filePaths.length === 0) {
                return;
            }

            this.workspacePath = result.filePaths[0];

            // 显示工作区信息
            this.updateWorkspaceInfo();

            // 加载工作文件夹中的文件
            await this.refreshWorkspaceFiles();

            this.showNotification('工作文件夹打开成功', `已打开: ${this.workspacePath}`);

        } catch (error) {
            console.error('打开工作文件夹失败:', error);
            this.showNotification('打开失败', error.message || '无法打开文件夹');
        }
    }

    // 关闭工作区
    closeWorkspace() {
        this.workspacePath = null;
        this.workspaceFiles = [];
        this.currentFilePath = null;

        // 清空编辑器
        document.getElementById('markdown-editor').value = '';
        const preview = document.getElementById('markdown-preview');
        if (preview) {
            preview.innerHTML = '<p class="no-content">选择或创建一个Markdown文件开始编辑...</p>';
        }

        // 隐藏工作区信息
        this.updateWorkspaceInfo();

        // 恢复原有笔记列表
        this.renderFilesList();

        this.showNotification('工作文件夹已关闭', '已切换回普通笔记模式');
    }

    // 更新工作区信息显示
    updateWorkspaceInfo() {
        const workspaceInfo = document.getElementById('workspace-info');
        const workspaceName = document.getElementById('workspace-name');
        const workspacePath = document.getElementById('workspace-path');

        if (this.workspacePath) {
            const folderName = this.workspacePath.split('\\').pop();
            workspaceName.textContent = folderName;
            workspacePath.textContent = this.workspacePath;
            workspaceInfo.style.display = 'block';
        } else {
            workspaceInfo.style.display = 'none';
        }
    } // 刷新工作文件夹中的文件列表
    async refreshWorkspaceFiles() {
        if (!this.workspacePath) return;

        try {
            const response = await window.electronAPI.listMarkdownFiles(this.workspacePath);

            // 检查IPC调用是否成功
            if (!response.success) {
                throw new Error(response.error || '获取文件列表失败');
            }

            const result = response.data;
            // 确保result和files都存在
            if (result && result.files && Array.isArray(result.files)) {
                this.workspaceFiles = result.files;
            } else {
                this.workspaceFiles = [];
                console.warn('获取文件列表返回数据格式异常:', result);
            }
            this.renderFilesList();
        } catch (error) {
            console.error('刷新文件列表失败:', error);
            this.workspaceFiles = []; // 确保出错时也有默认值
            this.renderFilesList();
            this.showNotification('刷新失败', '无法读取文件夹内容');
        }
    } // 渲染文件列表
    renderFilesList() {
        // 确保workspaceFiles是数组
        if (!Array.isArray(this.workspaceFiles)) {
            this.workspaceFiles = [];
        }

        if (this.workspacePath && this.workspaceFiles.length >= 0) {
            this.renderWorkspaceFiles();
        } else {
            this.renderMemoryNotes();
        }
    }

    // 渲染工作区文件
    renderWorkspaceFiles() {
        const container = document.getElementById('notes-list');
        if (!container) return;

        container.innerHTML = '';

        if (this.workspaceFiles.length === 0) {
            container.innerHTML = '<div class="no-files">文件夹中没有Markdown文件</div>';
            return;
        }

        this.workspaceFiles.forEach(file => {
            if (!file.isDirectory) {
                const element = this.createFileListItem(file);
                container.appendChild(element);
            }
        });
    } // 渲染内存中的笔记（原有功能）
    renderMemoryNotes() {
        const container = document.getElementById('notes-list');
        if (!container) return;

        container.innerHTML = '';

        // 确保notes是数组
        if (!Array.isArray(this.appState.notes)) {
            this.appState.notes = [];
        }

        if (this.appState.notes.length === 0) {
            container.innerHTML = '<div class="no-files">暂无笔记</div>';
            return;
        }

        this.appState.notes.forEach(note => {
            const element = this.createNoteListItem(note);
            container.appendChild(element);
        });
    }

    // 创建文件列表项
    createFileListItem(file) {
        const div = document.createElement('div');
        div.className = `note-item ${this.isCurrentFile(file) ? 'active' : ''}`;
        div.dataset.path = file.path;

        const fileName = file.name.replace(/\.(md|markdown)$/i, '');

        div.innerHTML = `
            <div class="note-content">
                <div class="note-title">📄 ${this.escapeHtml(fileName)}</div>
                <div class="note-date">${this.formatDate(file.lastModified)}</div>
                <div class="note-file-path" title="${file.path}">${file.path}</div>
            </div>
            <div class="note-item-actions">
                <button class="delete-btn" title="删除文件">🗑️</button>
            </div>
        `;

        div.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                this.openWorkspaceFile(file);
            }
        });

        // 删除按钮事件
        const deleteBtn = div.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteWorkspaceFile(file);
        });

        return div;
    }

    // 创建内存笔记列表项
    createNoteListItem(note) {
        const div = document.createElement('div');
        div.className = `note-item ${this.appState.currentNote?.id === note.id ? 'active' : ''}`;
        div.dataset.id = note.id;

        div.innerHTML = `
            <div class="note-content">
                <div class="note-title">${this.escapeHtml(note.title)}</div>
                <div class="note-date">${this.formatDate(note.updatedAt)}</div>
            </div>
            <div class="note-item-actions">
                <button class="delete-btn" title="删除笔记">🗑️</button>
            </div>
        `;

        div.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                this.selectNote(note.id);
            }
        });

        // 删除按钮事件
        const deleteBtn = div.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.app.showDeleteConfirmDialog({
                title: '删除笔记',
                itemName: note.title,
                itemType: '笔记',
                onConfirm: () => {
                    this.deleteNote(note.id);
                }
            });
        });

        return div;
    }

    // 检查是否为当前打开的文件
    isCurrentFile(file) {
        return this.currentFilePath === file.path;
    } // 打开工作区文件
    async openWorkspaceFile(file) {
        try {
            const response = await window.electronAPI.readFile(file.path);

            // 检查IPC调用是否成功
            if (!response.success) {
                throw new Error(response.error || '读取文件失败');
            }

            const fileData = response.data;
            this.currentFilePath = file.path;
            document.getElementById('markdown-editor').value = fileData.content;

            // 更新文件列表选中状态
            this.renderFilesList();

            // 如果是预览模式，更新预览
            if (this.currentMode === 'preview') {
                this.updatePreview();
            }

            this.showSaveStatus('✅ 已保存');

        } catch (error) {
            console.error('打开文件失败:', error);
            this.showNotification('打开失败', `无法打开文件: ${file.name}`);
        }
    }

    // 选择内存笔记
    selectNote(noteId) {
        const note = this.appState.notes.find(n => n.id === noteId);
        if (note) {
            this.appState.currentNote = note;
            this.currentFilePath = null; // 清除文件路径，表示这是内存笔记
            document.getElementById('markdown-editor').value = note.content;
            this.renderFilesList();

            if (this.currentMode === 'preview') {
                this.updatePreview();
            }
        }
    }

    // 创建新笔记
    createNewNote() {
        if (this.workspacePath) {
            this.createNewFileInWorkspace();
        } else {
            this.createNewMemoryNote();
        }
    }

    // 在工作文件夹中创建新文件
    async createNewFileInWorkspace() {
        if (!this.workspacePath) {
            this.showNotification('错误', '请先选择工作文件夹');
            return;
        }

        const fileName = prompt('请输入文件名（不需要扩展名）：', '新建笔记');
        if (!fileName) return;

        const safeName = fileName.replace(/[<>:"/\\|?*]/g, '_');
        const filePath = `${this.workspacePath}\\${safeName}.md`;

        try {
            // 检查文件是否已存在
            const exists = this.workspaceFiles.some(file => file.path === filePath);
            if (exists) {
                this.showNotification('错误', '同名文件已存在');
                return;
            } // 创建新文件
            const initialContent = `# ${fileName}\n\n`;
            const response = await window.electronAPI.writeFile(filePath, initialContent);

            // 检查IPC调用是否成功
            if (!response.success) {
                throw new Error(response.error || '创建文件失败');
            }

            // 刷新工作区文件列表
            await this.refreshWorkspaceFiles();

            // 打开新创建的文件
            const fileInfo = this.workspaceFiles.find(file => file.path === filePath);
            if (fileInfo) {
                await this.openWorkspaceFile(fileInfo);
            }

            this.showNotification('创建成功', `文件已创建: ${safeName}.md`);
        } catch (error) {
            console.error('创建文件失败:', error);
            this.showNotification('创建失败', error.message || '无法创建文件');
        }
    }

    // 创建内存笔记
    createNewMemoryNote() {
        const note = {
            id: Date.now(),
            title: '新建笔记',
            content: '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.appState.notes.unshift(note);
        this.appState.currentNote = note;
        this.currentFilePath = null;
        this.appState.saveData();

        document.getElementById('markdown-editor').value = note.content;
        this.renderFilesList();

        // 聚焦到编辑器
        document.getElementById('markdown-editor').focus();
        this.showNotification('笔记创建成功', '新笔记已创建');
    }

    // 自动保存当前笔记
    autoSaveCurrentNote() {
        const content = document.getElementById('markdown-editor').value;

        if (this.currentFilePath) {
            // 保存到工作区文件
            this.saveToWorkspaceFile(content);
        } else if (this.appState.currentNote) {
            // 保存到内存笔记
            this.saveMemoryNote(content);
        }

        this.showSaveStatus('✅ 已保存');
    } // 保存到工作区文件
    async saveToWorkspaceFile(content) {
        if (!this.currentFilePath) return;

        try {
            const response = await window.electronAPI.writeFile(this.currentFilePath, content);

            // 检查IPC调用是否成功
            if (!response.success) {
                throw new Error(response.error || '保存文件失败');
            }

            // 刷新文件列表以更新修改时间
            if (this.workspacePath) {
                await this.refreshWorkspaceFiles();
            }
        } catch (error) {
            console.error('保存文件失败:', error);
            this.showNotification('保存失败', error.message || '无法保存文件');
        }
    }

    // 保存内存笔记
    saveMemoryNote(content) {
        if (!this.appState.currentNote) return;

        const firstLine = content.split('\n')[0];
        const title = firstLine.replace(/^#+\s*/, '') || '无标题笔记';

        this.appState.currentNote.content = content;
        this.appState.currentNote.title = title.substring(0, 50);
        this.appState.currentNote.updatedAt = new Date();

        this.appState.saveData();
        this.renderFilesList();
    }

    // 删除工作区文件
    async deleteWorkspaceFile(file) {
        const confirmed = confirm(`确定要删除文件吗？\n${file.name}\n\n此操作不可撤销！`);
        if (!confirmed) return;

        try {
            // 这里需要添加删除文件的API，暂时提示用户手动删除
            this.showNotification('删除功能', '请在文件管理器中手动删除文件');

            // 如果删除的是当前文件，清空编辑器
            if (this.isCurrentFile(file)) {
                this.currentFilePath = null;
                document.getElementById('markdown-editor').value = '';
                const preview = document.getElementById('markdown-preview');
                if (preview) {
                    preview.innerHTML = '<p class="no-content">请选择一个文件开始编辑</p>';
                }
            }

            // 刷新文件列表
            await this.refreshWorkspaceFiles();

        } catch (error) {
            console.error('删除文件失败:', error);
            this.showNotification('删除失败', error.message || '无法删除文件');
        }
    }

    // 删除内存笔记
    deleteNote(noteId) {
        const noteIndex = this.appState.notes.findIndex(n => n.id === noteId);
        if (noteIndex === -1) return;

        const deletedNote = this.appState.notes[noteIndex];
        this.appState.notes.splice(noteIndex, 1);

        // 如果删除的是当前编辑的笔记，需要处理编辑器状态
        if (this.appState.currentNote && this.appState.currentNote.id === noteId) {
            if (this.appState.notes.length > 0) {
                const nextNote = this.appState.notes[Math.min(noteIndex, this.appState.notes.length - 1)];
                this.appState.currentNote = nextNote;
                document.getElementById('markdown-editor').value = nextNote.content;
            } else {
                this.appState.currentNote = null;
                document.getElementById('markdown-editor').value = '';
                const preview = document.getElementById('markdown-preview');
                if (preview) {
                    preview.innerHTML = '<p class="no-content">请选择或创建一个笔记开始编辑</p>';
                }
            }
        }

        this.appState.saveData();
        this.renderFilesList();
        this.showNotification('删除成功', `笔记 "${deletedNote.title}" 已删除`);
    }

    // 显示保存状态
    showSaveStatus(status) {
        const indicator = document.querySelector('.save-indicator');
        if (indicator) {
            indicator.textContent = status;

            if (status === '正在保存...') {
                indicator.parentElement.classList.add('saving');
            } else {
                indicator.parentElement.classList.remove('saving');

                if (status === '✅ 已保存') {
                    setTimeout(() => {
                        if (indicator.textContent === '✅ 已保存') {
                            indicator.textContent = '✅ 已保存';
                        }
                    }, 3000);
                }
            }
        }
    }

    // 切换预览模式
    togglePreview() {
        const editor = document.getElementById('markdown-editor');
        const preview = document.getElementById('markdown-preview');
        const toggleBtn = document.getElementById('toggle-preview');

        if (this.currentMode === 'edit') {
            this.currentMode = 'preview';
            editor.style.display = 'none';
            preview.style.display = 'block';
            toggleBtn.textContent = '✏️ 编辑';
            this.updatePreview();
        } else {
            this.currentMode = 'edit';
            editor.style.display = 'block';
            preview.style.display = 'none';
            toggleBtn.textContent = '👁️ 预览';
        }
    }

    // 切换侧边栏
    toggleSidebar() {
        const sidebar = document.querySelector('.notes-sidebar');
        const toggleBtn = document.getElementById('toggle-sidebar');

        if (sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            toggleBtn.textContent = '📁';
            toggleBtn.title = '收起侧边栏';
        } else {
            sidebar.classList.add('collapsed');
            toggleBtn.textContent = '📂';
            toggleBtn.title = '展开侧边栏';
        }
    }

    // 更新预览内容
    updatePreview() {
        const content = document.getElementById('markdown-editor').value;
        const preview = document.getElementById('markdown-preview');
        if (preview) {
            preview.innerHTML = this.renderMarkdown(content);
        }
    }

    // 简化的Markdown渲染器
    renderMarkdown(content) {
        if (!content) return '<p class="no-content">暂无内容</p>';

        let html = content
            // 标题
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // 粗体
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            // 斜体
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            // 代码块
            .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
            // 行内代码
            .replace(/`([^`]+)`/gim, '<code>$1</code>')
            // 链接
            .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
            // 图片 - 支持本地文件路径
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, (match, alt, src) => {
                // 如果是相对路径且当前编辑的是工作区文件，解析相对路径
                if (this.currentFilePath && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('/')) {
                    const noteDir = this.currentFilePath.substring(0, this.currentFilePath.lastIndexOf('\\'));
                    const fullPath = `${noteDir}\\${src.replace(/\//g, '\\')}`;
                    return `<img alt="${alt}" src="file:///${fullPath}" style="max-width: 100%; height: auto;" />`;
                }
                return `<img alt="${alt}" src="${src}" style="max-width: 100%; height: auto;" />`;
            })
            // 引用
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            // 无序列表
            .replace(/^[\*\-] (.*$)/gim, '<ul><li>$1</li></ul>')
            // 有序列表
            .replace(/^(\d+)\. (.*$)/gim, '<ol><li>$2</li></ol>')
            // 换行
            .replace(/\n/gim, '<br>');

        return html;
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('zh-CN');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(title, body) {
        if (window.electronAPI && window.electronAPI.showNotification) {
            window.electronAPI.showNotification(title, body);
        }
    }
}

// 主题管理器
class ThemeManager {
    constructor(appState) {
        this.appState = appState;
        this.init();
    }

    init() {
        this.applyTheme(this.appState.settings.theme);
        this.applyGlassEffect(this.appState.settings.glassEffect);
    }

    applyTheme(theme) {
        document.body.dataset.theme = theme;

        // 更新CSS变量
        const root = document.documentElement;

        switch (theme) {
            case 'dark':
                root.style.setProperty('--bg-primary', 'rgba(30, 30, 30, 0.95)');
                root.style.setProperty('--bg-secondary', 'rgba(40, 40, 40, 0.9)');
                root.style.setProperty('--bg-glass', 'rgba(0, 0, 0, 0.2)');
                root.style.setProperty('--text-primary', '#ffffff');
                root.style.setProperty('--text-secondary', '#b0b0b0');
                root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)');
                break;
            case 'blue':
                root.style.setProperty('--primary-color', '#0078d4');
                root.style.setProperty('--bg-primary', 'rgba(240, 248, 255, 0.95)');
                break;
            case 'green':
                root.style.setProperty('--primary-color', '#107c10');
                root.style.setProperty('--bg-primary', 'rgba(240, 255, 240, 0.95)');
                break;
            default: // light
                root.style.setProperty('--bg-primary', 'rgba(255, 255, 255, 0.95)');
                root.style.setProperty('--bg-secondary', 'rgba(248, 249, 250, 0.9)');
                root.style.setProperty('--bg-glass', 'rgba(255, 255, 255, 0.1)');
                root.style.setProperty('--text-primary', '#333');
                root.style.setProperty('--text-secondary', '#6c757d');
                root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.1)');
                root.style.setProperty('--primary-color', '#007acc');
        }
    }

    applyGlassEffect(enabled) {
        if (enabled) {
            document.body.classList.add('glass-effect');
        } else {
            document.body.classList.remove('glass-effect');
        }
    }
}

// 应用主类
class App {
    constructor() {
        this.state = new AppState();
        // 将实例赋值给全局变量，以便其他类可以访问统一的删除确认对话框
        window.app = this;
        // 标记是否是第一次访问社区页面
        this.isFirstCommunityVisit = true;
        this.init();
    }

    async init() {
        // 加载数据
        await this.state.loadData();

        // 初始化管理器
        this.clipboardManager = new ClipboardManager(this.state);
        this.todoManager = new TodoManager(this.state);
        this.pomodoroManager = new PomodoroManager(this.state);
        this.notesManager = new NotesManager(this.state);
        this.themeManager = new ThemeManager(this.state);

        // 设置事件监听器
        this.setupEventListeners();

        // 初始化UI
        this.initializeUI();
    }

    setupEventListeners() {
        // 标题栏控制
        document.getElementById('minimize-btn').addEventListener('click', () => {
            window.electronAPI.minimizeWindow();
        });
        document.getElementById('close-btn').addEventListener('click', () => {
            window.electronAPI.closeWindow();
        });

        // 选项卡切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 剪切板搜索
        document.getElementById('clipboard-search').addEventListener('input', (e) => {
            this.searchClipboard(e.target.value);
        }); // 清理剪切板按钮
        document.getElementById('clear-clipboard').addEventListener('click', () => {
            this.clipboardManager.clearClipboard();
        }); // 设置项监听
        this.setupSettingsListeners(); // 社区面板监听器
        this.setupCommunityListeners();
    }

    setupSettingsListeners() {
        // 主题选择
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.state.settings.theme = e.target.value;
                this.state.saveData();
                this.themeManager.applyTheme(e.target.value);
            });
        }

        // 毛玻璃效果
        const glassEffect = document.getElementById('glass-effect');
        if (glassEffect) {
            glassEffect.addEventListener('change', (e) => {
                this.state.settings.glassEffect = e.target.checked;
                this.state.saveData();
                this.themeManager.applyGlassEffect(e.target.checked);
            });
        }

        // 自启动
        const autoStart = document.getElementById('auto-start');
        if (autoStart) {
            autoStart.addEventListener('change', async (e) => {
                this.state.settings.autoStart = e.target.checked;
                this.state.saveData();
                if (window.electronAPI && window.electronAPI.setAutoStart) {
                    await window.electronAPI.setAutoStart(e.target.checked);
                }
            });
        }

        // 剪切板监控
        const clipboardMonitor = document.getElementById('clipboard-monitor');
        if (clipboardMonitor) {
            clipboardMonitor.addEventListener('change', (e) => {
                this.state.settings.clipboardMonitor = e.target.checked;
                this.state.saveData();
                if (window.electronAPI && window.electronAPI.setClipboardMonitor) {
                    window.electronAPI.setClipboardMonitor(e.target.checked);
                }
            });
        }

        // 剪切板历史数量
        const maxClipboardItems = document.getElementById('max-clipboard-items');
        if (maxClipboardItems) {
            maxClipboardItems.addEventListener('change', (e) => {
                this.state.settings.maxClipboardItems = parseInt(e.target.value) || 50;
                this.state.saveData();
            });
        }

        // 检查更新
        const checkUpdates = document.getElementById('check-updates');
        if (checkUpdates) {
            checkUpdates.addEventListener('click', () => {
                this.checkUpdates();
            });
        }

        // 社区URL设置
        const communityUrl = document.getElementById('community-url');
        const applyCommunityUrl = document.getElementById('apply-community-url');
        const urlPreset = document.getElementById('url-preset');

        if (communityUrl && applyCommunityUrl) {
            applyCommunityUrl.addEventListener('click', () => {
                const newUrl = communityUrl.value.trim();

                if (!newUrl) {
                    alert('请输入有效的URL');
                    return;
                }

                if (!this.isValidUrl(newUrl)) {
                    alert('请输入有效的URL格式（包含 http:// 或 https://）');
                    return;
                }

                // 保存到设置
                this.state.settings.communityUrl = newUrl;
                this.state.saveData();

                // 更新webview
                this.updateCommunityUrl(newUrl);

                // 更新预设选择框
                this.updateUrlPresetSelection(newUrl);

                // 显示成功提示
                this.showUrlUpdateSuccess();
            });
        }

        if (urlPreset) {
            urlPreset.addEventListener('change', (e) => {
                const selectedUrl = e.target.value;
                if (selectedUrl && selectedUrl !== 'custom' && communityUrl) {
                    communityUrl.value = selectedUrl;

                    // 自动应用预设URL
                    this.state.settings.communityUrl = selectedUrl;
                    this.state.saveData();
                    this.updateCommunityUrl(selectedUrl);
                    this.showUrlUpdateSuccess();
                }
            });
        }
    }

    setupCommunityListeners() {
        // 这个方法在初始化时调用，但社区面板可能还没有渲染
        // 实际的事件监听器会在 setupCommunityPanelListeners 中设置
    }

    setupCommunityPanelListeners() {
        // 刷新社区页面
        const refreshBtn = document.getElementById('refresh-community');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('刷新按钮被点击');
                this.refreshCommunity();
            });
        }

        // 在外部浏览器打开社区
        const externalBtn = document.getElementById('open-external-community');
        if (externalBtn) {
            externalBtn.addEventListener('click', () => {
                console.log('外部链接按钮被点击');
                this.openExternalCommunity();
            });
        }
    }

    async initializeUI() {
        // 设置版本号
        try {
            const version = await window.electronAPI.getAppVersion();
            document.getElementById('app-version').textContent = version;
        } catch (error) {
            console.error('Failed to get app version:', error);
        } // 应用设置
        document.getElementById('theme-select').value = this.state.settings.theme;
        document.getElementById('glass-effect').checked = this.state.settings.glassEffect;
        document.getElementById('auto-start').checked = this.state.settings.autoStart;
        document.getElementById('clipboard-monitor').checked = this.state.settings.clipboardMonitor;
        document.getElementById('max-clipboard-items').value = this.state.settings.maxClipboardItems;

        // 设置社区URL
        const communityUrlInput = document.getElementById('community-url');
        if (communityUrlInput && this.state.settings.communityUrl) {
            communityUrlInput.value = this.state.settings.communityUrl;
        }

        // 初始化社区webview URL
        this.initializeCommunityWebview();

        // 应用主题
        this.themeManager.applyTheme(this.state.settings.theme); // 渲染数据
        this.clipboardManager.renderClipboardList();
        this.todoManager.renderTodoList();
        this.notesManager.renderFilesList();
    }
    switchTab(tabName) {
        // 更新选项卡按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // 显示对应面板
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-panel`);
        });

        // 特殊处理社区选项卡
        if (tabName === 'community') {
            this.handleCommunityTab();
        }
    }
    handleCommunityTab() {
        const webview = document.getElementById('community-webview');
        const loading = document.getElementById('community-loading');

        if (!webview || !loading) return;

        // 设置社区面板的事件监听器（如果还没设置）
        if (!webview.dataset.buttonListenersAdded) {
            this.setupCommunityPanelListeners();
            webview.dataset.buttonListenersAdded = 'true';
        }

        // 如果webview已经有监听器，就不重复添加
        if (webview.dataset.listenersAdded) {
            // 检查webview是否已经加载完成
            try {
                if (webview.getWebContents && webview.getWebContents()) {
                    loading.classList.add('hidden');
                    return;
                }
            } catch (e) {
                // webview可能还没准备好
            }
            return;
        }

        // 显示加载状态
        loading.classList.remove('hidden');

        // 监听webview加载完成
        const handleDomReady = () => {
            console.log('社区页面DOM加载完成');
            setTimeout(() => {
                loading.classList.add('hidden');
            }, 500); // 延迟隐藏加载动画，确保页面完全加载
        };

        const handleLoadStart = () => {
            console.log('社区页面开始加载');
            loading.classList.remove('hidden');
        };

        const handleLoadStop = () => {
            console.log('社区页面加载停止');
            // 使用setTimeout确保页面内容已渲染
            setTimeout(() => {
                loading.classList.add('hidden');
            }, 300);
        };

        const handleLoadCommit = () => {
            console.log('社区页面加载提交');
        };

        // 监听加载失败
        const handleLoadFail = (event) => {
            console.error('社区页面加载失败:', event);
            loading.innerHTML = `
                <div class="loading-spinner">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <span>页面加载失败</span>
                    <br>
                    <button onclick="app.refreshCommunity()" 
                            style="margin-top: 16px; padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        重新加载
                    </button>
                </div>
            `;
            loading.classList.remove('hidden');
        };

        // 添加事件监听器
        webview.addEventListener('dom-ready', handleDomReady);
        webview.addEventListener('did-start-loading', handleLoadStart);
        webview.addEventListener('did-stop-loading', handleLoadStop);
        webview.addEventListener('did-finish-load', handleLoadStop); // 备用事件
        webview.addEventListener('did-fail-load', handleLoadFail);
        webview.addEventListener('loadcommit', handleLoadCommit);

        // 标记已添加监听器
        webview.dataset.listenersAdded = 'true';

        // 如果webview还没有src，设置它
        if (!webview.src) {
            webview.src = 'http://8.130.41.186:3000/';
        } else {
            // 如果已经有src但页面可能已经加载完成，手动检查
            setTimeout(() => {
                try {
                    if (webview.getWebContents && webview.getWebContents()) {
                        loading.classList.add('hidden');
                    }
                } catch (e) {
                    // 页面可能还在加载
                }
            }, 1000);
        }

        // 设置一个超时，如果15秒后还在加载，显示错误信息
        setTimeout(() => {
            if (!loading.classList.contains('hidden')) {
                console.warn('社区页面加载超时');
                loading.innerHTML = `
                    <div class="loading-spinner">
                        <div style="font-size: 48px; margin-bottom: 16px;">⏱️</div>
                        <span>页面加载超时</span>
                        <br>
                        <button onclick="app.refreshCommunity()" 
                                style="margin-top: 16px; padding: 8px 16px; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                            重新加载
                        </button>
                        <button onclick="app.openExternalCommunity()" 
                                style="margin-top: 8px; margin-left: 8px; padding: 8px 16px; background: var(--secondary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                            外部打开
                        </button>
                    </div>
                `;
            }
        }, 15000);
    }
    refreshCommunity() {
        const webview = document.getElementById('community-webview');
        const loading = document.getElementById('community-loading');

        if (webview && loading) {
            // 重置加载状态的HTML
            loading.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>正在加载社区页面...</span>
                </div>
            `;
            loading.classList.remove('hidden');

            console.log('刷新社区页面');

            // 重新加载webview
            if (webview.reload) {
                webview.reload();
            } else {
                // 如果reload方法不可用，重新设置src
                const currentSrc = webview.src;
                webview.src = '';
                setTimeout(() => {
                    webview.src = currentSrc || 'http://8.130.41.186:3000/';
                }, 100);
            }
        }
    }
    openExternalCommunity() {
        const url = this.state.settings.communityUrl || 'http://8.130.41.186:3000/';
        if (window.electronAPI && window.electronAPI.openExternal) {
            window.electronAPI.openExternal(url);
        } else {
            // 备用方案
            window.open(url, '_blank');
        }
    }

    searchClipboard(query) {
        const items = document.querySelectorAll('.clipboard-item');
        items.forEach(item => {
            const content = item.querySelector('.clipboard-item-content').textContent;
            const matches = content.toLowerCase().includes(query.toLowerCase());
            item.style.display = matches ? 'block' : 'none';
        });
    }
    async checkUpdates() {
        // 这里可以实现更新检查逻辑
        alert('当前已是最新版本！');
    }

    // URL验证方法
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    // 更新社区页面URL
    updateCommunityUrl(newUrl) {
        const webview = document.getElementById('community-webview');
        if (webview) {
            // 显示加载状态
            const loading = document.getElementById('community-loading');
            if (loading) {
                loading.classList.remove('hidden');
                loading.innerHTML = `
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <span>正在加载新页面...</span>
                    </div>
                `;
            }

            // 更新webview的src属性
            webview.src = newUrl;

            console.log('社区页面URL已更新为:', newUrl);
        }
    } // 显示URL更新成功提示
    showUrlUpdateSuccess() {
        const button = document.getElementById('apply-community-url');
        if (button) {
            const originalText = button.innerHTML;
            button.innerHTML = '<span>✅ 已应用</span>';
            button.style.backgroundColor = 'var(--success-color)';
            button.disabled = true;

            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.backgroundColor = '';
                button.disabled = false;
            }, 2000);
        }
    } // 初始化社区webview
    initializeCommunityWebview() {
        const webview = document.getElementById('community-webview');
        if (webview && this.state.settings.communityUrl) {
            // 只有当webview的src与设置不同时才更新
            if (webview.src !== this.state.settings.communityUrl) {
                webview.src = this.state.settings.communityUrl;
                console.log('社区webview初始化为:', this.state.settings.communityUrl);
            }
        }

        // 渲染预设网站按钮
        this.renderPresetWebsites();
    }

    // 渲染预设网站按钮
    renderPresetWebsites() {
        const container = document.getElementById('preset-websites');
        if (!container) return;

        const onlineConfig = this.state.settings.online;
        if (!onlineConfig || !onlineConfig.showPresetButtons) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        container.innerHTML = '';

        // 添加预设网站按钮
        onlineConfig.presetWebsites.forEach(website => {
            const button = document.createElement('button');
            button.className = 'preset-website-btn';
            button.dataset.url = website.url;
            button.dataset.id = website.id;
            button.title = website.description || website.name;

            // 检查是否为当前激活的网站
            const currentUrl = this.state.settings.online.currentUrl || this.state.settings.communityUrl;
            if (website.url === currentUrl) {
                button.classList.add('active');
            }

            button.innerHTML = `
                <span class="icon">${website.icon || '🌐'}</span>
                <span class="name">${website.name}</span>
            `;

            button.addEventListener('click', () => {
                this.switchToPresetWebsite(website);
            });

            container.appendChild(button);
        });

        // 添加管理预设按钮
        const manageBtn = document.createElement('button');
        manageBtn.className = 'manage-presets-btn';
        manageBtn.title = '管理预设网站';
        manageBtn.innerHTML = '⚙️';
        manageBtn.addEventListener('click', () => {
            this.showPresetWebsitesManager();
        });

        container.appendChild(manageBtn);
    }

    // 切换到预设网站
    switchToPresetWebsite(website) {
        const webview = document.getElementById('community-webview');
        const loading = document.getElementById('community-loading');

        if (!webview) return;

        // 更新当前URL
        this.state.settings.online.currentUrl = website.url;
        this.state.settings.communityUrl = website.url; // 保持兼容性

        // 显示加载状态
        if (loading) {
            loading.classList.remove('hidden');
            loading.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <span>正在加载 ${website.name}...</span>
                </div>
            `;
        }

        // 更新webview URL
        webview.src = website.url;

        // 更新按钮状态
        document.querySelectorAll('.preset-website-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.id === website.id) {
                btn.classList.add('active');
            }
        });

        // 保存设置
        this.state.saveData();

        console.log('切换到预设网站:', website.name, website.url);
    }

    // 显示预设网站管理器
    showPresetWebsitesManager() {
        // 创建模态对话框
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content preset-manager-modal">
                <div class="modal-header">
                    <h3>🌐 管理预设网站</h3>
                    <button class="modal-close-btn">✖️</button>
                </div>
                <div class="modal-body">
                    <div class="preset-list" id="preset-manager-list">
                        <!-- 预设网站列表将在这里生成 -->
                    </div>
                    <div class="preset-actions">
                        <button class="btn btn-primary" id="add-preset-btn">➕ 添加网站</button>
                        <button class="btn btn-secondary" id="reset-presets-btn">🔄 重置默认</button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">取消</button>
                    <button class="btn btn-primary modal-confirm">保存</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.renderPresetManagerList();
        this.setupPresetManagerEvents(modal);
    }

    // 渲染预设管理器列表
    renderPresetManagerList() {
        const list = document.getElementById('preset-manager-list');
        if (!list) return;

        const presets = this.state.settings.online.presetWebsites;
        list.innerHTML = '';

        presets.forEach((preset, index) => {
            const item = document.createElement('div');
            item.className = 'preset-item';
            item.innerHTML = `
                <div class="preset-item-info">
                    <input type="text" class="preset-icon" value="${preset.icon || '🌐'}" maxlength="2" placeholder="图标">
                    <input type="text" class="preset-name" value="${preset.name}" placeholder="网站名称">
                    <input type="url" class="preset-url" value="${preset.url}" placeholder="网站URL">
                    <input type="text" class="preset-description" value="${preset.description || ''}" placeholder="描述（可选）">
                </div>
                <div class="preset-item-actions">
                    <button class="btn btn-sm btn-secondary move-up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn btn-sm btn-secondary move-down" data-index="${index}" ${index === presets.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn btn-sm btn-danger delete-preset" data-index="${index}">🗑️</button>
                </div>
            `;
            list.appendChild(item);
        });
    }

    // 设置预设管理器事件
    setupPresetManagerEvents(modal) {
        // 关闭模态框
        modal.querySelector('.modal-close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.querySelector('.modal-cancel').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // 保存设置
        modal.querySelector('.modal-confirm').addEventListener('click', () => {
            this.savePresetSettings();
            document.body.removeChild(modal);
            this.renderPresetWebsites(); // 重新渲染预设按钮
        });

        // 添加新预设
        modal.querySelector('#add-preset-btn').addEventListener('click', () => {
            this.addNewPreset();
        });

        // 重置默认预设
        modal.querySelector('#reset-presets-btn').addEventListener('click', () => {
            if (confirm('确定要重置为默认预设网站吗？这将清除所有自定义设置。')) {
                this.resetDefaultPresets();
            }
        });

        // 设置列表项事件委托
        modal.querySelector('#preset-manager-list').addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);

            if (e.target.classList.contains('move-up')) {
                this.movePreset(index, -1);
            } else if (e.target.classList.contains('move-down')) {
                this.movePreset(index, 1);
            } else if (e.target.classList.contains('delete-preset')) {
                if (confirm('确定要删除这个预设网站吗？')) {
                    this.deletePreset(index);
                }
            }
        });
    }

    // 添加新预设
    addNewPreset() {
        const newPreset = {
            id: 'custom_' + Date.now(),
            name: '新网站',
            url: 'https://example.com',
            icon: '🌐',
            description: ''
        };

        this.state.settings.online.presetWebsites.push(newPreset);
        this.renderPresetManagerList();
    }

    // 移动预设位置
    movePreset(index, direction) {
        const presets = this.state.settings.online.presetWebsites;
        const newIndex = index + direction;

        if (newIndex >= 0 && newIndex < presets.length) {
            [presets[index], presets[newIndex]] = [presets[newIndex], presets[index]];
            this.renderPresetManagerList();
        }
    }

    // 删除预设
    deletePreset(index) {
        this.state.settings.online.presetWebsites.splice(index, 1);
        this.renderPresetManagerList();
    }

    // 重置默认预设
    resetDefaultPresets() {
        this.state.settings.online.presetWebsites = [{
                id: 'default',
                name: '移记社区',
                url: 'http://8.130.41.186:3000/',
                icon: '🏠',
                description: '默认社区页面'
            },
            {
                id: 'github',
                name: 'GitHub',
                url: 'https://github.com',
                icon: '📁',
                description: '代码托管平台'
            },
            {
                id: 'stackoverflow',
                name: 'Stack Overflow',
                url: 'https://stackoverflow.com',
                icon: '❓',
                description: '编程问答社区'
            },
            {
                id: 'chatgpt',
                name: 'ChatGPT',
                url: 'https://chat.openai.com',
                icon: '🤖',
                description: 'AI 助手'
            },
            {
                id: 'translate',
                name: '谷歌翻译',
                url: 'https://translate.google.com',
                icon: '🌐',
                description: '在线翻译工具'
            }
        ];
        this.renderPresetManagerList();
    }

    // 保存预设设置
    savePresetSettings() {
        const items = document.querySelectorAll('.preset-item');
        const newPresets = [];

        items.forEach((item, index) => {
            const icon = item.querySelector('.preset-icon').value.trim();
            const name = item.querySelector('.preset-name').value.trim();
            const url = item.querySelector('.preset-url').value.trim();
            const description = item.querySelector('.preset-description').value.trim();

            if (name && url) {
                newPresets.push({
                    id: this.state.settings.online.presetWebsites[index] ?.id || `custom_${Date.now()}_${index}`,
                    name,
                    url,
                    icon: icon || '🌐',
                    description
                });
            }
        });

        this.state.settings.online.presetWebsites = newPresets;
        this.state.saveData();
    }

    // 通用删除确认对话框
    showDeleteConfirmDialog(options) {
        const {
            title = '确认删除',
                message,
                itemName,
                itemType = '项目',
                onConfirm,
                confirmText = '🗑️ 删除',
                cancelText = '取消'
        } = options;

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content delete-confirm-modal">
                <div class="modal-header">
                    <h3>⚠️ ${title}</h3>
                    <button class="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <div class="warning-text">⚠️ 此操作无法撤销！</div>
                    <div class="delete-info">
                        ${message || `您确定要删除${itemType} ${itemName ? `<strong>"${this.escapeHtml(itemName)}"</strong>` : ''} 吗？`}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-delete">${cancelText}</button>
                    <button class="btn btn-danger" id="confirm-delete">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 添加事件监听
        const closeModal = () => {
            if (modal.parentNode) {
                document.body.removeChild(modal);
            }
        };

        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.querySelector('#cancel-delete').addEventListener('click', closeModal);

        modal.querySelector('#confirm-delete').addEventListener('click', () => {
            if (onConfirm && typeof onConfirm === 'function') {
                onConfirm();
            }
            closeModal();
        });

        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        return modal;
    }

    // HTML转义工具方法
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 显示图片预览
     */
    showImagePreview(imageData) {
        const modal = document.createElement('div');
        modal.className = 'image-preview-modal';
        modal.innerHTML = `
            <button class="image-preview-close">&times;</button>
            <img src="${imageData}" alt="图片预览" class="image-preview-content">
        `;

        document.body.appendChild(modal);

        // 关闭预览
        const closePreview = () => {
            if (modal.parentNode) {
                document.body.removeChild(modal);
            }
        };

        // 点击关闭按钮
        modal.querySelector('.image-preview-close').addEventListener('click', closePreview);

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePreview();
            }
        });

        // ESC键关闭
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closePreview();
                document.removeEventListener('keydown', handleKeydown);
            }
        };
        document.addEventListener('keydown', handleKeydown);
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM已加载，启动应用...');

    // 创建应用实例并启动
    window.app = new App();

    console.log('应用启动完成');
});

// 监听页面卸载，清理资源
window.addEventListener('beforeunload', () => {
    if (window.app && window.app.state) {
        // 保存应用状态
        window.app.state.saveData();
    }
});

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('应用发生错误:', event.error);

    // 如果有通知API，显示错误通知
    if (window.electronAPI && window.electronAPI.showNotification) {
        window.electronAPI.showNotification('应用错误', '应用发生了意外错误，请检查控制台');
    }
});

// 全局未处理Promise rejection处理
window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise rejection:', event.reason);

    // 防止错误传播到控制台（可选）
    event.preventDefault();
});