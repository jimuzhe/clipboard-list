/**
 * 测试原生剪切板管理器
 * 验证基于Windows原生事件的剪切板监听功能
 */

const {
    app,
    BrowserWindow,
    clipboard
} = require('electron');

// 模拟logger
const logger = {
    info: console.log,
    debug: console.log,
    warn: console.warn,
    error: console.error
};

// 简化的剪切板管理器测试版本
class TestClipboardManager {
    constructor() {
        this.isMonitoring = false;
        this.lastContent = '';
        this.lastClipboardTime = 0;
        this.clipboardWatcher = null;
        this.ignoreNextChange = false;

        this.initializeClipboard();
        console.log('✅ 原生剪切板管理器初始化完成');
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
    startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ 剪切板监听已经活跃');
            return;
        }

        this.isMonitoring = true;

        // 使用更频繁的检查来捕获Ctrl+X操作
        this.clipboardWatcher = setInterval(() => {
            this.checkClipboardChanges();
        }, 800); // 800ms检查一次，更好地捕获剪切操作

        console.log('🚀 原生剪切板监听已启动 (优化Ctrl+X检测)');
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

        console.log('⏹️ 原生剪切板监听已停止');
    }

    checkClipboardChanges() {
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
                console.log('✨ 检测到剪切板变化!');
                console.log('🔤 内容类型:', this.detectContentType(currentContent));
                console.log('📏 内容长度:', currentContent.length);
                console.log('📝 内容预览:', currentContent.substring(0, 100));
                console.log('⏰ 时间:', new Date().toLocaleTimeString());
                console.log('💡 提示: 如果是Ctrl+X剪切操作，内容可能延迟出现');
                console.log('---');

                this.lastContent = currentContent;
                this.lastClipboardTime = currentTime;
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
        if (/function\s+\w+|class\s+\w+|import\s+/.test(content)) {
            return '💻 代码';
        }
        if (/^[a-zA-Z]:\\|^\/|^~\//.test(content.trim())) {
            return '📁 文件路径';
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
async function testNativeClipboard() {
    console.log('🧪 开始测试原生剪切板管理器');
    console.log('=====================================');

    const manager = new TestClipboardManager();

    // 启动监听
    manager.startMonitoring();
    console.log('📌 请在其他应用中复制一些内容来测试...');
    console.log('📌 测试建议:');
    console.log('   • Ctrl+C (复制) - 应该立即检测到');
    console.log('   • Ctrl+X (剪切) - 可能有延迟，会多次检查');
    console.log('   • Ctrl+V (粘贴) - 也会触发检测');
    console.log('📌 程序将自动检测剪切板变化');
    console.log('📌 10秒后自动进行测试写入');

    // 10秒后测试写入
    setTimeout(() => {
        console.log('\n🔧 测试程序写入剪切板...');
        manager.writeToClipboard('这是一个测试文本 - ' + new Date().toLocaleTimeString());

        setTimeout(() => {
            manager.writeToClipboard('https://www.example.com');
        }, 2000);

        setTimeout(() => {
            manager.writeToClipboard('function testFunction() { return "Hello World"; }');
        }, 4000);

    }, 10000);

    // 60秒后停止测试
    setTimeout(() => {
        console.log('\n⏹️ 测试结束，停止监听');
        manager.stopMonitoring();
        app.quit();
    }, 60000);
}

// Electron 应用启动
app.whenReady().then(() => {
    testNativeClipboard();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});