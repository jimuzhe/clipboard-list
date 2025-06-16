// 笔记管理器
class NotesManager {
    constructor(appState) {
        this.appState = appState;
        this.currentMode = 'edit';
        this.workspacePath = null; // 当前工作文件夹路径
        this.workspaceFiles = []; // 工作文件夹中的文件列表
        this.currentFilePath = null; // 当前编辑的文件路径
        // 只设置事件监听器，不立即渲染
        this.setupEventListenersOnly();
    }

    setupEventListenersOnly() {
        // 确保DOM已经准备好再设置事件监听器
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
            });
        } else {
            // DOM已经准备好，直接设置
            this.setupEventListeners();
        }
    }

    async init() {
        // 这个方法现在由App类调用，确保数据已加载
        this.renderFilesList();
        // 自动设置默认工作目录为应用的 notes 文件夹
        await this.initializeDefaultWorkspace();
    }

    // 初始化默认工作区
    async initializeDefaultWorkspace() {
        try {
            const response = await window.electronAPI.getDefaultNotesFolder();

            if (response.success && response.data && response.data.folderPath) {
                this.workspacePath = response.data.folderPath;

                // 显示工作区信息
                this.updateWorkspaceInfo();

                // 加载默认工作文件夹中的文件
                await this.refreshWorkspaceFiles();

                console.log('默认工作文件夹已设置:', this.workspacePath);

                // 检查是否为首次使用，如果是空目录可以显示欢迎提示
                if (this.workspaceFiles.length === 0) {
                    console.log('默认工作目录为空，用户可以开始创建笔记');
                }
            } else {
                console.warn('无法获取默认工作文件夹，将使用内存笔记模式');
            }
        } catch (error) {
            console.error('初始化默认工作文件夹失败:', error);
            // 如果失败，保持原有的内存笔记模式
            this.workspacePath = null;
            this.showNotification('提示', '无法初始化默认工作目录，将使用内存笔记模式');
        }
    }

    setupEventListeners() {
        // 新建笔记
        console.log('🔧 开始设置新建笔记事件监听器...');

        // 直接尝试查找按钮
        const newNoteBtn = document.getElementById('new-note');
        console.log('🔍 查找新建笔记按钮元素:', newNoteBtn);
        console.log('📄 DOM readyState:', document.readyState);

        if (newNoteBtn) {
            console.log('✅ 找到新建笔记按钮，设置事件监听器');
            console.log('🔗 按钮元素信息:', {
                id: newNoteBtn.id,
                className: newNoteBtn.className,
                textContent: newNoteBtn.textContent,
                disabled: newNoteBtn.disabled,
                style: newNoteBtn.style.display
            });

            newNoteBtn.addEventListener('click', (e) => {
                console.log('🖱️ ================ 点击事件触发 ================');
                console.log('⏰ 点击时间:', new Date().toLocaleString());
                console.log('🎯 事件目标:', e.target);
                console.log('📍 事件类型:', e.type);
                console.log('🚫 防止默认行为和冒泡');

                e.preventDefault();
                e.stopPropagation();

                console.log('🚀 调用 createNewNote() 方法...');
                try {
                    this.createNewNote();
                    console.log('✅ createNewNote() 调用成功');
                } catch (error) {
                    console.error('❌ createNewNote() 调用失败:', error);
                    console.error('💥 错误堆栈:', error.stack);
                }
                console.log('🖱️ ================ 点击事件结束 ================');
            });
            console.log('✅ 新建笔记按钮事件监听器已添加');
        } else {
            console.error('❌ 找不到新建笔记按钮元素！');
            // 使用querySelctor 作为备选
            const backupBtn = document.querySelector('#new-note');
            console.log('🔄 使用querySelector查找按钮:', backupBtn);

            if (backupBtn) {
                console.log('✅ 通过querySelector找到按钮，设置事件监听器');
                backupBtn.addEventListener('click', (e) => {
                    console.log('🖱️ ================ 备用按钮点击事件触发 ================');
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🚀 调用 createNewNote() 方法(backup)...');
                    try {
                        this.createNewNote();
                        console.log('✅ createNewNote() 调用成功(backup)');
                    } catch (error) {
                        console.error('❌ createNewNote() 调用失败(backup):', error);
                    }
                    console.log('🖱️ ================ 备用按钮点击事件结束 ================');
                });
            } else {
                // 延迟重试
                setTimeout(() => {
                    const retryBtn = document.getElementById('new-note');
                    console.log('⏰ 延迟重试查找按钮:', retryBtn);
                    if (retryBtn) {
                        retryBtn.addEventListener('click', (e) => {
                            console.log('🖱️ ================ 重试按钮点击事件触发 ================');
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🚀 调用 createNewNote() 方法(重试)...');
                            try {
                                this.createNewNote();
                                console.log('✅ createNewNote() 调用成功(重试)');
                            } catch (error) {
                                console.error('❌ createNewNote() 调用失败(重试):', error);
                            }
                            console.log('🖱️ ================ 重试按钮点击事件结束 ================');
                        });
                        console.log('✅ 新建笔记按钮事件监听器已添加(重试)');
                    } else {
                        console.error('❌ 重试后仍然找不到新建笔记按钮元素！');
                        // 打印所有按钮供调试
                        const allButtons = document.querySelectorAll('button');
                        console.log('🔍 页面中的所有按钮:', Array.from(allButtons).map(btn => ({
                            id: btn.id,
                            className: btn.className,
                            textContent: btn.textContent
                        })));
                    }
                }, 1000);
            }
        }

        // 打开工作文件夹
        document.getElementById('open-workspace-folder').addEventListener('click', () => {
            this.openWorkspaceFolder();
        });

        // 预览按钮切换
        document.getElementById('toggle-preview').addEventListener('click', () => {
            this.togglePreview();
            // 自动收起侧边栏
            if (this.currentMode === 'preview') {
                this.collapseSidebar();
            }
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

        // 设置预览页面按钮事件 - 直接打开预设网站管理器
        document.getElementById('settings-preview').addEventListener('click', () => {
            // 直接调用App实例的预设网站管理器方法
            if (window.app && window.app.showPresetWebsitesManager) {
                window.app.showPresetWebsitesManager();
            }
        });
    }

    // 打开工作文件夹
    async openWorkspaceFolder() {
        try {
            const response = await window.electronAPI.openFolderDialog({
                title: '选择Markdown工作文件夹',
                defaultPath: this.workspacePath // 如果已有工作目录，设为默认路径
            });

            // 检查IPC调用是否成功
            if (!response.success) {
                throw new Error(response.error || '打开文件夹对话框失败');
            }

            const result = response.data;
            if (result.canceled || result.filePaths.length === 0) {
                return;
            }

            const newPath = result.filePaths[0];

            // 如果选择的是同一个文件夹，不需要重新加载
            if (newPath === this.workspacePath) {
                this.showNotification('提示', '已经是当前工作文件夹');
                return;
            }

            this.workspacePath = newPath;

            // 显示工作区信息
            this.updateWorkspaceInfo();

            // 加载工作文件夹中的文件
            await this.refreshWorkspaceFiles();

            this.showNotification('工作文件夹切换成功', `已切换到: ${this.workspacePath}`);

        } catch (error) {
            console.error('打开工作文件夹失败:', error);
            this.showNotification('打开失败', error.message || '无法打开文件夹');
        }
    }

    // 关闭工作区
    async closeWorkspace() {
        // 如果当前不是默认工作目录，则切换回默认工作目录
        if (this.workspacePath && !this.workspacePath.endsWith('\\notes')) {
            await this.initializeDefaultWorkspace();
            this.showNotification('已切换回默认工作目录', '已回到应用的 notes 文件夹');
            return;
        }

        // 如果已经是默认工作目录，则完全关闭工作区
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
        const closeWorkspaceBtn = document.getElementById('close-workspace');

        if (this.workspacePath) {
            const folderName = this.workspacePath.split('\\').pop();
            workspaceName.textContent = folderName;
            workspacePath.textContent = this.workspacePath; // 显示完整路径
            workspacePath.title = this.workspacePath; // 悬停提示显示完整路径

            // 检查是否为默认工作目录
            const isDefaultWorkspace = this.workspacePath.endsWith('\\notes');
            if (isDefaultWorkspace) {
                workspacePath.textContent = '默认工作目录'; // 默认工作目录显示友好名称
            }

            workspaceInfo.style.display = 'block';
        } else {
            workspaceInfo.style.display = 'none';
        }
    }

    // 刷新工作文件夹中的文件列表
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
    }

    // 渲染文件列表
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

        // 即使没有文件也不显示提示信息，保持空白
        if (this.workspaceFiles.length === 0) {
            return;
        }

        this.workspaceFiles.forEach(file => {
            if (!file.isDirectory) {
                const element = this.createFileListItem(file);
                container.appendChild(element);
            }
        });
    }

    // 渲染内存中的笔记（原有功能）
    renderMemoryNotes() {
        const container = document.getElementById('notes-list');
        if (!container) return;

        container.innerHTML = '';

        // 确保notes是数组
        if (!Array.isArray(this.appState.notes)) {
            this.appState.notes = [];
        }

        // 即使没有笔记也不显示提示信息，保持空白
        if (this.appState.notes.length === 0) {
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
                <div class="note-title">${this.escapeHtml(fileName)}</div>
                <div class="note-date">${this.formatDate(file.lastModified)}</div>
                <div class="note-file-path" title="${file.path}">${file.path}</div>
            </div>
            <div class="note-item-actions">
                <button class="delete-btn" title="删除文件"><i class="fas fa-trash"></i></button>
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
                <button class="delete-btn" title="删除笔记"><i class="fas fa-trash"></i></button>
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
    }

    // 打开工作区文件
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

            this.showSaveStatus('<i class="fas fa-check"></i> 已保存');

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
    async createNewNote() {
        console.log('🚀 ================== 新建笔记 DEBUG START ==================');
        console.log('📅 当前时间:', new Date().toLocaleString());
        console.log('📁 当前工作区路径:', this.workspacePath);
        console.log('📊 工作区路径类型:', typeof this.workspacePath);
        console.log('📏 工作区路径长度:', this.workspacePath ? this.workspacePath.length : 'null');
        console.log('✅ 工作区路径是否为真值:', !!this.workspacePath);
        console.log('📋 当前工作区文件数量:', this.workspaceFiles.length);

        // 检查 API 可用性
        console.log('🔍 检查 API 可用性:');
        console.log('  - window.electronAPI:', !!window.electronAPI);
        console.log('  - window.api:', !!window.api);
        console.log('  - window.api?.fileSystem:', !!window.api ?.fileSystem);
        console.log('  - window.api?.fileSystem?.exists:', !!window.api ?.fileSystem ?.exists);

        try {
            // 优先在工作区创建文件，如果没有工作区则创建内存笔记
            if (this.workspacePath) {
                console.log('✅ 工作区存在，准备在工作区创建文件');
                console.log('📂 工作区完整路径:', this.workspacePath);

                // 验证工作区路径是否有效
                try {
                    if (window.api ?.fileSystem ?.exists) {
                        console.log('🔍 验证工作区目录是否存在...');
                        const workspaceExists = await window.api.fileSystem.exists(this.workspacePath);
                        console.log('📁 工作区目录是否存在:', workspaceExists);

                        if (!workspaceExists) {
                            console.warn('⚠️  工作区目录不存在，尝试创建目录');
                            if (window.api ?.fileSystem ?.createDirectory) {
                                const createResult = await window.api.fileSystem.createDirectory(this.workspacePath);
                                console.log('📁 创建目录结果:', createResult);
                            } else {
                                console.warn('❌ createDirectory API 不可用');
                            }
                        }
                    } else {
                        console.warn('⚠️  exists API 不可用，跳过目录验证');
                    }
                } catch (error) {
                    console.error('❌ 验证工作区时出错:', error);
                    console.error('💥 验证错误堆栈:', error.stack);
                }

                console.log('🚀 开始调用 createNewFileInWorkspace()');
                await this.createNewFileInWorkspace();
                console.log('✅ createNewFileInWorkspace() 执行完成');
            } else {
                console.log('❌ 工作区不存在，创建内存笔记');
                console.log('🚀 开始调用 createNewMemoryNote()');
                this.createNewMemoryNote();
                console.log('✅ createNewMemoryNote() 执行完成');
            }
        } catch (error) {
            console.error('❌ createNewNote 执行过程中出错:', error);
            console.error('💥 错误堆栈:', error.stack);
            console.error('🔍 错误详细信息:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            this.showNotification('创建笔记失败', error.message);
        }

        console.log('🚀 ================== 新建笔记 DEBUG END ==================');
    }

    // 在工作文件夹中创建新文件
    async createNewFileInWorkspace() {
        console.log('📝 ============== createNewFileInWorkspace START ==============');

        if (!this.workspacePath) {
            console.error('❌ 工作区路径为空，无法创建文件');
            this.showNotification('错误', '请先选择工作文件夹');
            return;
        }

        console.log('📁 当前工作区路径:', this.workspacePath);
        console.log('💬 准备显示文件名输入对话框');

        // 使用自定义输入对话框替代 prompt()
        const fileName = await this.showInputDialog('新建笔记', '请输入文件名（不需要扩展名）：', `笔记_${new Date().getMonth() + 1}-${new Date().getDate()}`);
        console.log('📝 用户输入的文件名:', fileName);

        if (!fileName || fileName.trim() === '') {
            console.log('❌ 用户取消了文件名输入或输入为空');
            return;
        }

        const cleanFileName = fileName.trim();
        const safeName = cleanFileName.replace(/[<>:"/\\|?*]/g, '_');
        const filePath = `${this.workspacePath}\\${safeName}.md`;

        console.log('🔧 处理后的文件名:', safeName);
        console.log('📄 完整文件路径:', filePath);

        try {
            // 检查文件是否已存在
            console.log('🔍 检查文件是否已存在');
            console.log('📊 当前工作区文件列表长度:', this.workspaceFiles.length);
            console.log('📋 当前工作区文件列表:', this.workspaceFiles.map(f => ({
                name: f.name,
                path: f.path
            })));

            const exists = this.workspaceFiles.some(file => file.path === filePath);
            console.log('❓ 文件是否已存在:', exists);

            if (exists) {
                console.warn('❌ 同名文件已存在');
                this.showNotification('错误', '同名文件已存在，请使用其他文件名');
                return;
            }

            // 创建新文件，增加更丰富的初始内容
            console.log('📝 开始创建新文件');

            const currentDate = new Date().toLocaleDateString('zh-CN');
            const currentTime = new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const initialContent = `# ${cleanFileName}

> 创建时间：${currentDate} ${currentTime}

## 内容

`;
            console.log('📄 初始内容准备完成，长度:', initialContent.length);
            console.log('📄 初始内容预览:', initialContent.substring(0, 100) + '...');

            console.log('🔧 准备调用 window.electronAPI.writeFile API');
            console.log('🔍 检查 API 可用性:');
            console.log('  - window.electronAPI:', !!window.electronAPI);
            console.log('  - window.electronAPI.writeFile:', !!window.electronAPI ?.writeFile);

            if (!window.electronAPI || !window.electronAPI.writeFile) {
                throw new Error('writeFile API 不可用');
            }

            const response = await window.electronAPI.writeFile(filePath, initialContent);
            console.log('📤 writeFile API 调用完成');
            console.log('📥 API 响应:', JSON.stringify(response, null, 2));

            // 检查IPC调用是否成功
            if (!response.success) {
                console.error('❌ 文件创建失败:', response.error);
                throw new Error(response.error || '创建文件失败');
            }

            console.log('✅ 文件创建成功');

            // 刷新工作区文件列表
            console.log('🔄 开始刷新工作区文件列表');
            await this.refreshWorkspaceFiles();
            console.log('✅ 工作区文件列表刷新完成');
            console.log('📊 刷新后文件列表长度:', this.workspaceFiles.length);

            // 打开新创建的文件
            const fileInfo = this.workspaceFiles.find(file => file.path === filePath);
            console.log('🔍 查找新创建的文件:', fileInfo ? '找到' : '未找到');

            if (fileInfo) {
                console.log('📂 开始打开新创建的文件');
                await this.openWorkspaceFile(fileInfo);

                // 自动聚焦到编辑器并定位到内容区域
                setTimeout(() => {
                    const editor = document.getElementById('markdown-editor');
                    if (editor) {
                        console.log('🎯 设置编辑器焦点和光标位置');
                        editor.focus();
                        // 将光标定位到内容区域
                        const contentIndex = editor.value.indexOf('\n## 内容\n\n') + 7;
                        editor.setSelectionRange(contentIndex, contentIndex);
                    }
                }, 100);
            }

            this.showNotification('创建成功', `文件已创建: ${safeName}.md`);

        } catch (error) {
            console.error('❌ 创建文件失败:', error);
            console.error('💥 错误堆栈:', error.stack);
            console.error('🔍 错误详细信息:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            this.showNotification('创建失败', error.message || '无法创建文件');
        }

        console.log('📝 ============== createNewFileInWorkspace END ==============');
    }

    // 创建内存笔记
    createNewMemoryNote() {
        const currentDate = new Date().toLocaleDateString('zh-CN');
        const currentTime = new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const note = {
            id: Date.now(),
            title: `笔记_${new Date().getMonth() + 1}-${new Date().getDate()}`,
            content: `# 新建笔记

> 创建时间：${currentDate} ${currentTime}

## 内容

`,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.appState.notes.unshift(note);
        this.appState.currentNote = note;
        this.currentFilePath = null;
        this.appState.saveData();

        document.getElementById('markdown-editor').value = note.content;
        this.renderFilesList();

        // 聚焦到编辑器并定位到内容区域
        setTimeout(() => {
            const editor = document.getElementById('markdown-editor');
            if (editor) {
                editor.focus();
                // 将光标定位到内容区域
                const contentIndex = editor.value.indexOf('\n## 内容\n\n') + 7;
                editor.setSelectionRange(contentIndex, contentIndex);
            }
        }, 100);

        this.showNotification('笔记创建成功', '新笔记已创建（内存模式）');
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
        this.showSaveStatus('<i class="fas fa-check"></i> 已保存');
    }

    // 保存到工作区文件
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
        // 使用统一的删除确认对话框
        window.app.showDeleteConfirmDialog({
            title: '删除文件',
            itemName: file.name,
            itemType: 'Markdown文件',
            onConfirm: async () => {
                try {
                    // 调用删除文件API
                    const response = await window.electronAPI.deleteFile(file.path);

                    // 检查IPC调用是否成功
                    if (!response.success) {
                        throw new Error(response.error || '删除文件失败');
                    }

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

                    this.showNotification('删除成功', `文件 "${file.name}" 已删除`);

                } catch (error) {
                    console.error('删除文件失败:', error);
                    this.showNotification('删除失败', error.message || '无法删除文件');
                }
            }
        });
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
            indicator.innerHTML = status;

            if (status === '正在保存...') {
                indicator.parentElement.classList.add('saving');
            } else {
                indicator.parentElement.classList.remove('saving');

                if (status === '<i class="fas fa-check"></i> 已保存') {
                    setTimeout(() => {
                        if (indicator.innerHTML === '<i class="fas fa-check"></i> 已保存') {
                            indicator.innerHTML = '<i class="fas fa-check"></i> 已保存';
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
            toggleBtn.innerHTML = '<i class="fas fa-edit"></i>';
            this.updatePreview();
        } else {
            this.currentMode = 'edit';
            editor.style.display = 'block';
            preview.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
        }
    }

    // 强制收起侧边栏
    collapseSidebar() {
        const sidebar = document.querySelector('.notes-sidebar');
        const toggleBtn = document.getElementById('toggle-sidebar');

        if (!sidebar.classList.contains('collapsed')) {
            sidebar.classList.add('collapsed');
            toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            toggleBtn.title = '展开侧边栏';
        }
    }

    // 打开设置预览页面
    openSettingsPreview() {
        // 切换到设置面板
        const tabButtons = document.querySelectorAll('.tab-btn');
        const panels = document.querySelectorAll('.panel');

        // 移除所有活动状态
        tabButtons.forEach(btn => btn.classList.remove('active'));
        panels.forEach(panel => panel.classList.remove('active'));

        // 激活设置面板
        const settingsTab = document.querySelector('[data-tab="settings"]');
        const settingsPanel = document.getElementById('settings-panel');

        if (settingsTab && settingsPanel) {
            settingsTab.classList.add('active');
            settingsPanel.classList.add('active');
        }
    }

    // 切换侧边栏
    toggleSidebar() {
        const sidebar = document.querySelector('.notes-sidebar');
        const toggleBtn = document.getElementById('toggle-sidebar');

        if (sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            toggleBtn.title = '收起侧边栏';
        } else {
            sidebar.classList.add('collapsed');
            toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
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

    // 显示自定义输入对话框
    showInputDialog(title, message, defaultValue = '') {
        return new Promise((resolve) => {
            // 创建模态对话框
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content input-dialog-modal">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close-btn"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <p class="input-dialog-message">${message}</p>
                        <input type="text" class="input-dialog-field" value="${defaultValue}" placeholder="请输入...">
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary modal-cancel">取消</button>
                        <button class="btn btn-primary modal-confirm">确定</button>
                    </div>
                </div>
            `;

            // 添加到文档
            document.body.appendChild(modal);

            // 获取元素
            const input = modal.querySelector('.input-dialog-field');
            const confirmBtn = modal.querySelector('.modal-confirm');
            const cancelBtn = modal.querySelector('.modal-cancel');
            const closeBtn = modal.querySelector('.modal-close-btn');

            // 自动聚焦并选择文本
            setTimeout(() => {
                input.focus();
                input.select();
            }, 100);

            // 确定按钮事件
            const handleConfirm = () => {
                const value = input.value.trim();
                document.body.removeChild(modal);
                resolve(value || null);
            };

            // 取消按钮事件
            const handleCancel = () => {
                document.body.removeChild(modal);
                resolve(null);
            };

            // 绑定事件
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            closeBtn.addEventListener('click', handleCancel);

            // Enter键确定，Escape键取消
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirm();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancel();
                }
            });

            // 点击遮罩层取消
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    handleCancel();
                }
            });
        });
    }

    // 显示通知
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
window.NotesManager = NotesManager;