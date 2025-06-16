// 剪切板管理器
class ClipboardManager {
    constructor(appState) {
        this.appState = appState;
        this.lastClipboardContent = '';
        // 只设置事件监听器，不立即渲染
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 监听剪切板变化事件
        if (window.electronAPI.onClipboardChange) {
            window.electronAPI.onClipboardChange((clipboardItem) => {
                this.handleClipboardChange(clipboardItem);
            });
        }
    }

    init() {
        // 这个方法现在由App类调用，确保数据已加载
        console.log('🔧 剪切板管理器初始化...');
        console.log('📊 当前剪切板数据状态:', {
            totalItems: this.appState.clipboardItems.length,
            pinnedItems: this.appState.clipboardItems.filter(item => item.pinned).length,
            unpinnedItems: this.appState.clipboardItems.filter(item => !item.pinned).length
        });

        this.renderClipboardList();
        console.log('✅ 剪切板管理器初始化完成');

        // 测试URL检测功能
        this.testUrlDetection();
    }

    // 测试URL检测功能
    testUrlDetection() {
        const testUrls = [
            'https://www.google.com',
            'http://example.com',
            'www.baidu.com',
            'google.com',
            'https://github.com/user/repo',
            'ftp://files.example.com',
            'not a url',
            '这不是链接'
        ];

        console.log('🧪 测试URL检测功能:');
        testUrls.forEach(url => {
            const isUrl = this.isURL(url);
            const type = this.detectContentType(url);
            console.log(`测试: "${url}" -> isURL: ${isUrl}, type: ${type}`);
        });
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
        console.log('🔍 内容类型检测 - 检查内容:', content);

        // 检测代码片段
        if (this.isCode(content)) {
            console.log('✅ 识别为代码类型');
            return 'code';
        }

        // 检测URL
        if (this.isURL(content)) {
            console.log('✅ 识别为URL类型');
            return 'url';
        }

        // 检测邮箱
        if (this.isEmail(content)) {
            console.log('✅ 识别为邮箱类型');
            return 'email';
        }

        // 检测图片路径
        if (this.isImagePath(content)) {
            console.log('✅ 识别为图片类型');
            return 'image';
        }

        console.log('✅ 识别为文本类型');
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
        console.log('🔍 URL检测 - 检查内容:', content);

        // 清理内容，去除首尾空白
        const cleanContent = content.trim();

        // 如果内容为空或过短，直接返回false
        if (!cleanContent || cleanContent.length < 4) {
            console.log('❌ URL检测 - 内容过短或为空');
            return false;
        }

        // 首先尝试URL构造函数
        try {
            new URL(cleanContent);
            console.log('✅ URL检测 - 通过URL构造函数验证:', cleanContent);
            return true;
        } catch (error) {
            // URL构造函数失败，尝试其他方法
        }

        // 检测常见的URL模式
        const urlPatterns = [
            /^https?:\/\/[^\s/$.?#].[^\s]*$/i, // http://或https://开头
            /^www\.[^\s/$.?#].[^\s]*$/i, // www.开头
            /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/i, // 域名格式
            /^[^\s/$.?#].[^\s]*\.(com|org|net|edu|gov|mil|int|cn|jp|uk|de|fr|it|ru|br|ca|au|in)$/i // 带常见顶级域名
        ];

        const isUrlPattern = urlPatterns.some(pattern => pattern.test(cleanContent));
        console.log('🔍 URL检测 - 正则表达式结果:', isUrlPattern, '内容:', cleanContent);

        // 如果匹配URL模式，尝试添加协议再次验证
        if (isUrlPattern) {
            try {
                const urlWithProtocol = cleanContent.startsWith('http') ? cleanContent : `http://${cleanContent}`;
                new URL(urlWithProtocol);
                console.log('✅ URL检测 - 添加协议后验证成功:', urlWithProtocol);
                return true;
            } catch (error) {
                console.log('❌ URL检测 - 添加协议后仍验证失败');
            }
        }

        return false;
    }

    isEmail(content) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content);
    }

    isImagePath(content) {
        return /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(content);
    }

    renderClipboardList() {
        console.log('🎨 开始渲染剪切板列表...');
        const container = document.getElementById('clipboard-list');
        if (!container) {
            console.error('❌ 找不到剪切板容器元素 #clipboard-list');
            return;
        }

        console.log('📋 准备渲染的剪切板项目:', this.appState.clipboardItems.length);
        container.innerHTML = '';

        // 分离置顶和非置顶项目
        const pinnedItems = this.appState.clipboardItems.filter(item => item.pinned);
        const unpinnedItems = this.appState.clipboardItems.filter(item => !item.pinned);

        console.log('📌 置顶项目:', pinnedItems.length, '个');
        console.log('📄 普通项目:', unpinnedItems.length, '个');

        // 先显示置顶项目，然后显示普通项目
        const sortedItems = [...pinnedItems, ...unpinnedItems];

        sortedItems.forEach((item, index) => {
            console.log(`🔧 创建第 ${index + 1} 个剪切板项目:`, {
                id: item.id,
                type: item.type,
                pinned: item.pinned
            });
            const element = this.createClipboardItemElement(item);
            container.appendChild(element);
        });

        // 添加置顶分隔线（如果有置顶项目）
        if (pinnedItems.length > 0 && unpinnedItems.length > 0) {
            console.log('➕ 添加置顶分隔线');
            this.addPinnedSeparator(container, pinnedItems.length);
        }

        console.log('✅ 剪切板列表渲染完成，容器中现有:', container.children.length, '个元素');
    }

    createClipboardItemElement(item) {
        const div = document.createElement('div');
        div.className = `clipboard-item ${item.pinned ? 'pinned' : ''}`;
        div.dataset.id = item.id;

        const typeIcon = this.getTypeIcon(item.type);
        const timeAgo = this.formatTimeAgo(item.timestamp);
        // 根据类型显示不同的内容
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
        } // 为URL类型添加打开按钮
        const openButtonHtml = item.type === 'url' ?
            `<button class="control-btn open-url-btn" title="在移记社区中打开链接">
                <i class="fas fa-external-link-alt"></i>
            </button>` : '';

        console.log('🔧 创建剪切板元素:', {
            id: item.id,
            type: item.type,
            content: item.content.substring(0, 50) + '...',
            hasOpenButton: item.type === 'url',
            openButtonHtml: openButtonHtml
        });

        div.innerHTML = `
            <div class="clipboard-item-header">
                <span class="clipboard-item-type">${typeIcon} ${item.type.toUpperCase()}</span>
                <div class="clipboard-item-actions">
                    ${openButtonHtml}
                    <button class="control-btn pin-btn ${item.pinned ? 'pinned' : ''}" title="${item.pinned ? '取消置顶' : '置顶'}">
                        <i class="fas ${item.pinned ? 'fa-thumbtack' : 'fa-thumbtack'}"></i>
                    </button>
                    <button class="control-btn copy-btn" title="复制"><i class="fas fa-copy"></i></button>
                    <button class="control-btn edit-btn" title="编辑"><i class="fas fa-edit"></i></button>
                    <button class="control-btn delete-btn" title="删除"><i class="fas fa-trash"></i></button>
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
        }); // 打开URL按钮（仅对URL类型显示）
        const openUrlBtn = element.querySelector('.open-url-btn');
        if (openUrlBtn) {
            openUrlBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openUrlInCommunity(item.content);
            });
        }

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

    showEditModal(item) {
        // 创建编辑模态框
        const modal = document.createElement('div');
        modal.className = 'modal active edit-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">
                        <span class="modal-icon"><i class="fas fa-edit"></i></span>
                        <h3>编辑剪切板内容</h3>
                    </div>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="edit-content-type" class="form-label">
                            <span class="label-icon"><i class="fas fa-tag"></i></span>
                            内容类型
                        </label>
                        <select id="edit-content-type" class="form-select">
                            <option value="text" ${item.type === 'text' ? 'selected' : ''}><i class="fas fa-file-alt"></i> 文本</option>
                            <option value="code" ${item.type === 'code' ? 'selected' : ''}><i class="fas fa-code"></i> 代码</option>
                            <option value="url" ${item.type === 'url' ? 'selected' : ''}><i class="fas fa-link"></i> 链接</option>
                            <option value="email" ${item.type === 'email' ? 'selected' : ''}><i class="fas fa-envelope"></i> 邮箱</option>
                            <option value="image" ${item.type === 'image' ? 'selected' : ''}><i class="fas fa-image"></i> 图片</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-content" class="form-label">
                            <span class="label-icon"><i class="fas fa-edit"></i></span>
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
                                <span class="feature-icon"><i class="fas fa-thumbtack"></i></span>
                                置顶显示
                            </span>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancel-edit">取消</button>
                    <button class="btn btn-primary" id="save-edit"><i class="fas fa-save"></i> 保存</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 设置字符计数器
        const contentTextarea = modal.querySelector('#edit-content');
        const contentCounter = modal.querySelector('#edit-content-counter');

        // 初始化计数器
        contentCounter.textContent = contentTextarea.value.length;
        // 内容字符计数
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
            this.showNotification('提示', '项目为空或都已置顶，无需清理');
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
            code: '<i class="fas fa-code"></i>',
            url: '<i class="fas fa-globe"></i>',
            email: '<i class="fas fa-envelope"></i>',
            image: '<i class="fas fa-image"></i>',
            text: '<i class="fas fa-file-alt"></i>'
        };
        return icons[type] || '<i class="fas fa-file-alt"></i>';
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
        // 检查是否启用了桌面通知
        if (!this.appState.settings.enableNotifications) {
            return;
        }

        if (window.electronAPI.showNotification) {
            window.electronAPI.showNotification(title, body);
        }
    }
    openUrlInCommunity(url) {
        try {
            // 验证URL格式
            let validUrl = url;
            try {
                new URL(url);
            } catch {
                // 如果不是完整URL，尝试添加http://
                if (!/^https?:\/\//i.test(url)) {
                    validUrl = 'http://' + url;
                }
            }

            // 获取社区页面的URL
            const communityUrl = this.appState.settings.online.currentUrl || this.appState.settings.communityUrl;

            console.log('🌐 准备在移记社区中打开链接:', validUrl);
            console.log('🌐 当前社区URL:', communityUrl);

            // 方案1: 如果目标URL就是社区地址，直接跳转
            if (validUrl.toLowerCase().includes('8.130.41.186:3000')) {
                if (window.electronAPI.openUrlInCommunity) {
                    window.electronAPI.openUrlInCommunity(validUrl);
                } else {
                    // 直接在应用内导航
                    if (window.app && window.app.navigateToOnlinePageWithUrl) {
                        window.app.navigateToOnlinePageWithUrl(validUrl);
                    }
                }
            } else {
                // 方案2: 构建完整的URL，将目标链接作为参数传递给社区页面
                const encodedUrl = encodeURIComponent(validUrl);
                const fullUrl = `${communityUrl}?openUrl=${encodedUrl}`;

                console.log('🌐 构建的完整URL:', fullUrl);

                // 发送事件给主进程，切换到在线页面并打开链接
                if (window.electronAPI.openUrlInCommunity) {
                    window.electronAPI.openUrlInCommunity(fullUrl);
                } else {
                    // 备用方案：直接在应用内导航
                    if (window.app && window.app.navigateToOnlinePageWithUrl) {
                        window.app.navigateToOnlinePageWithUrl(fullUrl);
                    } else {
                        // 最后备用方案：外部浏览器打开
                        window.electronAPI.openExternal(validUrl);
                    }
                }
            }

            // 显示通知
            this.showNotification('链接已打开', '链接正在移记社区中打开');

            // 切换到在线页面
            if (window.app && window.app.switchToPage) {
                window.app.switchToPage('online');
            }

        } catch (error) {
            console.error('❌ 打开链接失败:', error);
            this.showNotification('打开失败', '无法打开链接');

            // 错误时尝试直接在外部浏览器打开
            try {
                window.electronAPI.openExternal(url);
            } catch (fallbackError) {
                console.error('❌ 备用打开方案也失败:', fallbackError);
            }
        }
    }
}

// 导出给其他模块使用
window.ClipboardManager = ClipboardManager;