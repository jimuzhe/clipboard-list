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
            clearClipboardOnRestart: true,
            enableNotifications: true,
            maxClipboardItems: 100,
            communityUrl: 'http://8.130.41.186:3000/',
            // 动画速度设置
            animationSpeed: 'normal', // 'fast', 'normal', 'slow'
            showAnimationDuration: 150, // 显示动画持续时间(毫秒)
            hideAnimationDuration: 40, // 隐藏动画持续时间(毫秒)
            online: {
                currentUrl: 'http://8.130.41.186:3000/',
                showPresetButtons: true,
                presetWebsites: [{
                    id: 'default',
                    name: '移记社区',
                    url: 'http://8.130.41.186:3000/',
                    icon: 'fas fa-home',
                    description: '默认社区页面'
                }, {
                    id: 'yuanbao',
                    name: '元宝',
                    url: 'https://yuanbao.tencent.com/chat/',
                    icon: 'fab fa-github-alt',
                    description: 'ai'
                }, {
                    id: 'doubao',
                    name: '豆包',
                    url: 'https://www.doubao.com/chat/',
                    icon: 'fas fa-book',
                    description: 'ai'
                }, {
                    id: 'baidu',
                    name: '百度',
                    url: 'https://www.baidu.com/',
                    icon: 'fas fa-book-open',
                    description: '搜索'
                }, {
                    id: 'chatgpt',
                    name: 'ChatGPT',
                    url: 'https://chat.openai.com',
                    icon: 'fas fa-robot',
                    description: 'ai'
                }]
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
            // 分别加载各种数据类型
            await Promise.all([
                this.loadClipboardData(),
                this.loadTodoData(),
                this.loadNotesData(),
                this.loadSettingsData(),
                this.loadPomodoroData()
            ]);
            console.log('✅ 所有数据加载完成');
        } catch (error) {
            console.error('❌ 数据加载失败:', error);
        }
    }

    async loadClipboardData() {
        try {
            console.log('🔄 开始加载剪切板数据...');

            // 获取数据文件路径
            if (window.electronAPI.getDataPath) {
                const dataPath = await window.electronAPI.getDataPath();
                console.log('📁 数据目录路径:', dataPath);
                console.log('📄 剪切板数据文件路径:', dataPath + '/clipboard-history.json');
            }
            const response = await window.electronAPI.loadClipboardHistory();
            console.log('📥 从文件加载的原始数据:', response);

            if (response && response.success && Array.isArray(response.data)) {
                let clipboardData = response.data;
                // 检查是否启用了重启时清理剪切板数据的设置
                if (this.settings.clearClipboardOnRestart) {
                    // 只保留置顶的项目
                    const pinnedItems = clipboardData.filter(item => item.pinned);
                    clipboardData = pinnedItems;

                    console.log(`🧹 重启时清理剪切板数据已启用: 原始 ${response.data.length} 项，保留置顶 ${pinnedItems.length} 项`);

                    // 如果有数据被清理，保存清理后的数据
                    if (response.data.length > pinnedItems.length) {
                        this.clipboardItems = clipboardData; // 先设置数据
                        console.log('💾 保存清理后的剪切板数据...');
                        await this.saveClipboardData();
                    }
                }

                this.clipboardItems = clipboardData;
                console.log(`✅ 剪切板数据加载完成: ${clipboardData.length} 项`);
                console.log('📋 加载的剪切板项目详情:', this.clipboardItems); // 验证数据结构
                this.clipboardItems.forEach((item, index) => {
                    console.log(`📄 项目 ${index + 1}:`, {
                        id: item.id,
                        type: item.type,
                        content: item.content ? item.content.substring(0, 50) + (item.content.length > 50 ? '...' : '') : 'null',
                        timestamp: item.timestamp,
                        pinned: item.pinned
                    });
                });
            } else {
                console.log('⚠️ 剪切板数据为空或格式不正确，response:', response);
                this.clipboardItems = [];
            }
        } catch (error) {
            console.error('❌ 剪切板数据加载失败:', error);
            this.clipboardItems = [];
        }
    }

    async loadTodoData() {
        try {
            console.log('🔄 开始加载待办数据...');
            const response = await window.electronAPI.loadTodos();
            console.log('📥 从文件加载的待办原始数据:', response);

            if (response && response.success && Array.isArray(response.data)) {
                this.todoItems = response.data;
                console.log(`✅ 待办数据加载完成: ${response.data.length} 项`);
                console.log('📋 加载的待办项目详情:', this.todoItems);
            } else {
                console.log('⚠️ 待办数据为空或格式不正确，response:', response);
                this.todoItems = [];
            }
        } catch (error) {
            console.error('❌ 待办数据加载失败:', error);
            this.todoItems = [];
        }
    }

    async loadNotesData() {
        try {
            console.log('🔄 开始加载笔记数据...');
            const response = await window.electronAPI.loadNotes();
            console.log('📥 从文件加载的笔记原始数据:', response);

            if (response && response.success && Array.isArray(response.data)) {
                this.notes = response.data;
                console.log(`✅ 笔记数据加载完成: ${response.data.length} 项`);
                console.log('📋 加载的笔记详情:', this.notes);
            } else {
                console.log('⚠️ 笔记数据为空或格式不正确，response:', response);
                this.notes = [];
            }
        } catch (error) {
            console.error('❌ 笔记数据加载失败:', error);
            this.notes = [];
        }
    }

    async loadSettingsData() {
        try {
            const response = await window.electronAPI.loadSettings();
            if (response && response.success && response.data && typeof response.data === 'object') {
                this.settings = {
                    ...this.settings,
                    ...response.data
                };
                console.log('✅ 设置数据加载完成');
            } else if (response && typeof response === 'object' && !response.success) {
                // 向后兼容：如果返回的是直接数据而不是包装格式
                this.settings = {
                    ...this.settings,
                    ...response
                };
                console.log('✅ 设置数据加载完成（向后兼容模式）');
            }
        } catch (error) {
            console.error('设置数据加载失败:', error);
        }
    }

    async loadPomodoroData() {
        try {
            const response = await window.electronAPI.loadPomodoroTimer();
            if (response && response.success && response.data && typeof response.data === 'object') {
                this.pomodoroTimer = {
                    ...this.pomodoroTimer,
                    ...response.data
                };
                console.log('✅ 番茄时钟数据加载完成');
            } else if (response && typeof response === 'object' && !response.success) {
                // 向后兼容：如果返回的是直接数据而不是包装格式
                this.pomodoroTimer = {
                    ...this.pomodoroTimer,
                    ...response
                };
                console.log('✅ 番茄时钟数据加载完成（向后兼容模式）');
            }
        } catch (error) {
            console.error('番茄时钟数据加载失败:', error);
        }
    }

    async saveData() {
        try {
            // 分别保存各种数据类型
            await Promise.all([
                this.saveClipboardData(),
                this.saveTodoData(),
                this.saveNotesData(),
                this.saveSettingsData(),
                this.savePomodoroData()
            ]);
            console.log('✅ 所有数据保存完成');
        } catch (error) {
            console.error('❌ 数据保存失败:', error);
        }
    }

    async saveClipboardData() {
        try {
            await window.electronAPI.saveClipboardHistory(this.clipboardItems);
            console.log(`✅ 剪切板数据保存完成: ${this.clipboardItems.length} 项`);
        } catch (error) {
            console.error('剪切板数据保存失败:', error);
        }
    }

    async saveTodoData() {
        try {
            await window.electronAPI.saveTodos(this.todoItems);
            console.log(`✅ 待办数据保存完成: ${this.todoItems.length} 项`);
        } catch (error) {
            console.error('待办数据保存失败:', error);
        }
    }

    async saveNotesData() {
        try {
            await window.electronAPI.saveNotes(this.notes);
            console.log(`✅ 笔记数据保存完成: ${this.notes.length} 项`);
        } catch (error) {
            console.error('笔记数据保存失败:', error);
        }
    }

    async saveSettingsData() {
        try {
            await window.electronAPI.saveSettings(this.settings);
            console.log('✅ 设置数据保存完成');
        } catch (error) {
            console.error('设置数据保存失败:', error);
        }
    }

    async savePomodoroData() {
        try {
            await window.electronAPI.savePomodoroTimer(this.pomodoroTimer);
            console.log('✅ 番茄时钟数据保存完成');
        } catch (error) {
            console.error('番茄时钟数据保存失败:', error);
        }
    }
}

// 导出给其他模块使用
window.AppState = AppState;