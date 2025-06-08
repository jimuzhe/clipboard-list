/**
 * 专门测试Ctrl+X剪切操作的剪切板管理器
 * 解决剪切操作延迟检测的问题
 */

const {
    app,
    BrowserWindow,
    clipboard,
    globalShortcut
} = require('electron');

class AdvancedClipboardManager {
    constructor() {
        this.isMonitoring = false;
        this.lastContent = '';
        this.lastClipboardTime = 0;
        this.clipboardWatcher = null;
        this.ignoreNextChange = false;
        this.cutOperationDetected = false;

        this.initializeClipboard();
        this.setupGlobalShortcuts();
        console.log('✅ 高级剪切板管理器初始化完成');
    }

    initializeClipboard() {
        try {
            this.lastContent = clipboard.readText() || '';
            this.lastClipboardTime = Date.now();
            console.log('📋 初始剪切板内容:', this.lastContent.substring(0, 50));
        } catch (error) {
            console.error('❌ 初始化剪切板失败:', error);
        }
    }

    setupGlobalShortcuts() {
        try {
            // 监听全局Ctrl+C
            globalShortcut.register('CommandOrControl+C', () => {
                console.log('🎯 检测到全局 Ctrl+C');
                setTimeout(() => this.checkClipboardChanges('copy'), 50);
            });

            // 监听全局Ctrl+X  
            globalShortcut.register('CommandOrControl+X', () => {
                console.log('✂️ 检测到全局 Ctrl+X (剪切操作)');
                this.cutOperationDetected = true;
                this.handleCutOperation();
            });

            // 监听全局Ctrl+V
            globalShortcut.register('CommandOrControl+V', () => {
                console.log('📋 检测到全局 Ctrl+V');
                setTimeout(() => this.checkClipboardChanges('paste'), 50);
            });

            console.log('🔥 全局快捷键监听已设置');
        } catch (error) {
            console.error('❌ 设置全局快捷键失败:', error);
        }
    }

    handleCutOperation() {
        // 剪切操作可能需要多次检查，因为不同应用程序的行为不同
        const checkTimes = [100, 200, 400, 800, 1200, 1600]; // 逐渐增加的延迟

        checkTimes.forEach((delay, index) => {
            setTimeout(() => {
                console.log(`🔍 剪切操作检查 ${index + 1}/${checkTimes.length} (${delay}ms)`);
                this.checkClipboardChanges('cut');
            }, delay);
        });

        // 2秒后重置剪切操作标志
        setTimeout(() => {
            this.cutOperationDetected = false;
        }, 2000);
    }

    startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ 剪切板监听已经活跃');
            return;
        }

        this.isMonitoring = true;

        // 更频繁的轮询作为备用机制
        this.clipboardWatcher = setInterval(() => {
            this.checkClipboardChanges('polling');
        }, 500); // 500ms轮询

        console.log('🚀 高级剪切板监听已启动');
    }

    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }

        this.isMonitoring = false;

        if (this.clipboardWatcher) {
            clearInterval(this.clipboardWatcher);
            this.clipboardWatcher = null;
        }

        // 注销全局快捷键
        globalShortcut.unregisterAll();

        console.log('⏹️ 高级剪切板监听已停止');
    }

    checkClipboardChanges(source = 'unknown') {
        if (!this.isMonitoring) return;

        try {
            const currentContent = clipboard.readText();
            const currentTime = Date.now();

            if (currentContent && currentContent !== this.lastContent) {
                if (this.ignoreNextChange) {
                    this.ignoreNextChange = false;
                    this.lastContent = currentContent;
                    this.lastClipboardTime = currentTime;
                    console.log('🔄 忽略程序写入的剪切板变化');
                    return;
                }

                const operationType = this.cutOperationDetected ? '✂️ 剪切' : '📋 复制';

                console.log(`✨ 检测到剪切板变化! (${source})`);
                console.log(`🎭 操作类型: ${operationType}`);
                console.log('🔤 内容类型:', this.detectContentType(currentContent));
                console.log('📏 内容长度:', currentContent.length);
                console.log('📝 内容预览:', currentContent.substring(0, 100));
                console.log('⏰ 时间:', new Date().toLocaleTimeString());
                console.log('⏱️ 距离上次变化:', currentTime - this.lastClipboardTime + 'ms');
                console.log('---');

                this.lastContent = currentContent;
                this.lastClipboardTime = currentTime;

                // 如果是剪切操作，重置标志
                if (this.cutOperationDetected) {
                    this.cutOperationDetected = false;
                }
            }
        } catch (error) {
            console.error('❌ 检查剪切板变化时出错:', error);
        }
    }

    detectContentType(content) {
        if (/^https?:\/\//.test(content.trim())) {
            return '🌐 URL';
        }
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.trim())) {
            return '📧 邮箱';
        }
        if (/function\s+\w+|class\s+\w+|import\s+|const\s+\w+|let\s+\w+/.test(content)) {
            return '💻 代码';
        }
        if (/^[a-zA-Z]:\\|^\/|^~\//.test(content.trim()) && content.length < 500) {
            return '📁 文件路径';
        }
        if (content.includes('\n') && content.length > 100) {
            return '📄 多行文本';
        }
        return '📄 文本';
    }

    writeToClipboard(text) {
        try {
            this.ignoreNextChange = true;
            clipboard.writeText(text);
            this.lastContent = text;
            this.lastClipboardTime = Date.now();

            setTimeout(() => {
                if (this.ignoreNextChange) {
                    this.ignoreNextChange = false;
                }
            }, 1000);

            console.log('✍️ 写入剪切板:', text.substring(0, 50));
        } catch (error) {
            console.error('❌ 写入剪切板失败:', error);
            this.ignoreNextChange = false;
        }
    }
}

// 测试函数
async function testAdvancedClipboard() {
    console.log('🧪 开始测试高级剪切板管理器 (专注Ctrl+X)');
    console.log('================================================');

    const manager = new AdvancedClipboardManager();

    // 启动监听
    manager.startMonitoring();

    console.log('📌 高级测试说明:');
    console.log('   🔸 已设置全局快捷键监听');
    console.log('   🔸 Ctrl+C: 立即检测复制操作');
    console.log('   🔸 Ctrl+X: 多次检查剪切操作 (100ms-1600ms)');
    console.log('   🔸 Ctrl+V: 检测粘贴操作');
    console.log('   🔸 500ms轮询作为备用机制');
    console.log('');
    console.log('💡 测试建议:');
    console.log('   1. 在记事本中输入一些文字');
    console.log('   2. 选中文字后按 Ctrl+X (剪切)');
    console.log('   3. 观察是否能检测到剪切板变化');
    console.log('   4. 在别处按 Ctrl+V 粘贴');
    console.log('');
    console.log('🔄 15秒后自动进行测试写入...');

    // 15秒后测试写入
    setTimeout(() => {
        console.log('\n🔧 自动测试序列开始...');

        manager.writeToClipboard('测试文本1 - ' + new Date().toLocaleTimeString());

        setTimeout(() => {
            manager.writeToClipboard('测试代码: function hello() { return "world"; }');
        }, 2000);

        setTimeout(() => {
            manager.writeToClipboard('https://github.com/electron/electron');
        }, 4000);

        setTimeout(() => {
            manager.writeToClipboard('测试多行文本\n第二行内容\n第三行内容\n结束');
        }, 6000);

    }, 15000);

    // 90秒后停止测试
    setTimeout(() => {
        console.log('\n⏹️ 测试结束，停止监听');
        manager.stopMonitoring();
        app.quit();
    }, 90000);
}

// Electron 应用启动
app.whenReady().then(() => {
    testAdvancedClipboard();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    // 清理全局快捷键
    globalShortcut.unregisterAll();
});