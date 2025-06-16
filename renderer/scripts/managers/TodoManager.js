// 待办清单管理器
class TodoManager {
    constructor(appState) {
        this.appState = appState;
        this.currentFilter = 'all';
        // 只设置事件监听器，不立即渲染
        this.setupEventListeners();
    }

    init() {
        // 这个方法现在由App类调用，确保数据已加载
        console.log('🔧 待办管理器初始化...');
        console.log('📊 当前待办数据状态:', {
            totalItems: this.appState.todoItems.length,
            pendingItems: this.appState.todoItems.filter(item => !item.completed).length,
            completedItems: this.appState.todoItems.filter(item => item.completed).length
        });

        this.renderTodoList();
        console.log('✅ 待办管理器初始化完成');
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
        console.log('🎨 开始渲染待办列表...');
        const container = document.getElementById('todo-list');
        if (!container) {
            console.error('❌ 找不到待办容器元素 #todo-list');
            return;
        }

        const filteredTodos = this.filterTodos();
        console.log('📋 准备渲染的待办项目:', filteredTodos.length, '个（过滤条件:', this.currentFilter, ')');
        container.innerHTML = '';

        filteredTodos.forEach((todo, index) => {
            console.log(`🔧 创建第 ${index + 1} 个待办项目:`, {
                id: todo.id,
                title: todo.title,
                completed: todo.completed
            });
            const element = this.createTodoElement(todo);
            container.appendChild(element);
        });

        console.log('✅ 待办列表渲染完成，容器中现有:', container.children.length, '个元素');
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
                    <button class="control-btn pomodoro-btn" title="番茄时钟"><i class="fas fa-stopwatch"></i></button>
                    <button class="control-btn edit-btn" title="编辑"><i class="fas fa-edit"></i></button>
                    <button class="control-btn delete-btn" title="删除"><i class="fas fa-trash"></i></button>
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
                        <span class="modal-icon"><i class="fas fa-edit"></i></span>
                        <h3>编辑待办事项</h3>
                    </div>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form class="todo-form">
                        <div class="form-group">
                            <label for="edit-todo-title" class="form-label">
                                <span class="label-icon"><i class="fas fa-edit"></i></span>
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
                                <span class="label-icon"><i class="fas fa-file-alt"></i></span>
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
                                    <span class="label-icon"><i class="fas fa-star"></i></span>
                                    优先级
                                </label>
                                <select id="edit-todo-priority" class="form-select">
                                    <option value="low" ${todo.priority === 'low' ? 'selected' : ''}><i class="fas fa-circle" style="color: green;"></i> 低优先级</option>
                                    <option value="medium" ${todo.priority === 'medium' ? 'selected' : ''}><i class="fas fa-circle" style="color: orange;"></i> 中优先级</option>
                                    <option value="high" ${todo.priority === 'high' ? 'selected' : ''}><i class="fas fa-circle" style="color: red;"></i> 高优先级</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="edit-todo-deadline" class="form-label">
                                <span class="label-icon"><i class="fas fa-calendar-alt"></i></span>
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
                                        <span class="feature-icon"><i class="fas fa-check"></i></span>
                                        标记为已完成
                                    </span>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-edit-todo">取消</button>
                    <button class="btn btn-danger" id="delete-edit-todo" title="删除此待办事项"><i class="fas fa-trash"></i> 删除</button>
                    <button class="btn btn-primary" id="save-edit-todo"><i class="fas fa-save"></i> 保存修改</button>
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
                title.textContent = `${todo.title}`;
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
        // 检查是否启用了桌面通知
        if (!this.appState.settings.enableNotifications) {
            return;
        }

        if (window.electronAPI && window.electronAPI.showNotification) {
            window.electronAPI.showNotification(title, body);
        }
    }
}

// 导出给其他模块使用
window.TodoManager = TodoManager;