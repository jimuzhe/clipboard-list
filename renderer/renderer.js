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
            maxClipboardItems: 100
        };
        this.pomodoroTimer = {
            workDuration: 25,
            breakDuration: 5,
            currentTime: 25 * 60,
            isRunning: false,
            isWork: true
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
                settings: this.settings
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

            this.lastClipboardContent = clipboardItem.content;

            // 转换为渲染进程的格式
            const item = {
                id: clipboardItem.id || Date.now(),
                content: clipboardItem.content,
                type: clipboardItem.type || 'text',
                timestamp: clipboardItem.timestamp ? new Date(clipboardItem.timestamp) : new Date(),
                pinned: clipboardItem.isPinned || false
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
    }    renderClipboardList() {
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
    }    createClipboardItemElement(item) {
        const div = document.createElement('div');
        div.className = `clipboard-item ${item.pinned ? 'pinned' : ''}`;
        div.dataset.id = item.id;

        const typeIcon = this.getTypeIcon(item.type);
        const timeAgo = this.formatTimeAgo(item.timestamp);

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
      <div class="clipboard-item-content" data-full-content="${this.escapeHtml(item.content)}">${this.escapeHtml(item.content)}</div>
      <div class="clipboard-item-time">${timeAgo}${item.pinned ? ' • 已置顶' : ''}</div>
    `;

        // 添加事件监听器
        this.addClipboardItemEventListeners(div, item);

        return div;
    }

    addClipboardItemEventListeners(element, item) {
        // 点击复制
        element.addEventListener('click', (e) => {
            if (!e.target.classList.contains('control-btn')) {
                this.copyToClipboard(item.content);
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
            this.copyToClipboard(item.content);
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

    async copyToClipboard(content) {
        try {
            await window.electronAPI.writeToClipboard(content);
            this.showNotification('复制成功', '内容已复制到剪切板');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showNotification('复制失败', '无法复制到剪切板');
        }
    }    togglePin(itemId) {
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
    }editClipboardItem(itemId) {
        const item = this.appState.clipboardItems.find(item => item.id === itemId);
        if (item) {
            this.showEditModal(item);
        }
    }

    showEditModal(item) {
        // 创建编辑模态框
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content edit-modal">
                <div class="modal-header">
                    <h3>编辑剪切板内容</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>内容类型：</label>
                        <select id="edit-content-type">
                            <option value="text" ${item.type === 'text' ? 'selected' : ''}>文本</option>
                            <option value="code" ${item.type === 'code' ? 'selected' : ''}>代码</option>
                            <option value="url" ${item.type === 'url' ? 'selected' : ''}>链接</option>
                            <option value="email" ${item.type === 'email' ? 'selected' : ''}>邮箱</option>
                            <option value="image" ${item.type === 'image' ? 'selected' : ''}>图片</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>内容：</label>
                        <textarea id="edit-content" rows="6" placeholder="输入内容...">${item.content}</textarea>
                    </div>
                    <div class="form-group checkbox-group">
                        <label>
                            <input type="checkbox" id="edit-pinned" ${item.pinned ? 'checked' : ''}>
                            置顶显示
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-edit">取消</button>
                    <button class="btn btn-primary" id="save-edit">保存</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

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
        if (confirm('确定要删除这个剪切板项目吗？')) {
            this.appState.clipboardItems = this.appState.clipboardItems.filter(item => item.id !== itemId);
            this.appState.saveData();
            this.renderClipboardList();
        }
    }

    clearClipboard() {
        if (confirm('确定要清空剪切板历史吗？')) {
            this.appState.clipboardItems = [];
            this.appState.saveData();
            this.renderClipboardList();
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
            this.showTodoInput();
        });

        // 保存待办按钮
        document.getElementById('save-todo').addEventListener('click', () => {
            this.saveTodo();
        });

        // 取消按钮
        document.getElementById('cancel-todo').addEventListener('click', () => {
            this.hideTodoInput();
        });

        // 筛选器
        document.getElementById('todo-filter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.renderTodoList();
        });
    }

    showTodoInput() {
        document.getElementById('todo-input-area').style.display = 'block';
        document.getElementById('todo-title').focus();
    }

    hideTodoInput() {
        document.getElementById('todo-input-area').style.display = 'none';
        this.clearTodoInput();
    }

    clearTodoInput() {
        document.getElementById('todo-title').value = '';
        document.getElementById('todo-description').value = '';
        document.getElementById('todo-priority').value = 'medium';
    }

    saveTodo() {
        const title = document.getElementById('todo-title').value.trim();
        if (!title) {
            alert('请输入待办事项标题');
            return;
        }

        const todo = {
            id: Date.now(),
            title,
            description: document.getElementById('todo-description').value.trim(),
            priority: document.getElementById('todo-priority').value,
            completed: false,
            createdAt: new Date(),
            completedAt: null
        };

        this.appState.todoItems.unshift(todo);
        this.appState.saveData();
        this.renderTodoList();
        this.hideTodoInput();
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
            const newTitle = prompt('编辑标题：', todo.title);
            if (newTitle !== null && newTitle.trim()) {
                todo.title = newTitle.trim();
                const newDescription = prompt('编辑描述：', todo.description || '');
                if (newDescription !== null) {
                    todo.description = newDescription.trim();
                }
                this.appState.saveData();
                this.renderTodoList();
            }
        }
    }

    deleteTodo(todoId) {
        if (confirm('确定要删除这个待办事项吗？')) {
            this.appState.todoItems = this.appState.todoItems.filter(item => item.id !== todoId);
            this.appState.saveData();
            this.renderTodoList();
        }
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
        modal.classList.add('active');

        // 设置当前任务
        document.querySelector('.modal-header h3').textContent = `🍅 ${todo.title}`;
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
        return new Date(date).toLocaleDateString('zh-CN');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 番茄时钟管理器
class PomodoroManager {
    constructor(appState) {
        this.appState = appState;
        this.timer = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        document.getElementById('pomodoro-start').addEventListener('click', () => {
            this.start();
        });

        document.getElementById('pomodoro-pause').addEventListener('click', () => {
            this.pause();
        });

        document.getElementById('pomodoro-reset').addEventListener('click', () => {
            this.reset();
        });

        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        // 设置变化监听
        document.getElementById('work-duration').addEventListener('change', (e) => {
            this.appState.pomodoroTimer.workDuration = parseInt(e.target.value);
            if (this.appState.pomodoroTimer.isWork && !this.appState.pomodoroTimer.isRunning) {
                this.reset();
            }
        });

        document.getElementById('break-duration').addEventListener('change', (e) => {
            this.appState.pomodoroTimer.breakDuration = parseInt(e.target.value);
            if (!this.appState.pomodoroTimer.isWork && !this.appState.pomodoroTimer.isRunning) {
                this.reset();
            }
        });
    }

    start() {
        this.appState.pomodoroTimer.isRunning = true;
        this.timer = setInterval(() => {
            this.tick();
        }, 1000);
        this.updateButtons();
    }

    pause() {
        this.appState.pomodoroTimer.isRunning = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.updateButtons();
    }

    reset() {
        this.pause();
        const timer = this.appState.pomodoroTimer;
        timer.currentTime = timer.isWork ? timer.workDuration * 60 : timer.breakDuration * 60;
        this.updateDisplay();
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
            this.showNotification('工作完成！', '是时候休息一下了');
            timer.isWork = false;
            timer.currentTime = timer.breakDuration * 60;
        } else {
            this.showNotification('休息结束！', '开始新的工作周期');
            timer.isWork = true;
            timer.currentTime = timer.workDuration * 60;
        }

        this.updateDisplay();
    }

    updateDisplay() {
        const time = this.appState.pomodoroTimer.currentTime;
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        document.getElementById('pomodoro-time').textContent = display;
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
        document.getElementById('pomodoro-modal').classList.remove('active');
    }

    showNotification(title, body) {
        if (window.electronAPI.showNotification) {
            window.electronAPI.showNotification(title, body);
        }
    }
}

// 笔记管理器
class NotesManager {
    constructor(appState) {
        this.appState = appState;
        this.currentMode = 'edit';
        this.init();
    }

    init() {
        this.renderNotesList();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 新建笔记
        document.getElementById('new-note').addEventListener('click', () => {
            this.createNewNote();
        });

        // 保存笔记
        document.getElementById('save-note').addEventListener('click', () => {
            this.saveCurrentNote();
        });

        // 编辑器模式切换
        document.querySelectorAll('.editor-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchMode(e.target.dataset.mode);
            });
        });

        // 编辑器内容变化
        document.getElementById('markdown-editor').addEventListener('input', () => {
            this.updatePreview();
        });

        // 搜索
        document.getElementById('notes-search').addEventListener('input', (e) => {
            this.searchNotes(e.target.value);
        });
    }

    createNewNote() {
        const note = {
            id: Date.now(),
            title: '新建笔记',
            content: '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.appState.notes.unshift(note);
        this.appState.currentNote = note;
        this.renderNotesList();
        this.loadNoteToEditor(note);
        this.appState.saveData();
    }

    renderNotesList() {
        const container = document.getElementById('notes-list');
        if (!container) return;

        container.innerHTML = '';

        this.appState.notes.forEach(note => {
            const element = this.createNoteListItem(note);
            container.appendChild(element);
        });
    }

    createNoteListItem(note) {
        const div = document.createElement('div');
        div.className = `note-item ${this.appState.currentNote?.id === note.id ? 'active' : ''}`;
        div.dataset.id = note.id;

        div.innerHTML = `
      <div class="note-title">${this.escapeHtml(note.title)}</div>
      <div class="note-date">${this.formatDate(note.updatedAt)}</div>
    `;

        div.addEventListener('click', () => {
            this.selectNote(note.id);
        });

        return div;
    }

    selectNote(noteId) {
        const note = this.appState.notes.find(n => n.id === noteId);
        if (note) {
            this.appState.currentNote = note;
            this.loadNoteToEditor(note);
            this.renderNotesList();
        }
    }

    loadNoteToEditor(note) {
        document.getElementById('markdown-editor').value = note.content;
        this.updatePreview();
    }

    saveCurrentNote() {
        if (!this.appState.currentNote) return;

        const content = document.getElementById('markdown-editor').value;
        const firstLine = content.split('\n')[0];
        const title = firstLine.replace(/^#+\s*/, '') || '无标题笔记';

        this.appState.currentNote.content = content;
        this.appState.currentNote.title = title.substring(0, 50);
        this.appState.currentNote.updatedAt = new Date();

        this.appState.saveData();
        this.renderNotesList();
        this.showNotification('保存成功', '笔记已保存');
    }

    switchMode(mode) {
        this.currentMode = mode;

        // 更新选项卡状态
        document.querySelectorAll('.editor-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        const editor = document.getElementById('markdown-editor');
        const preview = document.getElementById('markdown-preview');

        switch (mode) {
            case 'edit':
                editor.style.display = 'block';
                preview.style.display = 'none';
                editor.style.width = '100%';
                break;
            case 'preview':
                editor.style.display = 'none';
                preview.style.display = 'block';
                preview.style.width = '100%';
                this.updatePreview();
                break;
            case 'split':
                editor.style.display = 'block';
                preview.style.display = 'block';
                editor.style.width = '50%';
                preview.style.width = '50%';
                this.updatePreview();
                break;
        }
    }

    updatePreview() {
        const content = document.getElementById('markdown-editor').value;
        const preview = document.getElementById('markdown-preview');
        preview.innerHTML = this.renderMarkdown(content);
    }

    renderMarkdown(content) {
        // 简单的 Markdown 渲染器
        let html = content
            // 标题
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // 粗体
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            // 斜体
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            // 代码
            .replace(/`([^`]+)`/gim, '<code>$1</code>')
            // 链接
            .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
            // 换行
            .replace(/\n/gim, '<br>');

        return html;
    }

    searchNotes(query) {
        const items = document.querySelectorAll('.note-item');
        items.forEach(item => {
            const title = item.querySelector('.note-title').textContent;
            const note = this.appState.notes.find(n => n.id == item.dataset.id);
            const content = note ? note.content : '';

            const matches = title.toLowerCase().includes(query.toLowerCase()) ||
                content.toLowerCase().includes(query.toLowerCase());

            item.style.display = matches ? 'block' : 'none';
        });
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
        if (window.electronAPI.showNotification) {
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
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });

        document.getElementById('glass-effect').addEventListener('change', (e) => {
            this.appState.settings.glassEffect = e.target.checked;
            this.applyGlassEffect(e.target.checked);
            this.appState.saveData();
        });
    }

    setTheme(theme) {
        this.appState.settings.theme = theme;
        this.applyTheme(theme);
        this.appState.saveData();
    }

    applyTheme(theme) {
        if (theme === 'auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = isDark ? 'dark' : 'light';
        }

        document.documentElement.setAttribute('data-theme', theme);
        document.getElementById('theme-select').value = this.appState.settings.theme;
    }

    applyGlassEffect(enabled) {
        const elements = document.querySelectorAll('.panel, .title-bar, .modal-content');
        elements.forEach(element => {
            element.classList.toggle('glass-effect', enabled);
        });
    }
}

