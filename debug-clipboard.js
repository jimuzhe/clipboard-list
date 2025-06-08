// 调试剪切板问题
const {
    app,
    clipboard
} = require('electron');

console.log('=== 剪切板调试工具 ===');

function debugClipboard() {
    console.log('\n--- 剪切板状态检查 ---');

    try {
        // 读取当前内容
        const currentText = clipboard.readText();
        console.log('当前剪切板文本长度:', currentText.length);
        console.log('当前剪切板内容预览:', JSON.stringify(currentText.substring(0, 100)));
        console.log('可用格式:', clipboard.availableFormats());

        // 写入测试内容
        const testContent = `测试内容-${Date.now()}`;
        console.log('\n写入测试内容:', testContent);
        clipboard.writeText(testContent);

        // 立即读取
        const readBack = clipboard.readText();
        console.log('立即读取结果:', JSON.stringify(readBack));
        console.log('写入成功:', readBack === testContent ? '✅' : '❌');

        return {
            currentText,
            testContent,
            readBack
        };
    } catch (error) {
        console.error('剪切板操作失败:', error);
        return null;
    }
}

// 如果是主进程启动
if (require.main === module) {
    app.whenReady().then(() => {
        const result = debugClipboard();
        if (result) {
            console.log('\n=== 调试完成 ===');
            setTimeout(() => app.quit(), 1000);
        } else {
            app.quit();
        }
    });
}

module.exports = {
    debugClipboard
};