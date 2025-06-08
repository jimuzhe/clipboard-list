const {
    app,
    clipboard
} = require('electron');
const {
    ClipboardManager
} = require('./dist/managers/ClipboardManager');

console.log('🚀 Testing new clipboard monitoring...');

app.whenReady().then(() => {
    const clipboardManager = new ClipboardManager();

    // 监听剪切板变化事件
    clipboardManager.on('clipboard-changed', (item) => {
        console.log('📋 Clipboard changed:', {
            type: item.type,
            size: item.size,
            preview: item.preview,
            timestamp: item.timestamp
        });
    });

    // 开始监控
    clipboardManager.startMonitoring();
    console.log('✅ Clipboard monitoring started');
    console.log('📝 Now copy some text to test the clipboard monitoring...');
    console.log('Press Ctrl+C to exit');

    // 测试写入剪切板
    setTimeout(() => {
        console.log('🧪 Testing programmatic clipboard write...');
        clipboardManager.writeToClipboard('Test content from script');
    }, 2000);

    // 退出处理
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping clipboard monitoring...');
        clipboardManager.stopMonitoring();
        clipboardManager.destroy();
        app.quit();
    });
}).catch(console.error);