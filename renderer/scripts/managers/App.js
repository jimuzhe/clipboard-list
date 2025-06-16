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

        // 设置事件监听器
        this.setupEventListeners();

        // 初始化UI
        this.initializeUI();

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
        this.setupCommunityListeners();

        // 设置更新事件监听器
        this.setupUpdateListeners();
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

        // URL预设选择器
        const urlPreset = document.getElementById('url-preset');
        if (urlPreset) {
            urlPreset.addEventListener('change', (e) => {
                const selectedUrl = e.target.value;
                const communityUrlInput = document.getElementById('community-url');

                if (selectedUrl && selectedUrl !== 'custom' && communityUrlInput) {
                    // 如果选择了预设URL，更新输入框
                    communityUrlInput.value = selectedUrl;
                } else if (selectedUrl === 'custom') {
                    // 如果选择自定义，聚焦到输入框
                    if (communityUrlInput) {
                        communityUrlInput.focus();
                    }
                }
            });
        }

        // 应用社区URL按钮
        const applyCommunityUrl = document.getElementById('apply-community-url');
        if (applyCommunityUrl) {
            applyCommunityUrl.addEventListener('click', () => {
                const communityUrlInput = document.getElementById('community-url');
                if (communityUrlInput) {
                    const newUrl = communityUrlInput.value.trim();

                    if (!newUrl) {
                        alert('请输入有效的URL地址');
                        return;
                    }

                    if (!this.isValidUrl(newUrl)) {
                        alert('请输入有效的URL地址，需要包含 http:// 或 https://');
                        return;
                    }

                    // 更新设置
                    this.state.settings.communityUrl = newUrl;
                    this.state.settings.online.currentUrl = newUrl;
                    this.state.saveData();

                    // 更新webview
                    this.updateCommunityUrl(newUrl);

                    // 显示成功提示
                    this.showUrlUpdateSuccess();

                    // 重新渲染预设按钮（更新激活状态）
                    this.renderPresetWebsites();

                    console.log('社区URL已更新为:', newUrl);
                }
            });
        }

        // 管理预设网站按钮
        const managePresetWebsites = document.getElementById('manage-preset-websites');
        if (managePresetWebsites) {
            managePresetWebsites.addEventListener('click', () => {
                this.showPresetManager();
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
        const checkUpdateBtn = document.getElementById('check-update');
        if (checkUpdateBtn) {
            checkUpdateBtn.addEventListener('click', () => {
                this.checkForUpdates();
            });
        }
    }

    initializeUI() {
        // 设置默认选项卡
        this.switchTab('clipboard');

        // 初始化设置面板的值
        this.initializeSettingsPanel();

        // 初始化预设选择器
        this.initializePresetSelector();

        // 初始化社区webview URL
        this.initializeCommunityWebview();

        // 应用主题
        this.themeManager.applyTheme(this.state.settings.theme);

        // 初始化置顶状态同步
        setTimeout(() => {
            this.initializeAlwaysOnTopSetting();
        }, 100);
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
        await this.notesManager.init();

        console.log('✅ 所有组件渲染完成');
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
        // 设置主题选择器的值
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = this.state.settings.theme;
        }

        // 设置毛玻璃效果开关
        const glassEffect = document.getElementById('glass-effect');
        if (glassEffect) {
            glassEffect.checked = this.state.settings.glassEffect;
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
        }

        // 设置通知开关
        const enableNotifications = document.getElementById('enable-notifications');
        if (enableNotifications) {
            enableNotifications.checked = this.state.settings.enableNotifications;
        }

        // 设置社区URL输入框
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

    renderPresetWebsites() {
        const container = document.getElementById('preset-websites');
        if (!container) return;

        container.innerHTML = '';

        this.state.settings.online.presetWebsites.forEach(preset => {
            const button = document.createElement('button');
            button.className = 'preset-website-btn';
            button.innerHTML = `
                <span class="preset-icon">${preset.icon}</span>
                <span class="preset-name">${preset.name}</span>
            `;

            // 检查是否是当前激活的URL
            const currentUrl = this.state.settings.online.currentUrl || this.state.settings.communityUrl;
            if (currentUrl === preset.url) {
                button.classList.add('active');
            }

            button.addEventListener('click', () => {
                // 更新设置
                this.state.settings.communityUrl = preset.url;
                this.state.settings.online.currentUrl = preset.url;
                this.state.saveData();

                // 更新webview
                this.updateCommunityUrl(preset.url);

                // 更新URL输入框
                const communityUrlInput = document.getElementById('community-url');
                if (communityUrlInput) {
                    communityUrlInput.value = preset.url;
                }

                // 更新预设选择器
                const urlPreset = document.getElementById('url-preset');
                if (urlPreset) {
                    urlPreset.value = preset.url;
                }

                // 重新渲染按钮状态
                this.renderPresetWebsites();

                console.log('切换到预设网站:', preset.name, preset.url);
            });

            container.appendChild(button);
        });
    }

    updateCommunityUrl(newUrl) {
        const webview = document.getElementById('community-webview');
        if (webview) {
            webview.src = newUrl;
        }
    }

    showUrlUpdateSuccess() {
        // 显示成功提示
        const button = document.getElementById('apply-community-url');
        if (button) {
            const originalText = button.textContent;
            button.textContent = '✓ 已更新';
            button.style.background = '#28a745';

            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 2000);
        }
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // 预设管理器
    showPresetManager() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content preset-manager-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-cog"></i> 管理预设网站</h3>
                    <button class="modal-close-btn">✕</button>
                </div>
                <div class="modal-body">
                    <div class="preset-manager-controls">
                        <button id="add-preset-btn" class="btn btn-primary">
                            <i class="fas fa-plus"></i> 添加新预设
                        </button>
                        <button id="reset-presets-btn" class="btn btn-secondary">
                            <i class="fas fa-undo"></i> 重置默认
                        </button>
                    </div>
                    <div id="preset-manager-list" class="preset-manager-list">
                        <!-- 预设列表将在这里渲染 -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">取消</button>
                    <button class="btn btn-primary modal-confirm">保存</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 渲染预设列表
        this.renderPresetManagerList();

        // 设置事件监听器
        this.setupPresetManagerEvents(modal);
    }

    renderPresetManagerList() {
        const list = document.getElementById('preset-manager-list');
        if (!list) return;

        list.innerHTML = '';

        this.state.settings.online.presetWebsites.forEach((preset, index) => {
            const item = document.createElement('div');
            item.className = 'preset-item';
            item.innerHTML = `
                <div class="preset-item-main">
                    <div class="preset-item-field">
                        <label>图标:</label>
                        <input type="text" class="preset-icon" value="${preset.icon}" placeholder="🌐">
                    </div>
                    <div class="preset-item-field">
                        <label>名称:</label>
                        <input type="text" class="preset-name" value="${preset.name}" placeholder="网站名称">
                    </div>
                    <div class="preset-item-field">
                        <label>URL:</label>
                        <input type="url" class="preset-url" value="${preset.url}" placeholder="https://example.com">
                    </div>
                    <div class="preset-item-field">
                        <label>描述:</label>
                        <input type="text" class="preset-description" value="${preset.description || ''}" placeholder="网站描述">
                    </div>
                </div>
                <div class="preset-item-actions">
                    <button class="btn btn-sm move-up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="btn btn-sm move-down" data-index="${index}" ${index === this.state.settings.online.presetWebsites.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-preset" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
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
            icon: 'fas fa-globe',
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
            },
            {
                id: 'douban',
                name: '豆瓣',
                url: 'https://www.douban.com',
                icon: '📚',
                description: '豆瓣读书影音'
            },
            {
                id: 'bing',
                name: '必应搜索',
                url: 'https://www.bing.com',
                icon: '🔍',
                description: '必应搜索引擎'
            },
            {
                id: 'wikipedia',
                name: '维基百科',
                url: 'https://zh.wikipedia.org',
                icon: '📖',
                description: '维基百科中文'
            },
            {
                id: 'codepen',
                name: 'CodePen',
                url: 'https://codepen.io',
                icon: 'fas fa-code',
                description: '在线代码编辑器'
            },
            {
                id: 'youtube',
                name: 'YouTube',
                url: 'https://www.youtube.com',
                icon: 'fab fa-youtube',
                description: '视频平台'
            },
            {
                id: 'bilibili',
                name: 'Bilibili',
                url: 'https://www.bilibili.com',
                icon: 'fas fa-video',
                description: 'B站视频'
            },
            {
                id: 'zhihu',
                name: '知乎',
                url: 'https://www.zhihu.com',
                icon: '💭',
                description: '知识问答社区'
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
            const icon = item.querySelector('.preset-icon').value.trim();
            const name = item.querySelector('.preset-name').value.trim();
            const url = item.querySelector('.preset-url').value.trim();
            const description = item.querySelector('.preset-description').value.trim();

            if (name && url) {
                newPresets.push({
                    id: this.state.settings.online.presetWebsites[index] ?.id || `custom_${Date.now()}_${index}`,
                    name,
                    url,
                    icon: icon || 'fas fa-globe',
                    description
                });
            }
        });

        this.state.settings.online.presetWebsites = newPresets;
        this.state.saveData();

        // 更新预设选择器
        this.initializePresetSelector();
    }

    // 更新相关方法
    checkForUpdates() {
        if (window.electronAPI && window.electronAPI.checkForUpdates) {
            window.electronAPI.checkForUpdates();
        }
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

// 导出到全局
window.App = App;