// 应用主类
class App {
    constructor() {
        this.state = new AppState();
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

        document.getElementById('always-on-top-btn').addEventListener('click', async () => {
            const isOnTop = await window.electronAPI.toggleAlwaysOnTop();
            document.getElementById('always-on-top-btn').style.background =
                isOnTop ? 'var(--primary-color)' : 'transparent';
        });

        // 选项卡切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 清空剪切板
        document.getElementById('clear-clipboard').addEventListener('click', () => {
            this.clipboardManager.clearClipboard();
        });

        // 剪切板搜索
        document.getElementById('clipboard-search').addEventListener('input', (e) => {
            this.searchClipboard(e.target.value);
        });

        // 设置项监听
        this.setupSettingsListeners();
    }

    setupSettingsListeners() {
        document.getElementById('auto-start').addEventListener('change', (e) => {
            this.state.settings.autoStart = e.target.checked;
            this.state.saveData();
        });

        document.getElementById('clipboard-monitor').addEventListener('change', (e) => {
            this.state.settings.clipboardMonitor = e.target.checked;
            this.state.saveData();
        });

        document.getElementById('max-clipboard-items').addEventListener('change', (e) => {
            this.state.settings.maxClipboardItems = parseInt(e.target.value);
            this.state.saveData();
        });

        document.getElementById('check-updates').addEventListener('click', () => {
            this.checkUpdates();
        });
    }

    async initializeUI() {
        // 设置版本号
        try {
            const version = await window.electronAPI.getAppVersion();
            document.getElementById('app-version').textContent = version;
        } catch (error) {
            console.error('Failed to get app version:', error);
        }

        // 应用设置
        document.getElementById('theme-select').value = this.state.settings.theme;
        document.getElementById('glass-effect').checked = this.state.settings.glassEffect;
        document.getElementById('auto-start').checked = this.state.settings.autoStart;
        document.getElementById('clipboard-monitor').checked = this.state.settings.clipboardMonitor;
        document.getElementById('max-clipboard-items').value = this.state.settings.maxClipboardItems;

        // 应用主题
        this.themeManager.applyTheme(this.state.settings.theme);
        this.themeManager.applyGlassEffect(this.state.settings.glassEffect);

        // 渲染数据
        this.clipboardManager.renderClipboardList();
        this.todoManager.renderTodoList();
        this.notesManager.renderNotesList();
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
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    new App();
});