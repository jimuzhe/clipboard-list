/**
 * 应用主类 - 管理整个应用的初始化和协调各个管理器
 */
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

        // 初始化管理器（不立即渲染）
        this.clipboardManager = new ClipboardManager(this.state);
        this.todoManager = new TodoManager(this.state);
        this.pomodoroManager = new PomodoroManager(this.state);
        this.notesManager = new NotesManager(this.state);
        this.themeManager = new ThemeManager(this.state);
        this.shortcutManager = new ShortcutManager(this.state);

        // 设置事件监听器
        this.setupEventListeners();

        // 初始化UI
        this.initializeUI(); // 在DOM完全准备后初始化快捷键管理器
        setTimeout(() => {
            console.log('Initializing ShortcutUIManager...');
            this.shortcutUIManager = new ShortcutUIManager(this.shortcutManager);
        }, 100);

        // 数据加载完成后，重新渲染所有组件
        await this.renderAllComponents();
    }
    setupEventListeners() {
        // 标题栏控制
        document.getElementById('minimize-btn').addEventListener('click', () => {
            window.electronAPI.minimizeWindow();
        });
        document.getElementById('close-btn').addEventListener('click', () => {
            window.electronAPI.closeWindow();
        });

        // 设置按钮
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.switchTab('settings');
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
        });

        // 清理剪切板按钮
        document.getElementById('clear-clipboard').addEventListener('click', () => {
            this.clipboardManager.clearClipboard();
        });

        // 设置项监听
        this.setupSettingsListeners();

        // 社区面板监听器
        this.setupCommunityListeners(); // 设置更新事件监听器
        this.setupUpdateListeners();

        // 监听来自主进程的导航事件
        this.setupMainProcessListeners();
    }

    setupMainProcessListeners() {
        // 监听主进程发送的导航到在线页面事件
        if (window.electronAPI && window.electronAPI.onNavigateToOnlinePage) {
            window.electronAPI.onNavigateToOnlinePage((url) => {
                this.navigateToOnlinePageWithUrl(url);
            });
        }
    }
    setupSettingsListeners() {
        // 页面显示控制
        const showClipboardTab = document.getElementById('show-clipboard-tab');
        if (showClipboardTab) {
            showClipboardTab.addEventListener('change', (e) => {
                this.state.settings.showClipboardTab = e.target.checked;
                this.state.saveData();
                this.updateTabVisibility();
            });
        }

        const showTodoTab = document.getElementById('show-todo-tab');
        if (showTodoTab) {
            showTodoTab.addEventListener('change', (e) => {
                this.state.settings.showTodoTab = e.target.checked;
                this.state.saveData();
                this.updateTabVisibility();
            });
        }

        const showNotesTab = document.getElementById('show-notes-tab');
        if (showNotesTab) {
            showNotesTab.addEventListener('change', (e) => {
                this.state.settings.showNotesTab = e.target.checked;
                this.state.saveData();
                this.updateTabVisibility();
            });
        }

        const showCommunityTab = document.getElementById('show-community-tab');
        if (showCommunityTab) {
            showCommunityTab.addEventListener('change', (e) => {
                this.state.settings.showCommunityTab = e.target.checked;
                this.state.saveData();
                this.updateTabVisibility();
            });
        }

        // 主题选择
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.state.settings.theme = e.target.value;
                this.state.saveData();
                this.themeManager.applyTheme(e.target.value);
            });
        } // 毛玻璃效果
        const glassEffect = document.getElementById('glass-effect');
        if (glassEffect) {
            glassEffect.addEventListener('change', (e) => {
                this.state.settings.glassEffect = e.target.checked;
                this.state.saveData();
                this.themeManager.applyGlassEffect(e.target.checked);
            });
        } // 窗口透明度（改为背景透明度）
        const windowOpacity = document.getElementById('window-opacity');
        if (windowOpacity) {
            windowOpacity.addEventListener('input', async (e) => {
                const value = parseFloat(e.target.value);
                this.state.settings.windowOpacity = value;
                this.state.saveData();

                // 不再调用主进程设置窗口透明度，而是通过CSS控制背景透明度
                this.applyBackgroundOpacity(value);

                this.updateSliderValue(e.target, Math.round(value * 100) + '%');
                console.log('设置背景透明度:', value);
            });
        }

        // 液态玻璃主题
        const liquidGlassTheme = document.getElementById('liquid-glass-theme');
        if (liquidGlassTheme) {
            liquidGlassTheme.addEventListener('change', (e) => {
                this.state.settings.liquidGlassTheme = e.target.checked;
                this.state.saveData();
                this.themeManager.applyLiquidGlassTheme(e.target.checked);
                this.toggleLiquidGlassControls(e.target.checked);
            });
        } // 玻璃透明度
        const glassOpacity = document.getElementById('glass-opacity');
        if (glassOpacity) {
            glassOpacity.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.state.settings.liquidGlassOpacity = value;
                this.state.saveData();
                this.updateAppOpacity(value); // 使用新的方法更新整个应用的透明度
                this.updateSliderValue(e.target, Math.round(value * 100) + '%');
            });
        }

        // 玻璃颜色
        const glassColor = document.getElementById('glass-color');
        if (glassColor) {
            glassColor.addEventListener('change', (e) => {
                this.state.settings.liquidGlassColor = e.target.value;
                this.state.saveData();
                this.themeManager.updateLiquidGlassColor(e.target.value);
            });
        }

        // 颜色预设
        const colorPresets = document.querySelectorAll('.color-preset');
        colorPresets.forEach(preset => {
            preset.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                if (color) {
                    glassColor.value = color;
                    this.state.settings.liquidGlassColor = color;
                    this.state.saveData();
                    this.themeManager.updateLiquidGlassColor(color);
                }
            });
        });

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

        // 窗口置顶
        const alwaysOnTop = document.getElementById('always-on-top');
        if (alwaysOnTop) {
            alwaysOnTop.addEventListener('change', async (e) => {
                this.state.settings.alwaysOnTop = e.target.checked;
                this.state.saveData();
                if (window.electronAPI && window.electronAPI.setAlwaysOnTop) {
                    await window.electronAPI.setAlwaysOnTop(e.target.checked);
                }
                console.log('设置窗口置顶:', e.target.checked);
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

        // 重启时清理剪切板数据
        const clearClipboardOnRestart = document.getElementById('clear-clipboard-on-restart');
        if (clearClipboardOnRestart) {
            clearClipboardOnRestart.addEventListener('change', (e) => {
                this.state.settings.clearClipboardOnRestart = e.target.checked;
                this.state.saveData();
                console.log('设置重启清理剪切板数据:', e.target.checked);
            });
        }

        // 启用桌面通知
        const enableNotifications = document.getElementById('enable-notifications');
        if (enableNotifications) {
            enableNotifications.addEventListener('change', (e) => {
                this.state.settings.enableNotifications = e.target.checked;
                this.state.saveData();
                console.log('设置桌面通知:', e.target.checked);
            });
        }

        // 测试通知按钮
        const testNotificationBtn = document.getElementById('test-notification-btn');
        if (testNotificationBtn) {
            testNotificationBtn.addEventListener('click', async () => {
                try {
                    testNotificationBtn.disabled = true;
                    testNotificationBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 4px;"></i>测试中...';

                    // 首先测试通过普通通知API
                    if (window.electronAPI && window.electronAPI.testNotification) {
                        await window.electronAPI.testNotification('测试通知', '如果您看到这个通知，说明桌面通知功能正常工作！🎉');
                    }

                    // 恢复按钮状态
                    setTimeout(() => {
                        testNotificationBtn.disabled = false;
                        testNotificationBtn.innerHTML = '<i class="fas fa-bell" style="margin-right: 4px;"></i>测试通知';
                    }, 2000);
                } catch (error) {
                    console.error('测试通知失败:', error);
                    testNotificationBtn.disabled = false;
                    testNotificationBtn.innerHTML = '<i class="fas fa-bell" style="margin-right: 4px;"></i>测试失败';
                    setTimeout(() => {
                        testNotificationBtn.innerHTML = '<i class="fas fa-bell" style="margin-right: 4px;"></i>测试通知';
                    }, 2000);
                }
            });
        }

        // 动画速度设置
        const animationSpeed = document.getElementById('animation-speed');
        if (animationSpeed) {
            animationSpeed.addEventListener('change', (e) => {
                this.state.settings.animationSpeed = e.target.value;
                this.state.saveData();
                this.applyAnimationSpeed(e.target.value);
                console.log('设置动画速度:', e.target.value);
            });
        }
    }

    setupCommunityListeners() {
        // 社区面板相关的事件监听器
        this.setupCommunityPanelListeners();
    }
    setupUpdateListeners() {
        // 更新相关的事件监听器
        // 检查更新按钮
        const checkUpdateBtn = document.getElementById('check-updates');
        if (checkUpdateBtn) {
            checkUpdateBtn.addEventListener('click', () => {
                this.checkForUpdates();
            });
        }

        // 设置更新下载进度监听器
        if (window.electronAPI && window.electronAPI.onUpdateDownloadProgress) {
            window.electronAPI.onUpdateDownloadProgress((progress) => {
                this.updateDownloadProgress(progress);
            });
        }

        // 设置下载开始监听器
        if (window.electronAPI && window.electronAPI.onUpdateDownloadStarted) {
            window.electronAPI.onUpdateDownloadStarted((updateInfo) => {
                console.log('📥 下载开始:', updateInfo);
            });
        }

        // 设置下载完成监听器
        if (window.electronAPI && window.electronAPI.onUpdateDownloadCompleted) {
            window.electronAPI.onUpdateDownloadCompleted((result) => {
                console.log('✅ 下载完成:', result);
                if (result.filePath) {
                    this.showDownloadCompleteDialog(result.filePath);
                }
            });
        }

        // 设置下载错误监听器
        if (window.electronAPI && window.electronAPI.onUpdateDownloadError) {
            window.electronAPI.onUpdateDownloadError((error) => {
                console.error('❌ 下载失败:', error);
                this.showDownloadErrorDialog(error);
            });
        }
    }

    setupShortcutListeners() {
        // 快捷键设置相关的事件监听器
        if (this.shortcutUIManager) {
            this.shortcutUIManager.setupEventListeners();
        }
    }
    initializeUI() {
        // 获取并设置应用版本信息
        this.initializeAppVersion();

        // 设置默认选项卡
        this.switchTab('clipboard');

        // 初始化设置面板的值
        this.initializeSettingsPanel(); // 初始化预设选择器
        this.initializePresetSelector();

        // 渲染预设网站按钮
        this.renderPresetWebsites();

        // 在后台自动更新所有预设网站的favicon（如果需要）
        setTimeout(() => {
            this.checkAndUpdateFavicons();
        }, 2000); // 延迟2秒执行，避免阻塞UI加载        // 初始化社区webview URL
        this.initializeCommunityWebview(); // 应用主题
        this.themeManager.applyTheme(this.state.settings.theme);

        // 应用液态玻璃主题
        this.themeManager.applyLiquidGlassTheme(this.state.settings.liquidGlassTheme);

        // 应用动画速度设置
        this.applyAnimationSpeed(this.state.settings.animationSpeed || 'normal');

        // 初始化置顶状态同步
        setTimeout(() => {
            this.initializeAlwaysOnTopSetting();
        }, 100);
    }

    /**
     * 初始化应用版本信息
     */
    async initializeAppVersion() {
        try {
            console.log('📱 开始获取应用版本信息...');
            const versionResponse = await window.electronAPI.getAppVersion();
            console.log('✅ 获取到版本响应:', versionResponse, '类型:', typeof versionResponse);

            // 处理不同类型的版本响应
            let version;
            if (typeof versionResponse === 'string') {
                version = versionResponse;
            } else if (typeof versionResponse === 'object' && versionResponse !== null) {
                // 如果是对象，尝试提取版本信息
                version = versionResponse.version || versionResponse.data || JSON.stringify(versionResponse);
                console.log('🔄 从对象中提取版本:', version);
            } else {
                version = String(versionResponse);
            }

            const versionElement = document.getElementById('app-version');
            if (versionElement) {
                versionElement.textContent = version || '未知';
                console.log('✅ 版本信息已更新到UI:', version);
            } else {
                console.warn('⚠️ 未找到版本显示元素 #app-version');
            }
        } catch (error) {
            console.error('❌ 获取应用版本失败:', error);
            const versionElement = document.getElementById('app-version');
            if (versionElement) {
                versionElement.textContent = '未知';
            }
        }
    }

    async renderAllComponents() {
        console.log('🎨 开始渲染所有组件...');
        console.log('🔍 检查数据状态:');
        console.log('📋 剪切板项目数量:', this.state.clipboardItems.length);
        console.log('✅ 待办事项数量:', this.state.todoItems.length);
        console.log('📝 笔记数量:', this.state.notes.length);

        // 详细检查剪切板数据
        if (this.state.clipboardItems.length > 0) {
            console.log('📄 剪切板数据详情:');
            this.state.clipboardItems.forEach((item, index) => {
                console.log(`  项目 ${index + 1}:`, {
                    id: item.id,
                    type: item.type,
                    content: item.content ? item.content.substring(0, 30) + '...' : 'null',
                    timestamp: item.timestamp
                });
            });
        } else {
            console.log('⚠️ 剪切板数据为空，检查加载过程...');
        }

        // 调用各个管理器的init方法，确保数据已加载后再渲染
        console.log('🔧 初始化剪切板管理器...');
        this.clipboardManager.init();

        console.log('🔧 初始化待办管理器...');
        this.todoManager.init();
        console.log('🔧 初始化笔记管理器...');
        await this.notesManager.init(); // 初始化预设网站选择器
        console.log('🔧 初始化预设网站选择器...');
        this.initializePresetSelector();

        // 初始化液态玻璃主题的鼠标追踪效果
        console.log('🔧 初始化液态玻璃效果...');
        this.initializeLiquidGlassMouseTracking();
        console.log('✅ 所有组件渲染完成');
    }

    /**
     * 检查应用更新
     */
    async checkForUpdates() {
        try {
            console.log('🔍 开始检查更新...');
            // 显示检查中状态
            const checkBtn = document.getElementById('check-updates');
            if (checkBtn) {
                const originalText = checkBtn.textContent;
                checkBtn.textContent = '检查中...';
                checkBtn.disabled = true;

                // 恢复按钮状态的函数
                const restoreButton = () => {
                    checkBtn.textContent = originalText;
                    checkBtn.disabled = false;
                };

                // 调用主进程检查更新
                const result = await window.electronAPI.checkForUpdates();
                console.log('✅ 更新检查结果:', result);

                // 恢复按钮状态
                restoreButton();

                if (result.hasUpdate) {
                    // 显示更新可用对话框
                    this.showUpdateAvailableDialog(result.updateInfo);
                } else if (result.error) {
                    // 显示错误信息
                    this.showUpdateErrorDialog(result.error);
                } else {
                    // 显示已是最新版本
                    this.showNoUpdateDialog();
                }
            }
        } catch (error) {
            console.error('❌ 检查更新失败:', error);
            this.showUpdateErrorDialog(error.message || '检查更新失败');
        }
    }

    /**
     * 显示更新可用对话框
     */
    showUpdateAvailableDialog(updateInfo) {
        // 创建更新对话框
        const dialog = document.createElement('div');
        dialog.className = 'update-dialog-overlay';
        dialog.innerHTML = `
            <div class="update-dialog">
                <div class="update-dialog-header">
                    <h3>🎉 发现新版本</h3>
                    <button class="update-dialog-close">×</button>
                </div>
                <div class="update-dialog-content">
                    <p><strong>新版本:</strong> ${updateInfo.version}</p>
                    <p><strong>发布日期:</strong> ${updateInfo.releaseDate}</p>
                    <p><strong>更新说明:</strong></p>
                    <div class="update-changelog">
                        <ul>
                            ${updateInfo.changelog ? updateInfo.changelog.map(item => `<li>${item}</li>`).join('') : '<li>修复已知问题，提升性能</li>'}
                        </ul>
                    </div>
                </div>
                <div class="update-dialog-actions">
                    <button class="btn btn-secondary" data-action="later">稍后提醒</button>
                    <button class="btn btn-primary" data-action="download">立即下载</button>
                </div>
            </div>
        `;

        // 绑定事件处理器
        const closeBtn = dialog.querySelector('.update-dialog-close');
        const laterBtn = dialog.querySelector('[data-action="later"]');
        const downloadBtn = dialog.querySelector('[data-action="download"]');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                dialog.remove();
            });
        }

        if (laterBtn) {
            laterBtn.addEventListener('click', () => {
                dialog.remove();
            });
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadUpdate(encodeURIComponent(JSON.stringify(updateInfo)));
            });
        }

        document.body.appendChild(dialog);
    }
    /**
     * 显示无更新对话框
     */
    showNoUpdateDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'update-dialog-overlay';
        dialog.innerHTML = `
            <div class="update-dialog">
                <div class="update-dialog-header">
                    <h3>✅ 已是最新版本</h3>
                    <button class="update-dialog-close">×</button>
                </div>
                <div class="update-dialog-content">
                    <p>您当前使用的已经是最新版本，无需更新。</p>
                </div>
                <div class="update-dialog-actions">
                    <button class="btn btn-primary" data-action="close">确定</button>
                </div>
            </div>
        `;

        // 绑定事件处理器
        const closeBtn = dialog.querySelector('.update-dialog-close');
        const confirmBtn = dialog.querySelector('[data-action="close"]');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                dialog.remove();
            });
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                dialog.remove();
            });
        }

        document.body.appendChild(dialog);
    }

    /**
     * 显示更新错误对话框
     */
    showUpdateErrorDialog(error) {
        const dialog = document.createElement('div');
        dialog.className = 'update-dialog-overlay';
        dialog.innerHTML = `
            <div class="update-dialog">
                <div class="update-dialog-header">
                    <h3>❌ 检查更新失败</h3>
                    <button class="update-dialog-close">×</button>
                </div>
                <div class="update-dialog-content">
                    <p>检查更新时出现错误：</p>
                    <p class="error-message">${error}</p>
                    <p>请检查网络连接后重试。</p>
                </div>
                <div class="update-dialog-actions">
                    <button class="btn btn-primary" data-action="close">确定</button>
                </div>
            </div>
        `;

        // 绑定事件处理器
        const closeBtn = dialog.querySelector('.update-dialog-close');
        const confirmBtn = dialog.querySelector('[data-action="close"]');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                dialog.remove();
            });
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                dialog.remove();
            });
        }

        document.body.appendChild(dialog);
    }
    /**
     * 下载更新
     */
    async downloadUpdate(updateInfoStr) {
        try {
            const updateInfo = JSON.parse(decodeURIComponent(updateInfoStr));
            console.log('📥 开始下载更新:', updateInfo);

            // 关闭对话框
            const dialog = document.querySelector('.update-dialog-overlay');
            if (dialog) {
                dialog.remove();
            }

            // 显示下载进度对话框
            this.showDownloadProgressDialog();

            // 调用主进程下载更新（不等待结果，通过事件监听器处理）
            window.electronAPI.downloadUpdate(updateInfo).catch((error) => {
                console.error('❌ 启动下载失败:', error);
                this.showDownloadErrorDialog(error.message || '启动下载失败');
            });

        } catch (error) {
            console.error('❌ 下载更新失败:', error);
            this.showDownloadErrorDialog(error.message || '下载更新失败');
        }
    }

    /**
     * 显示下载进度对话框
     */
    showDownloadProgressDialog() {
        // 先移除现有对话框
        const existingDialog = document.querySelector('.update-dialog-overlay');
        if (existingDialog) {
            existingDialog.remove();
        }

        const dialog = document.createElement('div');
        dialog.className = 'update-dialog-overlay';
        dialog.innerHTML = `
            <div class="update-dialog">
                <div class="update-dialog-header">
                    <h3>📥 正在下载更新</h3>
                </div>
                <div class="update-dialog-content">
                    <div class="download-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 0%"></div>
                        </div>
                        <p class="progress-text">准备下载...</p>
                    </div>
                </div>
            </div>        `;

        document.body.appendChild(dialog);
    }

    /**
     * 更新下载进度
     */
    updateDownloadProgress(progress) {
        const dialog = document.querySelector('.update-dialog-overlay');
        if (!dialog) return;

        const progressFill = dialog.querySelector('.progress-fill');
        const progressText = dialog.querySelector('.progress-text');

        if (progressFill && progressText) {
            const percent = Math.round(progress.percent || 0);
            progressFill.style.width = `${percent}%`;

            // 格式化显示文件大小
            const formatBytes = (bytes) => {
                if (bytes === 0) return '0 B';
                const k = 1024;
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            };

            const transferredFormatted = formatBytes(progress.transferredBytes || 0);
            const totalFormatted = formatBytes(progress.totalBytes || 0);

            if (progress.totalBytes > 0) {
                progressText.textContent = `下载中... ${percent}% (${transferredFormatted} / ${totalFormatted})`;
            } else {
                progressText.textContent = `下载中... ${transferredFormatted}`;
            }
        }
    }
    /**
     * 显示下载完成对话框
     */
    showDownloadCompleteDialog(filePath) {
        const dialog = document.querySelector('.update-dialog-overlay');
        if (dialog) {
            dialog.innerHTML = `
                <div class="update-dialog">
                    <div class="update-dialog-header">
                        <h3>✅ 下载完成</h3>
                        <button class="update-dialog-close">×</button>
                    </div>
                    <div class="update-dialog-content">
                        <p>更新文件已下载完成！</p>
                        <p>您可以选择立即安装或稍后手动安装。</p>
                    </div>
                    <div class="update-dialog-actions">
                        <button class="btn btn-secondary" data-action="show-folder">查看文件</button>
                        <button class="btn btn-primary" data-action="install">立即安装</button>
                    </div>
                </div>
            `;

            // 绑定事件处理器
            const closeBtn = dialog.querySelector('.update-dialog-close');
            const showFolderBtn = dialog.querySelector('[data-action="show-folder"]');
            const installBtn = dialog.querySelector('[data-action="install"]');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    dialog.remove();
                });
            }

            if (showFolderBtn) {
                showFolderBtn.addEventListener('click', () => {
                    this.showDownloadFolder(filePath);
                });
            }

            if (installBtn) {
                installBtn.addEventListener('click', () => {
                    this.installUpdate(filePath);
                });
            }
        }
    }
    /**
     * 显示下载错误对话框
     */
    showDownloadErrorDialog(error) {
        const dialog = document.querySelector('.update-dialog-overlay');
        if (dialog) {
            dialog.innerHTML = `
                <div class="update-dialog">
                    <div class="update-dialog-header">
                        <h3>❌ 下载失败</h3>
                        <button class="update-dialog-close">×</button>
                    </div>
                    <div class="update-dialog-content">
                        <p>下载更新时出现错误：</p>
                        <p class="error-message">${error}</p>
                    </div>
                    <div class="update-dialog-actions">
                        <button class="btn btn-primary" data-action="close">确定</button>
                    </div>
                </div>
            `;

            // 绑定事件处理器
            const closeBtn = dialog.querySelector('.update-dialog-close');
            const confirmBtn = dialog.querySelector('[data-action="close"]');

            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    dialog.remove();
                });
            }

            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    dialog.remove();
                });
            }
        }
    }

    /**
     * 安装更新
     */
    async installUpdate(filePath) {
        try {
            console.log('🔧 开始安装更新:', filePath);
            await window.electronAPI.installUpdate(filePath);
        } catch (error) {
            console.error('❌ 安装更新失败:', error);
            this.showUpdateErrorDialog(error.message || '安装更新失败');
        }
    }

    /**
     * 在文件夹中显示下载的文件
     */
    async showDownloadFolder(filePath) {
        try {
            await window.electronAPI.showItemInFolder(filePath);
        } catch (error) {
            console.error('❌ 打开文件夹失败:', error);
        }
    }

    switchTab(tabName) {
        // 更新选项卡按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // 显示对应面板
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-panel`);
        }); // 特殊处理社区选项卡
        if (tabName === 'community') {
            this.handleCommunityTab();
        }
    }

    /**
     * 更新标签页可见性
     */
    updateTabVisibility() {
        const tabs = [{
                id: 'clipboard-tab',
                setting: 'showClipboardTab'
            },
            {
                id: 'todo-tab',
                setting: 'showTodoTab'
            },
            {
                id: 'notes-tab',
                setting: 'showNotesTab'
            },
            {
                id: 'community-tab',
                setting: 'showCommunityTab'
            }
        ];

        tabs.forEach(tab => {
            const tabElement = document.querySelector(`[data-tab="${tab.id.replace('-tab', '')}"]`);
            if (tabElement) {
                const isVisible = this.state.settings[tab.setting];
                tabElement.style.display = isVisible ? '' : 'none';

                // 如果当前活跃的标签页被隐藏了，切换到第一个可见的标签页
                if (!isVisible && tabElement.classList.contains('active')) {
                    const firstVisibleTab = document.querySelector('.tab-btn:not([style*="display: none"])');
                    if (firstVisibleTab) {
                        this.switchTab(firstVisibleTab.dataset.tab);
                    }
                }
            }
        });
    }

    /**
     * 切换到指定页面
     */
    switchToPage(pageName) {
        // 将页面名称映射到选项卡名称
        const pageToTabMap = {
            'online': 'community', // 在线页面对应社区选项卡
            'clipboard': 'clipboard',
            'todo': 'todo',
            'notes': 'notes',
            'settings': 'settings'
        };

        const tabName = pageToTabMap[pageName] || pageName;
        this.switchTab(tabName);
    }
    /**
     * 导航到在线页面并打开指定URL
     */
    navigateToOnlinePageWithUrl(url) {
        console.log('🌐 收到导航请求，目标URL:', url);

        try {
            // 切换到社区(在线)页面
            this.switchToPage('online');

            // 等待页面切换完成后，导航到指定URL
            setTimeout(() => {
                const webview = document.getElementById('community-webview');
                if (webview) {
                    console.log('🌐 找到webview元素，设置URL:', url);
                    webview.src = url;
                    console.log('🌐 已设置webview.src为:', url);
                } else {
                    console.error('🌐 未找到community-webview元素，尝试外部打开');
                    // 如果找不到webview，直接在外部浏览器打开
                    if (window.electronAPI && window.electronAPI.openExternal) {
                        window.electronAPI.openExternal(url);
                    }
                }
            }, 500); // 增加等待时间确保页面切换完成
        } catch (error) {
            console.error('🌐 导航到在线页面失败:', error);
            // 出错时尝试外部浏览器
            if (window.electronAPI && window.electronAPI.openExternal) {
                window.electronAPI.openExternal(url);
            }
        }
    }
    searchClipboard(query) {
        if (this.clipboardManager) {
            this.clipboardManager.searchItems(query);
        }
    }

    // 社区相关方法
    handleCommunityTab() {
        const webview = document.getElementById('community-webview');
        const loading = document.getElementById('community-loading');

        if (!webview || !loading) return;

        // 渲染预设网站按钮
        this.renderPresetWebsites();

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
            console.log('页面加载提交');
        };

        // 监听加载失败
        const handleLoadFail = (event) => {
            console.error('页面加载失败:', event);
            loading.innerHTML = `
                <div class="loading-spinner">
                    <div style="font-size: 48px; margin-bottom: 16px;"><i class="fas fa-exclamation-triangle"></i></div>
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
                console.warn('页面加载超时');
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
                    <span>正在加载页面...</span>
                </div>
            `;
            loading.classList.remove('hidden');

            console.log('刷新页面');

            // 重新加载webview
            if (webview.reload) {
                webview.reload();
            } else {
                // 如果reload方法不可用，重新设置src
                const currentSrc = webview.src;
                webview.src = '';
                setTimeout(() => {
                    webview.src = currentSrc;
                }, 100);
            }
        }
    }

    openExternalCommunity() {
        const webview = document.getElementById('community-webview');
        if (webview && webview.src) {
            // 使用电子应用的API打开外部浏览器
            if (window.electronAPI && window.electronAPI.openExternal) {
                window.electronAPI.openExternal(webview.src);
            } else {
                // 如果没有API，使用window.open作为fallback
                window.open(webview.src, '_blank');
            }
        }
    }

    setupCommunityPanelListeners() {
        // 设置社区面板的控制按钮事件监听器

        // 刷新按钮
        const refreshBtn = document.getElementById('refresh-community');
        if (refreshBtn && !refreshBtn.dataset.listenerAdded) {
            refreshBtn.addEventListener('click', () => {
                this.refreshCommunity();
            });
            refreshBtn.dataset.listenerAdded = 'true';
        }

        // 外部打开按钮
        const externalBtn = document.getElementById('open-external');
        if (externalBtn && !externalBtn.dataset.listenerAdded) {
            externalBtn.addEventListener('click', () => {
                this.openExternalCommunity();
            });
            externalBtn.dataset.listenerAdded = 'true';
        }

        // 后退按钮
        const backBtn = document.getElementById('community-back');
        if (backBtn && !backBtn.dataset.listenerAdded) {
            backBtn.addEventListener('click', () => {
                const webview = document.getElementById('community-webview');
                if (webview && webview.canGoBack && webview.canGoBack()) {
                    webview.goBack();
                }
            });
            backBtn.dataset.listenerAdded = 'true';
        }

        // 前进按钮
        const forwardBtn = document.getElementById('community-forward');
        if (forwardBtn && !forwardBtn.dataset.listenerAdded) {
            forwardBtn.addEventListener('click', () => {
                const webview = document.getElementById('community-webview');
                if (webview && webview.canGoForward && webview.canGoForward()) {
                    webview.goForward();
                }
            });
            forwardBtn.dataset.listenerAdded = 'true';
        }

        // 主页按钮
        const homeBtn = document.getElementById('community-home');
        if (homeBtn && !homeBtn.dataset.listenerAdded) {
            homeBtn.addEventListener('click', () => {
                const webview = document.getElementById('community-webview');
                if (webview) {
                    webview.src = this.state.settings.communityUrl || 'http://8.130.41.186:3000/';
                }
            });
            homeBtn.dataset.listenerAdded = 'true';
        }
    }

    // 设置面板初始化
    initializeSettingsPanel() {
        // 初始化页面显示控制设置
        const showClipboardTab = document.getElementById('show-clipboard-tab');
        if (showClipboardTab) {
            showClipboardTab.checked = this.state.settings.showClipboardTab;
        }

        const showTodoTab = document.getElementById('show-todo-tab');
        if (showTodoTab) {
            showTodoTab.checked = this.state.settings.showTodoTab;
        }

        const showNotesTab = document.getElementById('show-notes-tab');
        if (showNotesTab) {
            showNotesTab.checked = this.state.settings.showNotesTab;
        }

        const showCommunityTab = document.getElementById('show-community-tab');
        if (showCommunityTab) {
            showCommunityTab.checked = this.state.settings.showCommunityTab;
        }

        // 更新标签页可见性
        this.updateTabVisibility();

        // 设置主题选择器的值
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = this.state.settings.theme;
        } // 设置毛玻璃效果开关
        const glassEffect = document.getElementById('glass-effect');
        if (glassEffect) {
            glassEffect.checked = this.state.settings.glassEffect;
        } // 设置窗口透明度（改为背景透明度）
        const windowOpacity = document.getElementById('window-opacity');
        if (windowOpacity) {
            windowOpacity.value = this.state.settings.windowOpacity || 1.0;
            this.updateSliderValue(windowOpacity, Math.round((this.state.settings.windowOpacity || 1.0) * 100) + '%');

            // 应用保存的背景透明度
            this.applyBackgroundOpacity(this.state.settings.windowOpacity || 1.0);
        }

        // 设置液态玻璃主题开关
        const liquidGlassTheme = document.getElementById('liquid-glass-theme');
        if (liquidGlassTheme) {
            liquidGlassTheme.checked = this.state.settings.liquidGlassTheme;
            this.toggleLiquidGlassControls(this.state.settings.liquidGlassTheme);
        }

        // 设置玻璃透明度
        const glassOpacity = document.getElementById('glass-opacity');
        if (glassOpacity) {
            glassOpacity.value = this.state.settings.liquidGlassOpacity;
            this.updateSliderValue(glassOpacity, Math.round(this.state.settings.liquidGlassOpacity * 100) + '%');
        }

        // 设置玻璃颜色
        const glassColor = document.getElementById('glass-color');
        if (glassColor) {
            glassColor.value = this.state.settings.liquidGlassColor;
        }

        // 设置自启动开关
        const autoStart = document.getElementById('auto-start');
        if (autoStart) {
            autoStart.checked = this.state.settings.autoStart;
        }

        // 设置置顶开关
        const alwaysOnTop = document.getElementById('always-on-top');
        if (alwaysOnTop) {
            alwaysOnTop.checked = this.state.settings.alwaysOnTop;
        }

        // 设置剪切板监控开关
        const clipboardMonitor = document.getElementById('clipboard-monitor');
        if (clipboardMonitor) {
            clipboardMonitor.checked = this.state.settings.clipboardMonitor;
        }

        // 设置重启清理剪切板开关
        const clearClipboardOnRestart = document.getElementById('clear-clipboard-on-restart');
        if (clearClipboardOnRestart) {
            clearClipboardOnRestart.checked = this.state.settings.clearClipboardOnRestart;
        } // 设置通知开关
        const enableNotifications = document.getElementById('enable-notifications');
        if (enableNotifications) {
            enableNotifications.checked = this.state.settings.enableNotifications;
        }

        // 设置动画速度
        const animationSpeed = document.getElementById('animation-speed');
        if (animationSpeed) {
            animationSpeed.value = this.state.settings.animationSpeed || 'normal';
        } // 设置社区URL输入框
        const communityUrlInput = document.getElementById('community-url');
        if (communityUrlInput) {
            communityUrlInput.value = this.state.settings.communityUrl || 'http://8.130.41.186:3000/';
        }

        // 渲染预设网站按钮
        this.renderPresetWebsites();
    }

    initializeAlwaysOnTopSetting() {
        // 从主进程获取当前置顶状态并同步到UI
        if (window.electronAPI && window.electronAPI.isAlwaysOnTop) {
            window.electronAPI.isAlwaysOnTop().then(isOnTop => {
                const alwaysOnTopCheckbox = document.getElementById('always-on-top');
                if (alwaysOnTopCheckbox) {
                    alwaysOnTopCheckbox.checked = isOnTop;
                    // 同步到应用状态
                    this.state.settings.alwaysOnTop = isOnTop;
                }
            }).catch(error => {
                console.error('获取置顶状态失败:', error);
            });
        }
    }

    // 预设网站相关方法
    initializePresetSelector() {
        const urlPreset = document.getElementById('url-preset');
        if (!urlPreset) return;

        // 清空现有选项
        urlPreset.innerHTML = '';

        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '选择预设网站';
        urlPreset.appendChild(defaultOption);

        // 添加预设网站选项
        this.state.settings.online.presetWebsites.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.url;
            option.textContent = preset.name;
            urlPreset.appendChild(option);
        });

        // 添加自定义选项
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = '自定义URL...';
        urlPreset.appendChild(customOption);

        // 设置当前值
        const currentUrl = this.state.settings.online.currentUrl || this.state.settings.communityUrl;
        if (currentUrl) {
            urlPreset.value = currentUrl;
        }
    }

    initializeCommunityWebview() {
        const webview = document.getElementById('community-webview');
        if (webview) {
            const url = this.state.settings.communityUrl || 'http://8.130.41.186:3000/';
            webview.src = url;
        }
    }

    // 预设网站管理相关方法
    showPresetWebsitesManager() {
        // 创建模态对话框
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content preset-manager-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-globe"></i> 管理预设网站</h3>
                    <button class="modal-close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div class="preset-list" id="preset-manager-list">
                        <!-- 预设网站列表将在这里生成 -->
                    </div>                    <div class="preset-actions">
                        <button class="btn btn-primary" id="add-preset-btn"><i class="fas fa-plus"></i> 添加网站</button>
                        <button class="btn btn-secondary" id="reset-presets-btn"><i class="fas fa-sync-alt"></i> 重置默认</button>
                        <button class="btn btn-info" id="update-all-favicons-btn"><i class="fas fa-magic"></i> 批量更新图标</button>
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
            button.title = website.name; // 显示网站名称而不是描述// 检查是否为当前激活的网站
            const currentUrl = this.state.settings.online.currentUrl || this.state.settings.communityUrl;
            if (website.url === currentUrl) {
                button.classList.add('active');
            }

            // 判断图标类型并正确显示
            let iconHtml = '';
            if (website.icon) {
                if (website.icon.startsWith('http')) {
                    // 如果是URL，显示为图片
                    iconHtml = `<img src="${website.icon}" style="width: 20px; height: 20px; object-fit: cover;" data-fallback="globe" />`;
                } else if (website.icon.startsWith('fa')) {
                    // 如果是FontAwesome类名
                    iconHtml = `<i class="${website.icon}"></i>`;
                } else {
                    // 其他情况（emoji等）
                    iconHtml = website.icon;
                }
            } else {
                iconHtml = '<i class="fas fa-globe"></i>';
            }
            button.innerHTML = `
                <span class="icon">${iconHtml}</span>
            `;

            // 为图片添加错误处理
            const img = button.querySelector('img[data-fallback]');
            if (img) {
                img.addEventListener('error', function () {
                    this.outerHTML = '<i class="fas fa-globe"></i>';
                });
            }

            button.addEventListener('click', () => {
                this.switchToPresetWebsite(website);
            });
            container.appendChild(button);
        });
    }

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
    }
    renderPresetManagerList() {
        const list = document.getElementById('preset-manager-list');
        if (!list) return;

        const presets = this.state.settings.online.presetWebsites;
        list.innerHTML = '';

        presets.forEach((preset, index) => {
            const item = document.createElement('div');
            item.className = 'preset-item';
            // 判断图标类型：FontAwesome类名、emoji表情或favicon URL
            const isEmojiOrUrl = !preset.icon.startsWith('fa');
            const iconDisplay = isEmojiOrUrl ?
                (preset.icon.startsWith('http') ?
                    `<img src="${preset.icon}" style="width: 16px; height: 16px; object-fit: cover;" />` :
                    preset.icon) :
                `<i class="${preset.icon}"></i>`;

            item.innerHTML = `
                <div class="preset-item-info">
                    <div class="preset-icon-container">
                        <div class="icon-preview" title="当前图标">${iconDisplay}</div>
                        <button class="btn btn-sm btn-secondary auto-favicon-btn" data-index="${index}" title="自动获取图标">
                            <i class="fas fa-magic"></i>
                        </button>
                    </div>                    <input type="text" class="preset-name" value="${preset.name}" placeholder="网站名称">
                    <input type="url" class="preset-url" value="${preset.url}" placeholder="网站URL" data-index="${index}">
                </div>
                <div class="preset-item-actions">
                    <button class="btn btn-sm btn-secondary move-up" data-index="${index}" ${index === 0 ? 'disabled' : ''}><i class="fas fa-chevron-up"></i></button>
                    <button class="btn btn-sm btn-secondary move-down" data-index="${index}" ${index === presets.length - 1 ? 'disabled' : ''}><i class="fas fa-chevron-down"></i></button>
                    <button class="btn btn-sm btn-danger delete-preset" data-index="${index}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            list.appendChild(item);
        });

        // 添加URL变化监听器，自动获取favicon
        const self = this; // 保存this引用
        list.addEventListener('input', async function (e) {
            if (e.target.classList.contains('preset-url')) {
                const index = parseInt(e.target.dataset.index);
                const url = e.target.value.trim();

                if (url && self.isValidUrl(url)) {
                    const iconPreview = e.target.closest('.preset-item').querySelector('.icon-preview');

                    // 显示加载状态
                    iconPreview.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                    try {
                        console.log('🔍 URL变化，自动获取图标:', url);
                        const favicon = await self.getFaviconWithRetry(url);
                        if (favicon && favicon !== 'fas fa-globe') {
                            // 更新预览
                            const isUrl = favicon.startsWith('http');
                            iconPreview.innerHTML = isUrl ?
                                `<img src="${favicon}" style="width: 16px; height: 16px; object-fit: cover;" />` :
                                favicon.startsWith('fa') ?
                                `<i class="${favicon}"></i>` :
                                favicon;

                            // 更新数据
                            self.state.settings.online.presetWebsites[index].icon = favicon;
                            console.log('✅ 自动更新图标成功:', favicon);
                        } else {
                            iconPreview.innerHTML = '<i class="fas fa-globe"></i>';
                        }
                    } catch (error) {
                        console.warn('❌ 自动获取favicon失败:', error.message);
                        iconPreview.innerHTML = '<i class="fas fa-globe"></i>';
                    }
                }
            }
        });

        // 为所有预设管理器中的图片添加错误处理
        list.addEventListener('error', function (e) {
            if (e.target.tagName === 'IMG' && e.target.closest('.icon-preview')) {
                e.target.outerHTML = '<i class="fas fa-globe"></i>';
            }
        }, true);
    }

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
        }); // 重置默认预设
        modal.querySelector('#reset-presets-btn').addEventListener('click', () => {
            if (confirm('确定要重置为默认预设网站吗？这将清除所有自定义设置。')) {
                this.resetDefaultPresets();
            }
        });

        // 批量更新所有图标
        modal.querySelector('#update-all-favicons-btn').addEventListener('click', async () => {
            const btn = modal.querySelector('#update-all-favicons-btn');
            const originalText = btn.innerHTML;

            if (confirm('确定要批量更新所有网站的图标吗？这可能需要一些时间。')) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 更新中...';
                btn.disabled = true;

                try {
                    const updated = await this.updateAllPresetFavicons();
                    if (updated) {
                        btn.innerHTML = '<i class="fas fa-check"></i> 更新完成';
                        setTimeout(() => {
                            btn.innerHTML = originalText;
                        }, 2000);
                    } else {
                        btn.innerHTML = '<i class="fas fa-info-circle"></i> 无需更新';
                        setTimeout(() => {
                            btn.innerHTML = originalText;
                        }, 2000);
                    }
                } catch (error) {
                    console.error('批量更新图标失败:', error);
                    alert('批量更新图标失败，请检查网络连接');
                    btn.innerHTML = originalText;
                } finally {
                    btn.disabled = false;
                }
            }
        });

        // 设置列表项事件委托
        const self = this; // 保存this引用
        modal.querySelector('#preset-manager-list').addEventListener('click', async function (e) {
            const index = parseInt(e.target.dataset.index);

            if (e.target.classList.contains('move-up')) {
                self.movePreset(index, -1);
            } else if (e.target.classList.contains('move-down')) {
                self.movePreset(index, 1);
            } else if (e.target.classList.contains('delete-preset')) {
                // 获取预设网站信息
                const preset = self.state.settings.online.presetWebsites[index];
                const presetName = preset ? preset.name : '预设网站';

                // 使用统一删除确认对话框
                if (window.app && window.app.showDeleteConfirmDialog) {
                    window.app.showDeleteConfirmDialog({
                        title: '删除预设网站',
                        itemName: presetName,
                        itemType: '预设网站',
                        onConfirm: () => {
                            self.deletePreset(index);
                        }
                    });
                } else {
                    // 备用确认方式
                    if (confirm('确定要删除这个预设网站吗？')) {
                        self.deletePreset(index);
                    }
                }
            } else if (e.target.classList.contains('auto-favicon-btn') || e.target.closest('.auto-favicon-btn')) {
                // 处理自动获取favicon按钮
                const btn = e.target.classList.contains('auto-favicon-btn') ? e.target : e.target.closest('.auto-favicon-btn');
                const actualIndex = parseInt(btn.dataset.index);
                const urlInput = btn.closest('.preset-item').querySelector('.preset-url');
                const iconPreview = btn.closest('.preset-item').querySelector('.icon-preview');
                const url = urlInput.value.trim();

                if (!url || !self.isValidUrl(url)) {
                    alert('请先输入有效的网站URL');
                    return;
                }

                // 显示加载状态
                const originalIcon = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                btn.disabled = true;
                iconPreview.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                try {
                    const favicon = await self.getFaviconForUrl(url);
                    if (favicon) { // 更新预览
                        const isUrl = favicon.startsWith('http');
                        iconPreview.innerHTML = isUrl ?
                            `<img src="${favicon}" style="width: 16px; height: 16px; object-fit: cover;" />` :
                            favicon.startsWith('fa') ?
                            `<i class="${favicon}"></i>` :
                            favicon;

                        // 更新数据
                        self.state.settings.online.presetWebsites[actualIndex].icon = favicon;

                        // 显示成功提示
                        btn.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(() => {
                            btn.innerHTML = originalIcon;
                        }, 1000);
                    } else {
                        throw new Error('无法获取favicon');
                    }
                } catch (error) {
                    console.warn('获取favicon失败:', error);
                    iconPreview.innerHTML = '<i class="fas fa-globe"></i>';
                    alert('获取网站图标失败，请检查网址是否正确');
                    btn.innerHTML = originalIcon;
                } finally {
                    btn.disabled = false;
                }
            }
        });
    }
    async addNewPreset(url = null, name = null) {
        const newPreset = {
            id: 'custom_' + Date.now(),
            name: name || '新网站',
            url: url || 'https://example.com',
            icon: 'fas fa-globe'
        };

        // 如果提供了URL，尝试自动获取favicon
        if (url && this.isValidUrl(url)) {
            try {
                console.log('🔍 为新预设网站获取图标:', url);
                const favicon = await this.getFaviconWithRetry(url);
                if (favicon && favicon !== 'fas fa-globe') {
                    newPreset.icon = favicon;
                    console.log('✅ 成功为新网站设置图标:', favicon);
                }
            } catch (error) {
                console.warn('❌ 获取新预设网站的favicon失败:', error.message);
            }
        }

        this.state.settings.online.presetWebsites.push(newPreset);
        this.renderPresetManagerList();
    }

    movePreset(index, direction) {
        const presets = this.state.settings.online.presetWebsites;
        const newIndex = index + direction;

        if (newIndex >= 0 && newIndex < presets.length) {
            [presets[index], presets[newIndex]] = [presets[newIndex], presets[index]];
            this.renderPresetManagerList();
        }
    }

    deletePreset(index) {
        this.state.settings.online.presetWebsites.splice(index, 1);
        this.renderPresetManagerList();
    }

    resetDefaultPresets() {
        this.state.settings.online.presetWebsites = [{
                id: 'default',
                name: '移记社区',
                url: 'http://8.130.41.186:3000/',
                icon: '🏠'
            },
            {
                id: 'github',
                name: 'GitHub',
                url: 'https://github.com',
                icon: '📁'
            },
            {
                id: 'stackoverflow',
                name: 'Stack Overflow',
                url: 'https://stackoverflow.com',
                icon: '❓'
            },
            {
                id: 'chatgpt',
                name: 'ChatGPT',
                url: 'https://chat.openai.com',
                icon: '🤖'
            },
            {
                id: 'translate',
                name: '谷歌翻译',
                url: 'https://translate.google.com',
                icon: '🌐'
            },
            {
                id: 'douban',
                name: '豆瓣',
                url: 'https://www.douban.com',
                icon: '📚'
            },
            {
                id: 'bing',
                name: '必应搜索',
                url: 'https://www.bing.com',
                icon: '🔍'
            },
            {
                id: 'wikipedia',
                name: '维基百科',
                url: 'https://zh.wikipedia.org',
                icon: '📖'
            },
            {
                id: 'codepen',
                name: 'CodePen',
                url: 'https://codepen.io',
                icon: 'fas fa-code'
            },
            {
                id: 'youtube',
                name: 'YouTube',
                url: 'https://www.youtube.com',
                icon: 'fab fa-youtube'
            },
            {
                id: 'bilibili',
                name: 'Bilibili',
                url: 'https://www.bilibili.com',
                icon: 'fas fa-video'
            },
            {
                id: 'zhihu',
                name: '知乎',
                url: 'https://www.zhihu.com',
                icon: '💭'
            }
        ];
        this.renderPresetManagerList();

        // 更新预设选择器
        this.initializePresetSelector();
    }

    // 保存预设设置
    savePresetSettings() {
        const items = document.querySelectorAll('.preset-item');
        const newPresets = [];
        items.forEach((item, index) => {
            const name = item.querySelector('.preset-name').value.trim();
            const url = item.querySelector('.preset-url').value.trim();

            if (name && url) {
                // 保持现有图标，不从输入框读取
                const currentPreset = this.state.settings.online.presetWebsites[index];
                newPresets.push({
                    id: currentPreset ?.id || 'custom_' + Date.now(),
                    name: name,
                    url: url,
                    icon: currentPreset ?.icon || 'fas fa-globe'
                });
            }
        });

        this.state.settings.online.presetWebsites = newPresets;
        this.state.saveData();

        // 更新预设选择器
        this.initializePresetSelector();
    }

    initializePresetSelector() {
        const urlPresetSelect = document.getElementById('url-preset');
        if (!urlPresetSelect) return;

        // 清空选项
        urlPresetSelect.innerHTML = '<option value="">选择预设页面</option>';

        // 添加预设网站选项
        if (this.state.settings.online && this.state.settings.online.presetWebsites) {
            this.state.settings.online.presetWebsites.forEach(website => {
                const option = document.createElement('option');
                option.value = website.url;
                option.textContent = website.name;
                urlPresetSelect.appendChild(option);
            });
        }

        // 添加自定义选项
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = '自定义地址';
        urlPresetSelect.appendChild(customOption);
    } // 自动获取网站favicon的方法 - 使用xxapi.cn接口
    async getFaviconForUrl(url) {
        try {
            // 构建API请求URL
            const apiUrl = `https://v2.xxapi.cn/api/ico?url=${encodeURIComponent(url)}`;

            console.log('🔍 正在获取网站图标:', url);

            // 使用fetch请求API
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000 // 10秒超时
            });

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            const data = await response.json();

            // 检查API返回的数据结构
            if (data && data.code === 200 && data.data) {
                const iconUrl = data.data;
                console.log('✅ 成功获取网站图标:', iconUrl);
                return iconUrl;
            } else if (data && data.ico) {
                // 兼容不同的返回格式
                console.log('✅ 成功获取网站图标:', data.ico);
                return data.ico;
            } else {
                throw new Error('API返回格式不正确');
            }
        } catch (error) {
            console.warn('❌ 获取favicon失败:', error.message);

            // 如果API失败，回退到备用方案
            try {
                const urlObj = new URL(url);
                const domain = urlObj.hostname;
                const fallbackUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
                console.log('🔄 使用备用方案:', fallbackUrl);
                return fallbackUrl;
            } catch (fallbackError) {
                console.warn('❌ 备用方案也失败了:', fallbackError.message);
                return 'fas fa-globe'; // 最终默认图标
            }
        }
    }

    // 带重试机制的favicon获取函数
    async getFaviconWithRetry(url, maxRetries = 2) {
        for (let i = 0; i <= maxRetries; i++) {
            try {
                const result = await this.getFaviconForUrl(url);
                if (result && result !== 'fas fa-globe') {
                    return result;
                }
            } catch (error) {
                console.warn(`第${i + 1}次获取favicon失败:`, error.message);
                if (i === maxRetries) {
                    throw error;
                }
                // 等待一秒后重试
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return 'fas fa-globe';
    }

    // 验证favicon URL是否有效
    async validateFaviconUrl(faviconUrl) {
        try {
            const response = await fetch(faviconUrl, {
                method: 'HEAD',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // 检查URL是否有效并尝试获取favicon
    async validateUrlAndGetFavicon(url) {
        if (!url || !this.isValidUrl(url)) {
            return null;
        }

        try {
            const favicon = await this.getFaviconForUrl(url);
            return favicon;
        } catch (error) {
            console.warn('验证URL和获取favicon失败:', error);
            return null;
        }
    } // 批量更新所有预设网站的favicon
    async updateAllPresetFavicons() {
        const presets = this.state.settings.online.presetWebsites;
        let updated = false;
        let successCount = 0;
        let totalCount = 0;

        console.log('🔄 开始批量更新网站图标...');

        for (let i = 0; i < presets.length; i++) {
            const preset = presets[i];
            if (preset.url && this.isValidUrl(preset.url)) {
                totalCount++;
                try {
                    console.log(`📡 正在获取 ${preset.name} 的图标...`);
                    const favicon = await this.getFaviconWithRetry(preset.url);

                    if (favicon && favicon !== preset.icon && favicon !== 'fas fa-globe') {
                        preset.icon = favicon;
                        updated = true;
                        successCount++;
                        console.log(`✅ 已更新 ${preset.name} 的图标:`, favicon);
                    } else {
                        console.log(`ℹ️ ${preset.name} 的图标无需更新`);
                    }
                } catch (error) {
                    console.warn(`❌ 获取 ${preset.name} 的favicon失败:`, error.message);
                }

                // 添加延迟，避免请求过于频繁
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        if (updated) {
            this.state.saveData();
            this.renderPresetWebsites();
            this.renderPresetManagerList();
        }

        console.log(`🎉 批量更新完成: 成功更新 ${successCount}/${totalCount} 个网站图标`);
        return updated;
    }

    // 检查并在后台更新favicon（只更新缺失的或无效的）
    async checkAndUpdateFavicons() {
        try {
            const presets = this.state.settings.online.presetWebsites;
            let needsUpdate = false;

            for (const preset of presets) {
                // 检查是否需要更新：没有图标、是默认图标、或者是无效的FontAwesome类名
                if (!preset.icon ||
                    preset.icon === 'fas fa-globe' ||
                    (preset.icon.startsWith('fa') && !this.isValidFontAwesomeIcon(preset.icon))) {
                    needsUpdate = true;
                    break;
                }
            }

            // 只有在需要时才更新，避免不必要的网络请求
            if (needsUpdate) {
                console.log('🔄 检测到需要更新的网站图标，开始后台更新...');
                await this.updateAllPresetFavicons();
                console.log('✅ 网站图标后台更新完成');
            }
        } catch (error) {
            console.warn('后台更新favicon失败:', error);
        }
    }

    // 检查FontAwesome图标是否有效（简单检查）
    isValidFontAwesomeIcon(iconClass) {
        // 检查是否是常见的FontAwesome图标格式
        const validPrefixes = ['fas', 'far', 'fab', 'fal', 'fad'];
        const parts = iconClass.split(' ');
        return parts.length >= 2 && validPrefixes.includes(parts[0]) && parts[1].startsWith('fa-');
    }

    // 工具函数：验证URL是否有效
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    /**
     * 显示统一的删除确认对话框
     * @param {Object} options - 配置选项
     * @param {string} options.title - 对话框标题
     * @param {string} options.itemName - 要删除的项目名称
     * @param {string} options.itemType - 项目类型描述
     * @param {Function} options.onConfirm - 确认删除的回调函数
     */
    showDeleteConfirmDialog(options) {
        const {
            title,
            itemName,
            itemType,
            onConfirm
        } = options;

        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'modal delete-confirm-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">
                        <span class="modal-icon" style="color: var(--danger-color);"><i class="fas fa-exclamation-triangle"></i></span>
                        <h3>${title}</h3>
                    </div>
                    <button class="modal-close">&times;</button>
                </div>                <div class="modal-body">
                    <div class="delete-confirm-content">
                        
                        <div class="warning-text">
                            <p>确定要删除以下${itemType}吗？</p>
                            <div class="item-preview">${this.escapeHtml(itemName)}</div>
                            <p class="warning-note">此操作无法撤销，请谨慎操作。</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-delete">
                        <span class="btn-icon"><i class="fas fa-times"></i></span>
                        取消
                    </button>
                    <button class="btn btn-danger" id="confirm-delete">
                        删除
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 添加 active 类以触发动画
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);

        // 添加事件监听器
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeDeleteConfirmDialog(modal);
        });

        modal.querySelector('#cancel-delete').addEventListener('click', () => {
            this.closeDeleteConfirmDialog(modal);
        });

        modal.querySelector('#confirm-delete').addEventListener('click', () => {
            if (onConfirm && typeof onConfirm === 'function') {
                onConfirm();
            }
            this.closeDeleteConfirmDialog(modal);
        });

        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeDeleteConfirmDialog(modal);
            }
        });

        // ESC 键关闭
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeDeleteConfirmDialog(modal);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // 保存 escHandler 以便在关闭时清理
        modal._escHandler = escHandler;

        // 自动聚焦到取消按钮（更安全的默认选择）
        setTimeout(() => {
            modal.querySelector('#cancel-delete').focus();
        }, 100);
    }

    /**
     * 关闭删除确认对话框
     */
    closeDeleteConfirmDialog(modal) {
        modal.classList.remove('active');

        // 清理 ESC 事件监听器
        if (modal._escHandler) {
            document.removeEventListener('keydown', modal._escHandler);
        }

        // 等待动画完成后移除元素
        setTimeout(() => {
            if (modal && modal.parentNode) {
                document.body.removeChild(modal);
            }
        }, 300);
    }
    /**
     * HTML 转义函数，防止 XSS 攻击
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    /**
     * 应用动画速度设置
     * @param {string} speed - 动画速度 ('fast', 'normal', 'slow')
     */
    async applyAnimationSpeed(speed) {
        // 定义不同速度级别的设置
        const speedSettings = {
            'fast': {
                css: '0.1s',
                showAnimation: 100, // 显示动画持续时间(毫秒)
                hideAnimation: 30 // 隐藏动画持续时间(毫秒)
            },
            'normal': {
                css: '0.15s',
                showAnimation: 150,
                hideAnimation: 40
            },
            'slow': {
                css: '0.3s',
                showAnimation: 300,
                hideAnimation: 80
            }
        };

        const settings = speedSettings[speed] || speedSettings['normal'];

        // 更新 CSS 变量
        document.documentElement.style.setProperty('--transition-duration', settings.css);

        // 应用到所有使用 var(--transition) 的元素
        const transitionRule = `all ${settings.css} cubic-bezier(0.4, 0, 0.2, 1)`;
        document.documentElement.style.setProperty('--transition', transitionRule);

        // 更新窗口动画设置
        if (window.electronAPI && window.electronAPI.updateAnimationSettings) {
            try {
                await window.electronAPI.updateAnimationSettings({
                    showAnimationDuration: settings.showAnimation,
                    hideAnimationDuration: settings.hideAnimation
                });
                console.log('已更新窗口动画速度:', speed, '显示:', settings.showAnimation + 'ms', '隐藏:', settings.hideAnimation + 'ms');
            } catch (error) {
                console.error('更新窗口动画设置失败:', error);
            }
        }

        console.log('应用动画速度:', speed, 'CSS持续时间:', settings.css);
    }

    // 切换液态玻璃控制项的显示/隐藏
    toggleLiquidGlassControls(show) {
        const controls = document.querySelectorAll('.liquid-glass-controls');
        controls.forEach(control => {
            control.style.display = show ? 'block' : 'none';
        });
    }

    updateSliderValue(slider, value) {
        const valueSpan = slider.parentElement.querySelector('.slider-value');
        if (valueSpan) {
            valueSpan.textContent = value;
        }
    }

    // 初始化液态玻璃主题的鼠标追踪效果
    initializeLiquidGlassMouseTracking() {
        if (!document.body.classList.contains('liquid-glass-theme')) return;

        const updateMousePosition = (e, element) => {
            const rect = element.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width * 100);
            const y = ((e.clientY - rect.top) / rect.height * 100);
            element.style.setProperty('--mouse-x', x + '%');
            element.style.setProperty('--mouse-y', y + '%');
        };

        // 为所有液态玻璃元素添加鼠标追踪
        const glassElements = document.querySelectorAll('.liquid-glass-theme .clipboard-item, .liquid-glass-theme .todo-item, .liquid-glass-theme .note-item, .liquid-glass-theme .btn');

        glassElements.forEach(element => {
            element.addEventListener('mousemove', (e) => updateMousePosition(e, element));
            element.addEventListener('mouseleave', () => {
                element.style.removeProperty('--mouse-x');
                element.style.removeProperty('--mouse-y');
            });
        });
    }

    // 应用液态玻璃主题时重新初始化鼠标追踪
    reinitializeLiquidGlassEffects() {
        // 移除旧的事件监听器（通过重新克隆元素）
        setTimeout(() => {
            this.initializeLiquidGlassMouseTracking();
        }, 100);
    }

    // 更新整个应用程序的透明度
    updateAppOpacity(opacity) {
        // 通过ThemeManager更新透明度
        this.themeManager.updateLiquidGlassOpacity(opacity);

        // 强制重新应用液态玻璃效果到所有元素
        if (this.state.settings.liquidGlassTheme) {
            setTimeout(() => {
                this.reinitializeLiquidGlassEffects();
            }, 50);
        }
    }
    /**
     * 根据设置值应用背景透明度
     * @param {number} opacity - 背景透明度值 (0.1-1.0)
     */
    applyBackgroundOpacity(opacity) {
        // 设置CSS变量来控制背景透明度
        document.documentElement.style.setProperty('--window-background-opacity', opacity);

        console.log('✅ 应用背景透明度:', opacity);

        // 不再需要文字保护，因为只有背景透明
        // 移除之前的文字保护类
        document.body.classList.remove('transparent-window-protection');
    }

    /**
     * 根据窗口透明度应用文字保护样式
     * @param {number} opacity - 窗口透明度值 (0.1-1.0)
     */
    applyTextProtection(opacity) {
        const body = document.body;

        // 当透明度低于0.95时启用文字保护（更宽松的阈值）
        if (opacity < 0.95) {
            body.classList.add('transparent-window-protection');
            console.log('✅ 启用文字保护，透明度:', opacity);
            console.log('🎯 当前body类名:', body.className);
        } else {
            body.classList.remove('transparent-window-protection');
            console.log('❌ 禁用文字保护，透明度:', opacity);
            console.log('🎯 当前body类名:', body.className);
        }

        // 强制重新应用样式
        body.style.opacity = '1';

        // 给所有文字元素强制设置opacity
        const textElements = body.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, label, div, button, input, textarea, i, .setting-text, .setting-label');
        textElements.forEach(element => {
            element.style.opacity = '1';
            element.style.setProperty('opacity', '1', 'important');
        });

        console.log(`🔧 已处理 ${textElements.length} 个文字元素的透明度`);
    }
    /**
     * 显示图片预览模态框
     * @param {string} imageData - 图片的base64数据或URL
     * @param {boolean} autoReset - 是否自动重置到原始大小和位置
     */
    showImagePreview(imageData, autoReset = false) {
        console.log('🖼️ 显示图片预览:', imageData ? '有图片数据' : '无图片数据', autoReset ? '(重置模式)' : '');

        if (!imageData) {
            console.error('❌ 无效的图片数据');
            return;
        }

        // 创建模态框元素
        const modal = document.createElement('div');
        modal.className = 'image-preview-modal';
        modal.innerHTML = `
            <button class="image-preview-close" title="关闭预览">&times;</button>
            <div class="image-preview-container">
                <img src="${imageData}" alt="图片预览" class="image-preview-content">
            </div>            <div class="image-preview-controls">
                <span class="zoom-info">100%</span>
                <button class="zoom-btn" data-action="reset" title="重置到原始大小 (1:1)">
                    <i class="fas fa-undo"></i> 重置
                </button>
                <button class="zoom-btn" data-action="fit" title="适应窗口大小">
                    <i class="fas fa-expand-arrows-alt"></i> 适应
                </button>
            </div>
        `; // 添加到页面
        document.body.appendChild(modal);

        // 图片缩放和拖拽状态
        let scale = 1;
        let translateX = 0;
        let translateY = 0;
        let isDragging = false;
        let lastMouseX = 0;
        let lastMouseY = 0;
        let hasBeenDragged = false; // 添加标记来跟踪是否发生了拖拽
        let animationId = null; // 用于requestAnimationFrame
        let needsUpdate = false; // 标记是否需要更新

        const img = modal.querySelector('.image-preview-content');
        const container = modal.querySelector('.image-preview-container');
        const zoomInfo = modal.querySelector('.zoom-info');

        // 安全检查：确保元素存在
        if (!img || !container || !zoomInfo) {
            console.error('❌ 图片预览元素未找到');
            document.body.removeChild(modal);
            return;
        }

        // 启用硬件加速
        img.style.willChange = 'transform';
        img.style.transform = 'translate3d(0, 0, 0) scale(1)'; // 初始化3D变换

        // 性能优化的更新函数
        const scheduleUpdate = () => {
            if (!needsUpdate) {
                needsUpdate = true;
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
                animationId = requestAnimationFrame(performUpdate);
            }
        };

        const performUpdate = () => {
            if (needsUpdate) {
                // 使用3D变换启用硬件加速
                img.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`;
                zoomInfo.textContent = `${Math.round(scale * 100)}%`;
                needsUpdate = false;
                animationId = null;
            }
        };

        // 更新图片变换 - 使用性能优化版本
        const updateImageTransform = () => {
            scheduleUpdate();
        }; // 重置图片位置和大小到原始状态
        const resetImage = () => {
            console.log('🔄 重置图片到原始状态');
            scale = 1; // 1:1 原始大小
            translateX = 0; // 居中
            translateY = 0; // 居中
            updateImageTransform();

            // 更新鼠标样式（原始大小时通常不需要拖拽）
            img.style.cursor = 'default';
        };

        // 适应窗口大小
        const fitToWindow = () => {
            const containerRect = container.getBoundingClientRect();
            const imgRect = img.getBoundingClientRect();

            const scaleX = (containerRect.width * 0.9) / img.naturalWidth;
            const scaleY = (containerRect.height * 0.9) / img.naturalHeight;

            scale = Math.min(scaleX, scaleY, 1);
            translateX = 0;
            translateY = 0;
            updateImageTransform();
        };

        // 滚轮缩放
        const handleWheel = (e) => {
            e.preventDefault();

            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newScale = Math.max(0.1, Math.min(5, scale + delta));

            if (newScale !== scale) {
                // 计算鼠标位置相对于图片的位置
                const rect = img.getBoundingClientRect();
                const mouseX = e.clientX - rect.left - rect.width / 2;


                // 调整平移以保持鼠标位置不变
                translateX -= mouseX * (newScale - scale) / scale;
                translateY -= mouseY * (newScale - scale) / scale;

                scale = newScale;
                updateImageTransform();
            }
        }; // 鼠标拖拽 - 性能优化版本
        const handleMouseDown = (e) => {
            if (e.target === img) {
                isDragging = true;
                hasBeenDragged = false; // 重置拖拽标记
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                img.style.cursor = 'grabbing';
                // 在拖拽开始时禁用过渡动画
                img.style.transition = 'none';
                e.preventDefault();
                e.stopPropagation(); // 阻止事件冒泡
            }
        };
        const handleMouseMove = (e) => {
            if (isDragging) {
                // 使用更高效的差值计算
                const deltaX = e.clientX - lastMouseX;
                const deltaY = e.clientY - lastMouseY;

                // 只有在移动距离足够大时才更新（减少不必要的更新）
                if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
                    // 如果移动距离超过阈值，标记为已拖拽
                    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
                        hasBeenDragged = true;
                    }

                    translateX += deltaX;
                    translateY += deltaY;

                    lastMouseX = e.clientX;
                    lastMouseY = e.clientY;

                    updateImageTransform();
                }
                e.preventDefault();
            }
        };
        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                img.style.cursor = scale > 1 ? 'grab' : 'default';
            }
        }; // 关闭预览函数
        const closePreview = () => {
            console.log('🚪 关闭图片预览');

            // 清理事件监听器
            document.removeEventListener('keydown', handleKeydown);
            container.removeEventListener('wheel', handleWheel);
            img.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);

            // 清理动画帧
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }

            // 从DOM中移除模态框
            if (modal && modal.parentNode) {
                document.body.removeChild(modal);
            }
        };

        // 点击关闭按钮
        const closeBtn = modal.querySelector('.image-preview-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closePreview();
            });
        } // 点击背景关闭 - 修复拖拽时意外关闭的问题
        modal.addEventListener('click', (e) => {
            // 只有在没有拖拽状态下，且没有发生过拖拽，且点击的是背景区域时才关闭
            if (!isDragging && !hasBeenDragged && (e.target === modal || e.target === container)) {
                closePreview();
            }
        });

        // 控制按钮事件
        const zoomBtns = modal.querySelectorAll('.zoom-btn');
        zoomBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                if (action === 'reset') {
                    resetImage();
                } else if (action === 'fit') {
                    fitToWindow();
                }
            });
        });

        // ESC键关闭
        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                closePreview();
            }
        }; // 添加事件监听
        document.addEventListener('keydown', handleKeydown);
        container.addEventListener('wheel', handleWheel);
        img.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // 阻止图片的点击事件冒泡，防止意外关闭
        img.addEventListener('click', (e) => {
            e.stopPropagation();
        }); // 为图片添加加载完成事件
        img.addEventListener('load', () => {
            console.log('✅ 预览图片加载完成');
            // 设置初始鼠标样式
            img.style.cursor = 'grab';

            // 根据模式选择初始显示方式
            if (autoReset) {
                // 重置模式：显示图片原始大小（1:1），居中显示
                console.log('🔄 应用重置模式 - 显示原始大小');
                resetImage();
            } else {
                // 默认模式：适应窗口大小
                setTimeout(fitToWindow, 100);
            }
        });

        img.addEventListener('error', () => {
            console.error('❌ 预览图片加载失败');
            closePreview();
        });

        console.log('✅ 图片预览模态框已创建');
    }
}

// 导出到全局
window.App = App;