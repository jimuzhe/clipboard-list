// 测试剪切板内容获取
const {
    clipboard
} = require('electron');

console.log('=== 剪切板内容测试 ===');

// 读取当前剪切板内容
function testClipboardRead() {
    try {
        const text = clipboard.readText();
        const formats = clipboard.availableFormats();

        console.log('当前剪切板文本内容:', JSON.stringify(text));
        console.log('内容长度:', text.length);
        console.log('可用格式:', formats);

        // 如果有HTML内容
        if (formats.includes('text/html')) {
            const html = clipboard.readHTML();
            console.log('HTML内容:', html.substring(0, 200) + '...');
        }

        // 如果有RTF内容
        if (formats.includes('text/rtf')) {
            const rtf = clipboard.readRTF();
            console.log('RTF内容:', rtf.substring(0, 200) + '...');
        }

        return text;
    } catch (error) {
        console.error('读取剪切板失败:', error);
        return null;
    }
}

// 测试写入和读取
function testClipboardWrite() {
    try {
        const testContent = 'This is a test content - ' + new Date().toLocaleTimeString();
        console.log('\n写入测试内容:', testContent);

        clipboard.writeText(testContent);

        setTimeout(() => {
            const readContent = clipboard.readText();
            console.log('读取到的内容:', JSON.stringify(readContent));
            console.log('内容匹配:', readContent === testContent ? '✅' : '❌');
        }, 100);

    } catch (error) {
        console.error('写入剪切板失败:', error);
    }
}

// 持续监控剪切板变化
let lastContent = '';

function monitorClipboard() {
    const current = testClipboardRead();
    if (current !== lastContent) {
        console.log('\n=== 检测到剪切板变化 ===');
        console.log('时间:', new Date().toLocaleTimeString());
        console.log('新内容:', JSON.stringify(current));
        console.log('上次内容:', JSON.stringify(lastContent));
        lastContent = current;
    }
}

console.log('初始剪切板状态:');
testClipboardRead();

console.log('\n开始监控剪切板变化...');
console.log('请复制一些内容来测试\n');

// 每500ms检查一次
setInterval(monitorClipboard, 500);

// 5秒后测试写入
setTimeout(() => {
    console.log('\n=== 测试写入功能 ===');
    testClipboardWrite();
}, 5000);