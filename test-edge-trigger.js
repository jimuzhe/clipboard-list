/**
 * 测试边界触发功能
 * 这个脚本用于测试光标移动到屏幕边缘时的窗口显示/隐藏功能
 */

const {
    app,
    BrowserWindow,
    screen
} = require('electron');
const path = require('path');

let testWindow = null;

function createTestWindow() {
    const {
        width: screenWidth,
        height: screenHeight
    } = screen.getPrimaryDisplay().workAreaSize;

    testWindow = new BrowserWindow({
        width: 300,
        height: 600,
        x: screenWidth - 300,
        y: 50,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        transparent: true,
        show: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    // 加载测试页面
    testWindow.loadFile(path.join(__dirname, 'test-edge-trigger.html'));

    // 模拟吸附到右边缘并隐藏
    setTimeout(() => {
        console.log('模拟吸附到右边缘...');
        testWindow.setBounds({
            x: screenWidth - 5, // 几乎完全隐藏在右边缘
            y: 50,
            width: 300,
            height: 600
        });
        testWindow.hide();
        console.log('窗口已隐藏到右边缘');

        // 开始监听光标位置
        startCursorMonitoring();
    }, 2000);
}

function startCursorMonitoring() {
    const triggerZoneWidth = 5;
    const screenWidth = screen.getPrimaryDisplay().workAreaSize.width;

    const checkInterval = setInterval(() => {
        if (!testWindow) {
            clearInterval(checkInterval);
            return;
        }

        try {
            const cursorPos = screen.getCursorScreenPoint();
            const windowBounds = testWindow.getBounds();

            // 检查光标是否在右边缘触发区域
            if (cursorPos.x >= screenWidth - triggerZoneWidth &&
                cursorPos.y >= windowBounds.y &&
                cursorPos.y <= windowBounds.y + windowBounds.height) {

                if (!testWindow.isVisible()) {
                    console.log('触发显示！光标位置:', cursorPos);
                    showWindow();
                }
            } else if (testWindow.isVisible()) {
                // 检查光标是否离开窗口区域
                const buffer = 20;
                const isInWindow = cursorPos.x >= windowBounds.x - buffer &&
                    cursorPos.x <= windowBounds.x + windowBounds.width + buffer &&
                    cursorPos.y >= windowBounds.y - buffer &&
                    cursorPos.y <= windowBounds.y + windowBounds.height + buffer;

                if (!isInWindow) {
                    console.log('光标离开窗口区域，准备隐藏...');
                    setTimeout(() => {
                        if (testWindow && testWindow.isVisible()) {
                            hideWindow();
                        }
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('检查光标位置时出错:', error);
        }
    }, 50);
}

function showWindow() {
    if (testWindow) {
        const screenWidth = screen.getPrimaryDisplay().workAreaSize.width;
        testWindow.setBounds({
            x: screenWidth - 300,
            y: 50,
            width: 300,
            height: 600
        });
        testWindow.show();
        testWindow.focus();
        console.log('窗口已显示');
    }
}

function hideWindow() {
    if (testWindow) {
        const screenWidth = screen.getPrimaryDisplay().workAreaSize.width;
        testWindow.setBounds({
            x: screenWidth - 5,
            y: 50,
            width: 300,
            height: 600
        });
        testWindow.hide();
        console.log('窗口已隐藏');
    }
}

app.whenReady().then(() => {
    createTestWindow();

    console.log('边界触发测试已启动');
    console.log('将光标移动到屏幕右边缘来测试触发功能');
    console.log('按 Ctrl+C 退出测试');
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createTestWindow();
    }
});